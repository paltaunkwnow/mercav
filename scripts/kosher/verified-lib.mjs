// Funciones puras para importar los lugares verificados de prisma/kosher-places/*.json (cada archivo sale de la lista
// oficial de una certificadora). Sin dependencias: las usan import-verified.mjs (build), prisma/seed-kosher.mts y los
// tests. Lo que toca la base está en import-verified.mjs.
//
// Archivo: { "verifiedAt": "YYYY-MM-DD", "places": [ { slug, name, type, lat, lng, address, city, country, countryCode,
// status, agencyName?, foodCategory?, phone?, website?, notes?, sourceUrl, hours?, priceLevel?, services?, … } ] }
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ADDR_CITY_MAX_KM, DUPLICATE_METERS, assignCity, foldText, haversineKm, isUntouchedOsm, nameTokens, nearestTimezone } from "./osm-lib.mjs";

// Enums de prisma/schema.prisma y claves de lib/kosher/labels.ts (el test verifica que sigan iguales).
export const PLACE_TYPES = ["restaurant", "bakery", "butcher", "grocery_branch", "judaica", "synagogue", "mikvah", "school", "hotel", "community", "museum"];
export const STATUSES = ["certified", "supervised", "self_declared", "some_products", "some_dishes", "community_report", "unknown", "kosher_style", "disputed", "closed"];
export const FOODS = ["meat", "dairy", "parve"];
export const NUSACH = ["ashkenaz", "sefarad", "edot_hamizrach", "spanish_portuguese", "yemenite", "chabad", "other"];
export const DENOMINATIONS = ["orthodox", "conservative", "other"];
export const STREAMS = ["modern", "yeshivish", "chabad", "hasidic", "sephardi", "other"];
export const SERVICES = ["breakfast", "lunch", "dinner", "takeaway", "delivery", "reservations", "catering", "shabbat_meals", "wifi", "accessible"];
/** Igual que FOOD_TYPES de lib/kosher/labels.ts. */
export const FOOD_TYPES = ["restaurant", "bakery", "butcher", "hotel", "grocery_branch"];

/** Campos que el archivo define por completo: lo que falta en el archivo queda vacío en la base. */
export const MANAGED_KEYS = [
  "name", "nameLocal", "type", "lat", "lng", "address", "city", "country", "countryCode", "status", "agencyName",
  "foodCategory", "notes", "phone", "website", "sourceUrl", "hours", "timezone", "priceLevel", "services", "nusach",
  "denomination", "orthodoxStream", "glatt", "beitYosef", "chalavIsrael", "patIsrael", "source", "verifiedAt", "confirmedAt",
];

const KNOWN_KEYS = new Set([
  "slug", "name", "nameLocal", "type", "lat", "lng", "address", "city", "country", "countryCode", "status", "agencyName",
  "foodCategory", "notes", "phone", "website", "sourceUrl", "hours", "timezone", "priceLevel", "services", "nusach",
  "denomination", "orthodoxStream", "glatt", "beitYosef", "chalavIsrael", "patIsrael",
]);
const FLAGS = ["glatt", "beitYosef", "chalavIsrael", "patIsrael"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Caja amplia de Latinoamérica y el Caribe: atrapa signos cambiados y lat/lng invertidas lejos de la región. */
const LAT_RANGE = [-60, 33];
const LNG_RANGE = [-120, -28];

// ── Horario: mismas reglas que parseHours de lib/kosher/hours.ts ────────────

const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const DAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"];
const MAX_PERIODS_PER_DAY = 4;
const minutesOf = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export function parseHours(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const day of DAY_KEYS) {
    const raw = value[day];
    if (!Array.isArray(raw)) continue;
    const periods = raw
      .filter((p) => !!p && typeof p === "object" && typeof p.open === "string" && typeof p.close === "string")
      .map((p) => ({ open: p.open.trim(), close: p.close.trim() }))
      .filter((p) => TIME.test(p.open) && TIME.test(p.close) && p.open !== "24:00" && p.open !== p.close)
      .sort((a, b) => minutesOf(a.open) - minutesOf(b.open))
      .slice(0, MAX_PERIODS_PER_DAY);
    if (periods.length) out[day] = periods;
  }
  return Object.keys(out).length ? out : null;
}

const countPeriods = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? Object.values(value).reduce((n, v) => n + (Array.isArray(v) ? v.length : 1), 0) : 0;

// ── Validación ──────────────────────────────────────────────────────────────

export function httpUrl(value) {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validTimezone(value) {
  if (typeof value !== "string" || !value.includes("/")) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** "2026-10-12" → mediodía UTC (así la fecha no cambia de día al mostrarla en la zona del lugar). */
export function parseVerifiedAt(value, now = new Date()) {
  if (typeof value !== "string") return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  // Ni antes de 2020 ni en el futuro (un día de margen por zonas horarias).
  if (date.getUTCFullYear() < 2020 || date.getTime() > now.getTime() + 36 * 3600 * 1000) return null;
  return date;
}

const text = (value, max) => (typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim().replace(/\s+/g, " ") : null);

/**
 * Valida un lugar del archivo y lo deja listo para la base. errors: no se importa. warnings: se importa sin ese dato.
 * cities: data/kosher/latam-cities.json (normaliza la ciudad a su área metropolitana, como el import de OSM).
 */
export function validateEntry(raw, { verifiedAt, cities }) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { place: null, errors: ["no es un objeto"], warnings };

  const slug = typeof raw.slug === "string" && raw.slug.length <= 80 && SLUG.test(raw.slug) ? raw.slug : null;
  if (!slug) errors.push(`slug inválido (${JSON.stringify(raw.slug)}): minúsculas, números y guiones, hasta 80`);
  const name = typeof raw.name === "string" ? raw.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 120) errors.push("name entre 2 y 120 caracteres");
  if (!PLACE_TYPES.includes(raw.type)) errors.push(`type inválido (${JSON.stringify(raw.type)})`);
  if (!STATUSES.includes(raw.status)) errors.push(`status inválido (${JSON.stringify(raw.status)})`);
  const lat = raw.lat;
  const lng = raw.lng;
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < LAT_RANGE[0] || lat > LAT_RANGE[1]) errors.push(`lat fuera de Latinoamérica (${lat})`);
  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < LNG_RANGE[0] || lng > LNG_RANGE[1]) errors.push(`lng fuera de Latinoamérica (${lng})`);
  const address = text(raw.address, 200);
  if (!address) errors.push("falta address (hasta 200 caracteres)");
  const fileCity = text(raw.city, 80);
  if (!fileCity) errors.push("falta city");
  const fileCountry = text(raw.country, 60);
  if (!fileCountry) errors.push("falta country");
  const countryCode = typeof raw.countryCode === "string" && /^[A-Z]{2}$/.test(raw.countryCode) ? raw.countryCode : null;
  const countries = new Set(cities.map((c) => c.countryCode));
  if (!countryCode || !countries.has(countryCode)) errors.push(`countryCode no es de un país de Mercav (${JSON.stringify(raw.countryCode)})`);
  const sourceUrl = httpUrl(raw.sourceUrl);
  if (!sourceUrl) errors.push("sourceUrl tiene que ser una URL http(s)");
  const agencyName = raw.agencyName == null ? null : text(raw.agencyName, 80);
  if (raw.agencyName != null && !agencyName) errors.push("agencyName vacío o de más de 80 caracteres");
  if (raw.status === "certified" && !agencyName) errors.push("status certified sin agencyName");

  // Coordenadas lejos de la ciudad que nombra el archivo: casi siempre lat/lng invertidas o con el signo cambiado.
  if (!errors.length) {
    const named = cities.find((c) => c.countryCode === countryCode && [c.city, ...(c.aliases ?? [])].some((n) => foldText(n) === foldText(fileCity)));
    const km = named ? haversineKm({ lat, lng }, named) : 0;
    if (named && km > ADDR_CITY_MAX_KM) errors.push(`las coordenadas quedan a ${Math.round(km)} km de ${named.city}`);
  }
  for (const key of Object.keys(raw)) if (!KNOWN_KEYS.has(key)) warnings.push(`campo desconocido "${key}" (se ignora)`);
  if (errors.length) return { place: null, errors, warnings };

  const optionalEnum = (key, values) => {
    if (raw[key] == null) return null;
    if (values.includes(raw[key])) return raw[key];
    warnings.push(`${key} inválido (${JSON.stringify(raw[key])}), se ignora`);
    return null;
  };
  const optionalText = (key, max) => {
    if (raw[key] == null) return null;
    const value = text(raw[key], max);
    if (!value) warnings.push(`${key} vacío o de más de ${max} caracteres, se ignora`);
    return value;
  };

  let website = null;
  if (raw.website != null) {
    website = httpUrl(raw.website);
    if (!website) warnings.push("website no es http(s), se ignora");
  }
  let phone = optionalText("phone", 40);
  if (phone && (phone.match(/\d/g) ?? []).length < 6) {
    warnings.push(`phone sin suficientes dígitos (${phone}), se ignora`);
    phone = null;
  }
  let hours = null;
  if (raw.hours != null) {
    hours = parseHours(raw.hours);
    if (!hours) warnings.push("hours sin ningún turno válido (HH:MM, días 0–6), se ignora");
    else if (countPeriods(hours) < countPeriods(raw.hours)) warnings.push("hours tiene turnos inválidos o de más, se descartan");
  }
  let priceLevel = null;
  if (raw.priceLevel != null) {
    if (Number.isInteger(raw.priceLevel) && raw.priceLevel >= 1 && raw.priceLevel <= 4) priceLevel = raw.priceLevel;
    else warnings.push(`priceLevel tiene que ser 1 a 4 (${JSON.stringify(raw.priceLevel)}), se ignora`);
  }
  let services = [];
  if (raw.services != null) {
    if (!Array.isArray(raw.services)) warnings.push("services tiene que ser una lista, se ignora");
    else {
      const unknown = raw.services.filter((s) => !SERVICES.includes(s));
      if (unknown.length) warnings.push(`services desconocidos: ${unknown.join(", ")}`);
      services = SERVICES.filter((s) => raw.services.includes(s));
    }
  }
  const flags = {};
  for (const key of FLAGS) {
    if (raw[key] == null) flags[key] = null;
    else if (typeof raw[key] === "boolean") flags[key] = raw[key];
    else {
      warnings.push(`${key} tiene que ser true o false, se ignora`);
      flags[key] = null;
    }
  }

  // Ciudad: la del área metropolitana de la lista curada (Las Condes cuenta como Santiago); el barrio queda en address.
  const assigned = assignCity({ lat, lng, countryCode, addrCity: fileCity }, cities);
  const curated = assigned?.city ?? null;
  let city = fileCity;
  let country = fileCountry;
  let fullAddress = address;
  if (curated) {
    city = curated.city;
    country = curated.country;
    const sameCity = [curated.city, ...(curated.aliases ?? [])].some((n) => foldText(n) === foldText(fileCity));
    if (!sameCity && !foldText(address).includes(foldText(fileCity))) fullAddress = `${address}, ${fileCity}`.slice(0, 200);
  }
  let timezone = null;
  if (raw.timezone != null) {
    if (validTimezone(raw.timezone)) timezone = raw.timezone;
    else warnings.push(`timezone inválida (${JSON.stringify(raw.timezone)}), se usa la de la ciudad`);
  }
  timezone ??= curated?.timezone ?? nearestTimezone({ lat, lng, countryCode }, cities, null);

  const place = {
    slug,
    name,
    nameLocal: optionalText("nameLocal", 120),
    type: raw.type,
    lat,
    lng,
    address: fullAddress,
    city,
    country,
    countryCode,
    status: raw.status,
    agencyName,
    foodCategory: optionalEnum("foodCategory", FOODS),
    notes: optionalText("notes", 2000),
    phone,
    website,
    sourceUrl,
    hours,
    timezone,
    priceLevel,
    services,
    nusach: optionalEnum("nusach", NUSACH),
    denomination: optionalEnum("denomination", DENOMINATIONS),
    orthodoxStream: optionalEnum("orthodoxStream", STREAMS),
    ...flags,
    source: "seed",
    verifiedAt,
    confirmedAt: verifiedAt,
    communityCity: curated ? curated.slug : null,
  };
  return { place, errors, warnings };
}

/**
 * Lee y valida los archivos de una carpeta. Devuelve los lugares válidos, los problemas por lugar y todos los slugs
 * que aparecen (aunque el lugar tenga errores: el seed manual no tiene que borrarlos por un error de tipeo).
 * reservedSlugs: los de prisma/seed-kosher.mts, que se cargan a mano y no pueden repetirse acá.
 */
export function readVerifiedDir(dir, { cities, reservedSlugs = new Set(), now = new Date() }) {
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [];
  const places = [];
  const problems = [];
  const slugs = new Set();
  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(join(dir, file), "utf8"));
    } catch (error) {
      problems.push({ file, slug: null, errors: [`JSON inválido: ${error.message}`], warnings: [] });
      continue;
    }
    const verifiedAt = parseVerifiedAt(parsed?.verifiedAt, now);
    if (!verifiedAt || !Array.isArray(parsed?.places)) {
      problems.push({ file, slug: null, errors: [!verifiedAt ? `verifiedAt inválido (${JSON.stringify(parsed?.verifiedAt)})` : "falta la lista places"], warnings: [] });
      for (const p of Array.isArray(parsed?.places) ? parsed.places : []) if (typeof p?.slug === "string") slugs.add(p.slug);
      continue;
    }
    for (const raw of parsed.places) {
      const { place, errors, warnings } = validateEntry(raw, { verifiedAt, cities });
      const slug = typeof raw?.slug === "string" ? raw.slug : null;
      if (place && reservedSlugs.has(place.slug)) errors.push("el slug ya está en prisma/seed-kosher.mts");
      if (place && slugs.has(place.slug)) errors.push("slug repetido en prisma/kosher-places");
      if (slug) slugs.add(slug);
      if (errors.length || warnings.length) problems.push({ file, slug, errors, warnings });
      if (place && !errors.length) places.push({ ...place, file });
    }
  }
  return { files, places, problems, slugs };
}

// ── Plan ────────────────────────────────────────────────────────────────────

/** JSON con las claves ordenadas, para comparar horarios y listas. */
export function canonical(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value ?? null);
}

/** Valores de la base listos para comparar (Prisma devuelve Date y Json). */
function same(a, b) {
  if (a instanceof Date || b instanceof Date) return (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);
  if ((a && typeof a === "object") || (b && typeof b === "object")) return canonical(a) === canonical(b);
  return (a ?? null) === (b ?? null);
}

export function placeData(place) {
  return Object.fromEntries(MANAGED_KEYS.map((k) => [k, place[k] ?? (k === "services" ? [] : null)]));
}

export function changedFields(row, data) {
  return Object.keys(data).filter((k) => !same(row[k], data[k]));
}

/** Verificado que nadie editó en Mercav: sin administradores, sugerencias aceptadas, reclamos aprobados ni certificado. */
export function isUntouchedSeed(row) {
  return row.source === "seed" && row._count?.managers === 0 && row._count?.edits === 0 && (row._count?.claims ?? 0) === 0 && !row.certificateUrl;
}

const isFood = (type) => FOOD_TYPES.includes(type);

/**
 * Nombres del mismo lugar: iguales, uno contiene al otro, o las palabras que distinguen de uno están todas en el otro
 * ("Jabad Palermo" y "Beit Jabad Palermo" sí; "Sushi Club" y "Sushi Pop" no). Más estricto que similarNames de
 * osm-lib porque acá el lugar existente se reescribe con los datos verificados.
 */
export function closeNames(a, b) {
  const fa = foldText(a);
  const fb = foldText(b);
  if (!fa || !fb) return false;
  if (fa === fb || (fa.length >= 5 && fb.includes(fa)) || (fb.length >= 5 && fa.includes(fb))) return true;
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (!ta.size || !tb.size) return false;
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  return [...small].every((t) => big.has(t));
}

/** ¿Es el mismo lugar? A menos de DUPLICATE_METERS, con nombre parecido y del mismo grupo (comida o institución). */
export function sameSpot(place, row) {
  if (isFood(place.type) !== isFood(row.type)) return null;
  const meters = haversineKm(place, row) * 1000;
  if (meters > DUPLICATE_METERS) return null;
  const a = [place.name, place.nameLocal].filter(Boolean);
  const b = [row.name, row.nameLocal].filter(Boolean);
  if (!a.some((x) => b.some((y) => closeNames(x, y)))) return null;
  const exact = a.some((x) => b.some((y) => foldText(x) === foldText(y)));
  return { meters, exact };
}

/**
 * Qué hacer con cada lugar verificado.
 * rows: todos los lugares de la base (con _count: { managers, edits, claims }); osmStatuses: osmId → nivel que da el
 * import de OSM (del snapshot).
 * - Mismo slug y "seed": se refresca si nadie lo editó; si no, se saltea.
 * - Si no, el lugar publicado más cercano con nombre parecido: uno de OSM sin tocar pasa a verificado conservando slug
 *   y osmId; uno de OSM ya verificado antes (source "seed" con osmId) se refresca; lo demás se saltea y se informa.
 * - Sin coincidencia: se crea con el slug del archivo.
 */
export function planVerified({ places, rows, osmStatuses = new Map() }) {
  const plan = { creates: [], upgrades: [], refreshes: [], unchanged: [], skipped: [] };
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const fileSlugs = new Set(places.map((p) => p.slug));
  const used = new Set();
  const pending = [];

  const decide = (p, row, how) => {
    used.add(row.id);
    const data = placeData(p);
    if (row.source === "seed" && (row.slug === p.slug || row.osmId)) {
      if (!isUntouchedSeed(row)) return plan.skipped.push({ place: p, row, reason: `editado en Mercav (${row.slug}): no se pisa` });
      const changed = changedFields(row, data);
      if (!changed.length) return plan.unchanged.push({ place: p, row });
      return plan.refreshes.push({ place: p, row, data: Object.fromEntries(changed.map((k) => [k, data[k]])), changed });
    }
    if (row.source === "seed") return plan.skipped.push({ place: p, row, reason: `ya está verificado como ${row.slug}` });
    if (row.source === "osm" && isUntouchedOsm(row, osmStatuses.get(row.osmId))) {
      return plan.upgrades.push({ place: p, row, data: { ...data, published: true }, how });
    }
    const owner = row.source === "osm" ? "de OpenStreetMap editado en Mercav" : `cargado por ${row.source === "community" ? "la comunidad" : row.source}`;
    return plan.skipped.push({ place: p, row, reason: `ya existe ${owner} (${row.slug}): no se pisa` });
  };

  for (const p of places) {
    const row = bySlug.get(p.slug);
    if (!row) {
      pending.push(p);
      continue;
    }
    if (row.source === "seed" || sameSpot(p, row)) decide(p, row, "slug");
    else {
      used.add(row.id);
      plan.skipped.push({ place: p, row, reason: `el slug ya lo usa otro lugar (${row.source}, ${row.name})` });
    }
  }

  // Coincidencias por cercanía: primero los nombres idénticos y los más cercanos, un lugar de la base por cada uno.
  const candidates = rows.filter((r) => r.published && !fileSlugs.has(r.slug) && !used.has(r.id));
  const pairs = [];
  for (const [i, p] of pending.entries()) {
    for (const r of candidates) {
      const match = sameSpot(p, r);
      if (match) pairs.push({ i, p, r, ...match });
    }
  }
  pairs.sort((a, b) => Number(b.exact) - Number(a.exact) || a.meters - b.meters || a.i - b.i);
  const matched = new Set();
  for (const { p, r } of pairs) {
    if (matched.has(p.slug) || used.has(r.id)) continue;
    matched.add(p.slug);
    decide(p, r, "cercanía");
  }
  for (const p of pending) if (!matched.has(p.slug)) plan.creates.push({ place: p, data: { ...placeData(p), slug: p.slug, published: true } });

  // Orden estable para los registros: el del archivo.
  const order = new Map(places.map((p, i) => [p.slug, i]));
  for (const list of Object.values(plan)) list.sort((a, b) => order.get(a.place.slug) - order.get(b.place.slug));
  return plan;
}

/** Comunidades que faltan para las ciudades curadas que quedan con lugares verificados (como el import de OSM). */
export function planCommunities(places, existing, cities) {
  const keys = new Set(existing.map((c) => `${c.city}|${c.countryCode}`));
  const slugs = new Set(existing.map((c) => c.slug));
  const out = [];
  for (const slug of [...new Set(places.map((p) => p.communityCity).filter(Boolean))]) {
    const c = cities.find((x) => x.slug === slug);
    if (!c || keys.has(`${c.city}|${c.countryCode}`) || !c.timezone) continue;
    let communitySlug = c.slug;
    if (slugs.has(communitySlug)) communitySlug = `${c.slug}-${c.countryCode.toLowerCase()}`;
    if (slugs.has(communitySlug)) continue;
    slugs.add(communitySlug);
    keys.add(`${c.city}|${c.countryCode}`);
    out.push({
      slug: communitySlug,
      name: c.name,
      city: c.city,
      country: c.country,
      countryCode: c.countryCode,
      lat: c.lat,
      lng: c.lng,
      timezone: c.timezone,
      languages: Array.isArray(c.languages) ? c.languages : [],
    });
  }
  return out;
}
// creado por pato dev y askforvini
