// Funciones puras para importar lugares judíos y kosher de OpenStreetMap: consulta Overpass, tipo y nivel de kashrut,
// horario, ciudad y duplicados. Sin dependencias: las usan fetch-osm.mjs (local), import-osm.mjs (build) y los tests.
//
// Mercav no emite hechsher: nada que venga de OSM queda "certified". Si OSM nombra una certificadora, va a notes.

export const OSM_ATTRIBUTION = "© colaboradores de OpenStreetMap";
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
export const OSM_LICENSE = "ODbL-1.0";
export const OSM_LICENSE_URL = "https://opendatacommons.org/licenses/odbl/1-0/";

/** Distancia máxima (m) para tratar dos lugares con nombre parecido como el mismo. */
export const DUPLICATE_METERS = 80;
/** Más cerca que esto alcanza con una palabra en común ("Casa Jabad" en la puerta de "Jabad Bolivia"). */
export const CLOSE_METERS = 30;
/** Radio por defecto (km) de una ciudad de la lista curada. */
export const DEFAULT_CITY_RADIUS_KM = 50;
/** Si addr:city nombra una ciudad curada pero el punto queda más lejos que esto, se desconfía de addr:city. */
const ADDR_CITY_MAX_KM = 120;

// ── Overpass ────────────────────────────────────────────────────────────────

/**
 * Consulta de un país. Trae de más (religion=jewish entero) y classifyTags decide qué entra. El resultado pesa pocos
 * KB: un maxsize chico (64 MiB en vez de 512) hace que Overpass la acepte aunque esté cargado.
 */
export function overpassQuery(countryCode, timeoutSeconds = 120) {
  return `[out:json][timeout:${timeoutSeconds}][maxsize:67108864];
area["ISO3166-1"="${countryCode}"]["boundary"="administrative"]->.c;
(
  nwr["religion"="jewish"](area.c);
  nwr["diet:kosher"~"^(yes|only)$"](area.c);
  nwr["shop"="kosher"](area.c);
  nwr["cuisine"~"kosher",i](area.c);
  nwr["amenity"~"^mikv",i](area.c);
  nwr["bath:type"~"^mikv",i](area.c);
  nwr["place_of_worship"~"^mikv",i](area.c);
  nwr["community_centre:for"~"jew",i](area.c);
  nwr["tourism"="museum"]["subject"~"jew|juda|holocaust|shoah|hebre",i](area.c);
  nwr["tourism"="museum"]["name"~"jud[ií][oa]|judeu|judaic|holocaust|shoah|sho[aá]|hebre|israelita|sinagoga",i](area.c);
);
out center tags;`;
}

// ── Texto ───────────────────────────────────────────────────────────────────

/** Igual que slugify de lib/kosher/geo.ts. */
export function slugify(input) {
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const SMALL_WORDS = new Set("de del la las el los y e o da das do dos di en".split(" "));

/** "museo judio del paraguay" → "Museo Judio del Paraguay". Un nombre que ya tiene mayúsculas queda como está (AMIA). */
export function tidyName(value) {
  const trimmed = String(value).trim().replace(/\s+/g, " ");
  if (!/[a-z]/.test(trimmed) || trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function foldText(input) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, " ")
    .trim();
}

// Palabras que no distinguen un lugar de otro ("Sinagoga", "Comunidad Israelita de …").
const NAME_STOPWORDS = new Set(
  (
    "de del la las el los lo do da dos das di e y and of the en em a al " +
    "sinagoga sinagogas sinagogue synagogue templo temple tempel comunidad comunidade community congregacion congregacao congregation " +
    "israelita israelitas israelite judia judio judia judaica judaico judaicos judeu judaism jewish hebrea hebreo hebraica hebraico " +
    "beit bet beth beis casa centro center centre asociacion associacao sociedad sociedade instituto institute colegio escola escuela " +
    "kehila kehilla kehilat kahal museo museu museum kosher kasher jabad chabad habad jabat lubavitch"
  ).split(" "),
);

export function nameTokens(name) {
  return foldText(name)
    .split(" ")
    .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t));
}

/** ¿Dos nombres hablan del mismo lugar? Uno contiene al otro o comparten una palabra que distingue. */
export function similarNames(a, b) {
  const fa = foldText(a);
  const fb = foldText(b);
  if (!fa || !fb) return false;
  if (fa === fb || (fa.length >= 5 && fb.includes(fa)) || (fb.length >= 5 && fa.includes(fb))) return true;
  const ta = new Set(nameTokens(a));
  return nameTokens(b).some((t) => ta.has(t));
}

/** Algún par de nombres (name, alt_name, official_name…) se parece. */
export function anySimilarName(namesA, namesB) {
  return namesA.some((a) => namesB.some((b) => similarNames(a, b)));
}

/** "Sinagoga", "Templo", "Comunidad Israelita": nada que lo distinga de otro. */
export function isGenericName(name) {
  return nameTokens(name).length === 0;
}

const ARTICLES = new Set("de del la las el los lo do da dos das di e y and of the en em a al".split(" "));

/** Comparten alguna palabra de 4 letras o más, aunque sea genérica ("Casa Jabad" y "Jabad Bolivia"). */
function sharesAnyWord(a, b) {
  const words = (s) => foldText(s).split(" ").filter((t) => t.length >= 4 && !ARTICLES.has(t));
  const ta = new Set(words(a));
  return words(b).some((t) => ta.has(t));
}

// ── Geo ─────────────────────────────────────────────────────────────────────

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Ciudad del lugar. Las ciudades de Mercav son áreas metropolitanas (Lo Barnechea cuenta como Santiago), así que:
 * 1. addr:city que coincide con una ciudad curada (nombre o alias) y queda cerca → esa ciudad.
 * 2. Ciudad curada más cercana dentro de su radio → esa ciudad (un suburbio entra en su metrópoli).
 * 3. addr:city sin ciudad curada cerca → addr:city tal cual (aparece en el mapa, sin comunidad propia).
 * 4. Nada de lo anterior → null (no se importa).
 */
export function assignCity({ lat, lng, countryCode, addrCity }, cities) {
  const inCountry = cities.filter((c) => c.countryCode === countryCode);
  const folded = foldText(addrCity);
  if (folded) {
    const named = inCountry.find((c) => [c.city, ...(c.aliases ?? [])].some((n) => foldText(n) === folded));
    if (named && haversineKm({ lat, lng }, named) <= ADDR_CITY_MAX_KM) return { city: named, how: "addr:city" };
  }
  let best = null;
  for (const c of inCountry) {
    const km = haversineKm({ lat, lng }, c);
    if (km <= (c.radiusKm ?? DEFAULT_CITY_RADIUS_KM) && (!best || km < best.km)) best = { city: c, km };
  }
  if (best) return { city: best.city, how: "nearest" };
  if (folded) return { city: null, name: cleanCityName(addrCity), how: "addr:city-uncurated" };
  return null;
}

function cleanCityName(value) {
  const trimmed = String(value).trim().replace(/\s+/g, " ");
  // "SANTA ROSA" → "Santa Rosa"; el resto se deja como lo escribió quien mapeó.
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
  }
  return trimmed;
}

/** Zona horaria de un punto: la de la ciudad curada más cercana del país, o la de la capital. */
export function nearestTimezone({ lat, lng, countryCode }, cities, fallback) {
  let best = null;
  for (const c of cities) {
    if (c.countryCode !== countryCode) continue;
    const km = haversineKm({ lat, lng }, c);
    if (!best || km < best.km) best = { tz: c.timezone, km };
  }
  return best?.tz ?? fallback ?? null;
}

// ── Tipo y nivel de kashrut ─────────────────────────────────────────────────

const FOOD_SERVICE = new Set(["restaurant", "cafe", "fast_food", "food_court", "ice_cream", "bar", "pub", "biergarten"]);
const BAKERY_SHOPS = new Set(["bakery", "pastry", "confectionery", "chocolate"]);
const GROCERY_SHOPS = new Set([
  "supermarket", "convenience", "deli", "kosher", "greengrocer", "grocery", "general", "frozen_food", "cheese", "dairy",
  "wine", "alcohol", "beverages", "health_food", "spices", "seafood", "farm", "food", "variety_store", "department_store",
  "wholesale", "nuts", "tea", "coffee", "organic",
]);
const HOTELS = new Set(["hotel", "guest_house", "hostel", "motel", "apartment"]);
const SCHOOLS = new Set(["school", "kindergarten", "college", "university", "prep_school", "childcare"]);
const COMMUNITY = new Set(["community_centre", "social_centre", "social_facility", "library", "arts_centre", "events_venue", "club"]);

// Grupos que usan "religion=jewish" o "Israelita" sin serlo (mesiánicos, iglesias "israelitas"…).
const NOT_JEWISH_NAME = /mesi[aá]nic|messianic|messi[aâ]nic|iglesia|igreja|church|evang|cristian|crist[aã]|christ|nuevo pacto|novo pacto|adventist|pentecost|testigos de jehov|yeshua|jes[uú]s|asamblea de dios|assembleia de deus|bautista|batista|ministerio|minist[eé]rio|ma[cç]onaria|mas[oó]nic|masonic|tabern[aá]culo|adora[cç][aã]o|casa de ora[cç][aã]o|fire center|testigos|jehov|sal[oó]n del reino|kingdom hall|\bjw\b|pr[ií]ncipe de paz|luz del mundo|nueva jerusal[eé]n|nova jerusal[eé]m|yahweh|yahv[eé]|b[ií]blic/i;
const NOT_JEWISH_DENOMINATION = /messian|mesian|christ|cristi|evangel|adventist|pentecost|baptist|catholic|protestant|unity|unitarian|mason/i;

const MIKVEH = /^mi[kq]v/i;
// "Judiciário" no: solo judío/judía, judeu, judaico, judaísmo.
const JEWISH_SUBJECT = /jew|judaic|juda[ií]sm|jud[ií][oa]s?\b|judeus?\b|judia\b|holocaust|shoah|sho[aá]\b|hebre|israelita|sinagoga/i;
const DIET_YES = /^(yes|only)$/i;

/** Claves de OSM que nombran una certificadora o supervisión de kashrut. */
const CERTIFIER_KEY = /^(diet:kosher:|kosher:|certification:kosher|kashrut|hechsher)/i;
const CERTIFIER_HINT = /certif|supervis|hechsher|hekhsher|agency|authority|by$|kashrut|rabbi/i;

function certifierNote(tags) {
  const values = [];
  for (const [key, value] of Object.entries(tags)) {
    if (!CERTIFIER_KEY.test(key)) continue;
    if (key !== "kashrut" && key !== "hechsher" && !CERTIFIER_HINT.test(key)) continue;
    const v = String(value).trim();
    if (v && !/^(yes|no|only)$/i.test(v)) values.push(v);
  }
  return values.length ? `Según OpenStreetMap: ${[...new Set(values)].join(", ")}` : null;
}

function isJewish(tags) {
  return tags.religion === "jewish" || /lubavitch|chabad|jabad/i.test(tags.denomination ?? "");
}

/**
 * Tipo de Mercav y nivel de kashrut a partir de las etiquetas de OSM, o { skip } con el motivo.
 * Nunca devuelve "certified".
 */
export function classifyTags(tags) {
  const name = mainName(tags);
  const amenity = tags.amenity ?? "";
  const shop = tags.shop ?? "";
  const tourism = tags.tourism ?? "";
  const diet = (tags["diet:kosher"] ?? "").trim().toLowerCase();

  if (!amenity && !shop && !tourism && !tags.office && !tags.building && !tags.leisure && !tags.club) {
    return { skip: "sin función (área, cementerio o terreno)" };
  }
  if (amenity === "grave_yard" || tags.landuse === "cemetery" || shop === "funeral_directors") return { skip: "cementerio o funeraria" };
  if (tags.disused === "yes" || tags.abandoned === "yes" || /^(closed|off)$/i.test(tags.opening_hours ?? "")) return { skip: "cerrado o en desuso" };
  if (NOT_JEWISH_NAME.test(name) || NOT_JEWISH_NAME.test(tags.operator ?? "") || NOT_JEWISH_DENOMINATION.test(tags.denomination ?? "")) {
    return { skip: "no es una institución judía (mesiánica o cristiana)" };
  }
  if (!name) return { skip: "sin nombre" };

  const note = certifierNote(tags);
  const kosherOnly = diet === "only" || shop === "kosher";
  const kosherYes = diet === "yes";
  const kosherCuisine = /(^|;)\s*kosher\s*($|;)/i.test(tags.cuisine ?? "");

  // Lugares sin nivel de kashrut: sinagogas, mikvaot, escuelas, centros comunitarios, museos.
  if (MIKVEH.test(amenity) || MIKVEH.test(tags["bath:type"] ?? "") || MIKVEH.test(tags.place_of_worship ?? "") || (amenity === "public_bath" && isJewish(tags))) {
    return { type: "mikvah", status: "unknown", notes: null };
  }
  if (amenity === "place_of_worship" && isJewish(tags)) return { type: "synagogue", status: "unknown", notes: null };
  if (SCHOOLS.has(amenity) && isJewish(tags)) {
    // Una escuela del Estado con religion=jewish está mal etiquetada.
    if (/^(government|public|municipal)$/.test(tags["operator:type"] ?? "")) return { skip: "escuela pública con religion=jewish (mal etiquetada)" };
    return { type: "school", status: "unknown", notes: null };
  }
  if (tourism === "museum" && (isJewish(tags) || JEWISH_SUBJECT.test(tags.subject ?? "") || JEWISH_SUBJECT.test(name))) {
    return { type: "museum", status: "unknown", notes: null };
  }
  if (
    (COMMUNITY.has(amenity) && (isJewish(tags) || /jew/i.test(tags["community_centre:for"] ?? ""))) ||
    ((tags.office === "association" || tags.office === "ngo" || tags.office === "religion" || tags.club) && isJewish(tags)) ||
    (tags.leisure === "sports_centre" && isJewish(tags))
  ) {
    return { type: "community", status: "unknown", notes: null };
  }
  if ((shop === "religion" || shop === "books" || shop === "gift") && isJewish(tags)) return { type: "judaica", status: "unknown", notes: null };
  if (!amenity && !shop && !tourism && tags.building === "synagogue" && isJewish(tags)) return { type: "synagogue", status: "unknown", notes: null };

  // Comida: solo con diet:kosher=yes|only, shop=kosher o cuisine=kosher.
  if (!kosherOnly && !kosherYes && !kosherCuisine) return { skip: "sin etiqueta kosher ni institución judía" };
  // cuisine=kosher sin diet:kosher se lee como "dice ser kosher".
  const whole = kosherOnly || (!kosherYes && kosherCuisine);

  let type = null;
  if (shop === "butcher") type = "butcher";
  else if (BAKERY_SHOPS.has(shop) || (FOOD_SERVICE.has(amenity) && /(^|;)\s*bakery/i.test(tags.cuisine ?? ""))) type = "bakery";
  else if (FOOD_SERVICE.has(amenity)) type = "restaurant";
  else if (GROCERY_SHOPS.has(shop)) type = "grocery_branch";
  else if (HOTELS.has(tourism)) type = "hotel";
  if (!type) return { skip: `tipo no soportado (${amenity || shop || tourism})` };

  // Halal, kosher, vegano, sin gluten… todo "yes" de una vez suele ser una respuesta al azar, no un dato.
  const signal = kosherTagSignal(tags);
  const dietsYes = Object.entries(tags).filter(([k, v]) => k.startsWith("diet:") && DIET_YES.test(String(v))).length;
  if (dietsYes >= 4 && !signal) return { skip: "diet:* marcado en bloque, sin otra señal kosher" };
  if (DIET_YES.test(tags["diet:halal"] ?? "") && !signal) return { skip: "halal y kosher a la vez, sin otra señal kosher" };

  let status;
  if (whole) status = "self_declared";
  else if (type === "restaurant" || type === "hotel") status = "some_dishes";
  else status = "some_products";

  const parts = [note];
  if (kosherCuisine && !kosherOnly && !kosherYes) parts.push("OpenStreetMap lo marca como cocina kosher, sin certificación registrada.");
  // signal: si es false, fetch-osm.mjs solo lo acepta cerca de una institución judía.
  return { type, status, notes: parts.filter(Boolean).join(" ") || null, food: true, signal };
}

/** Corriente, nusaj y denominación desde denomination=* (solo lo inequívoco). */
export function denominationFields(tags) {
  const d = foldText(tags.denomination ?? "");
  if (!d) return {};
  if (/lubavitch|chabad|jabad/.test(d)) return { denomination: "orthodox", orthodoxStream: "chabad", nusach: "chabad" };
  if (/hasid|chasid|jasid/.test(d)) return { denomination: "orthodox", orthodoxStream: "hasidic" };
  if (/orthodox|ortodox/.test(d)) return { denomination: "orthodox" };
  if (/conservative|masorti|conservador/.test(d)) return { denomination: "conservative" };
  if (/reform|liberal|reconstruction|progressive/.test(d)) return { denomination: "other" };
  if (/sephard|sefard|sefaradi/.test(d)) return { nusach: "sefarad" };
  if (/ashkenaz/.test(d)) return { nusach: "ashkenaz" };
  return {};
}

// ── Contacto y dirección ────────────────────────────────────────────────────

export function buildAddress(tags, { cityName, cityAliases = [] } = {}) {
  const street = (tags["addr:street"] ?? "").trim();
  const number = (tags["addr:housenumber"] ?? "").trim();
  const area = (tags["addr:suburb"] ?? tags["addr:neighbourhood"] ?? tags["addr:quarter"] ?? "").trim();
  const place = (tags["addr:place"] ?? "").trim();
  const addrCity = (tags["addr:city"] ?? "").trim();
  const parts = [];
  if (street) parts.push(number ? `${street} ${number}` : street);
  else if (tags["addr:full"]) parts.push(String(tags["addr:full"]).trim());
  else if (place) parts.push(number ? `${place} ${number}` : place);
  if (area && !parts.some((p) => foldText(p).includes(foldText(area)))) parts.push(area);
  // Un suburbio que se cuenta dentro de la metrópoli conserva su nombre en la dirección.
  const sameCity = [cityName, ...cityAliases].some((n) => foldText(n) === foldText(addrCity));
  if (addrCity && cityName && !sameCity && !parts.some((p) => foldText(p).includes(foldText(addrCity)))) {
    parts.push(addrCity);
  }
  const address = parts.join(", ").slice(0, 200);
  return address || cityName || "";
}

export function cleanPhone(tags) {
  const raw = tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? tags.mobile ?? "";
  const first = String(raw).split(/[;,]/)[0].trim();
  return first && /\d{6,}/.test(first.replace(/[\s().-]/g, "")) ? first.slice(0, 40) : null;
}

export function cleanWebsite(tags) {
  for (const key of ["website", "contact:website", "url", "contact:facebook", "contact:instagram"]) {
    let value = String(tags[key] ?? "").split(";")[0].trim();
    if (!value) continue;
    if (/^www\./i.test(value)) value = `https://${value}`;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString().slice(0, 300);
    } catch {
      // Valor que no es URL (p. ej. un usuario de Instagram suelto): se prueba la siguiente clave.
    }
  }
  return null;
}

/** Etiquetas que se guardan en el snapshot para revisar de dónde salió cada dato. */
const KEPT_TAG = /^(name|name:(es|pt|he|en)|alt_name|official_name|old_name|amenity|shop|tourism|leisure|office|club|building|religion|denomination|diet:.*|cuisine|kosher.*|kashrut|hechsher|certification.*|addr:.*|phone|contact:.*|mobile|website|url|opening_hours|operator|community_centre.*|subject|museum|memorial|bath:type|place_of_worship|wheelchair|wikidata|wikipedia|description)$/;

export function keptTags(tags) {
  return Object.fromEntries(Object.entries(tags).filter(([k]) => KEPT_TAG.test(k)).sort(([a], [b]) => a.localeCompare(b)));
}

/** name (con branch, como pide OSM: "McDonald's" + "Kosher"), o el primer nombre alternativo si falta. */
export function mainName(tags) {
  const name = String(tags.name || tags["name:es"] || tags["name:pt"] || tags.official_name || tags.alt_name || tags["name:en"] || "").split(";")[0].trim();
  const branch = String(tags.branch ?? "").trim();
  return name && branch && !foldText(name).includes(foldText(branch)) ? `${name} ${branch}` : name;
}

export function placeNames(tags) {
  return [tags.name, tags.alt_name, tags.official_name, tags.old_name, tags["name:es"], tags["name:pt"], tags["name:en"]]
    .flatMap((n) => (n ? String(n).split(";") : []))
    .map((n) => n.trim())
    .filter(Boolean);
}

// ── Horario (opening_hours) ─────────────────────────────────────────────────

const DAY_INDEX = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_TOKEN = /^(Mo|Tu|We|Th|Fr|Sa|Su)$/;

function expandDays(spec) {
  const days = new Set();
  for (const part of spec.split(",")) {
    const range = part.trim().split("-");
    if (range.length === 1) {
      if (!DAY_TOKEN.test(range[0])) return null;
      days.add(DAY_INDEX[range[0]]);
    } else if (range.length === 2) {
      if (!DAY_TOKEN.test(range[0]) || !DAY_TOKEN.test(range[1])) return null;
      // Su-Th y Fr-Mo dan la vuelta a la semana.
      let d = DAY_INDEX[range[0]];
      const end = DAY_INDEX[range[1]];
      for (let i = 0; i < 7; i++) {
        days.add(d);
        if (d === end) break;
        d = (d + 1) % 7;
      }
    } else return null;
  }
  return days;
}

function normalizeTime(value, isClose) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 48) return null;
  if (h === 24 && min === 0) return isClose ? "24:00" : null;
  // "26:00" de cierre es las 02:00 del día siguiente: el turno pasa la medianoche.
  if (h >= 24) {
    if (!isClose) return null;
    h -= 24;
  }
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function parseTimes(spec) {
  const periods = [];
  for (const part of spec.split(",")) {
    const m = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(part.trim());
    if (!m) return null;
    const open = normalizeTime(m[1], false);
    const close = normalizeTime(m[2], true);
    if (!open || !close || open === close) return null;
    periods.push({ open, close });
  }
  return periods.length ? periods : null;
}

/**
 * opening_hours de OSM → horario semanal de Mercav ({ "0".."6": [{ open, close }] }, 0 = domingo), o null.
 * Solo patrones simples: "24/7", "Mo-Fr 09:00-18:00; Sa 10:00-14:00", "Su-Th 12:00-15:00,19:00-23:00", "Sa off".
 * Feriados (PH) se ignoran; meses, semanas, amanecer, "+" o comentarios devuelven null.
 * El resultado hay que pasarlo por parseHours (lib/kosher/hours.ts), que ordena y limita los turnos.
 */
export function osmOpeningHours(raw) {
  if (!raw || typeof raw !== "string") return null;
  const value = raw.trim().replace(/\s+/g, " ");
  if (value === "24/7") {
    return Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), [{ open: "00:00", close: "24:00" }]]));
  }
  // "Mo-Fr 09:00-18:00, Sa 10:00-14:00": la coma entre reglas se trata como ";".
  const rules = value
    .replace(/(\d)\s*,\s*(?=(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b)/g, "$1;")
    .split(";")
    .map((r) => r.trim())
    .filter(Boolean);
  if (!rules.length) return null;
  const week = new Map();
  for (const rule of rules) {
    if (/^PH(\s|$)/.test(rule)) continue;
    const m = /^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)?(?:,PH)?\s*(.*)$/.exec(rule);
    if (!m) return null;
    const days = m[1] ? expandDays(m[1]) : new Set([0, 1, 2, 3, 4, 5, 6]);
    const rest = m[2].trim();
    if (!days || (!m[1] && !rest)) return null;
    if (/^(off|closed)$/i.test(rest)) {
      for (const d of days) week.set(d, []);
      continue;
    }
    if (rest === "00:00-24:00" || rest === "24/7") {
      for (const d of days) week.set(d, [{ open: "00:00", close: "24:00" }]);
      continue;
    }
    const periods = parseTimes(rest);
    if (!periods) return null;
    // Una regla posterior reemplaza a la anterior en sus días (semántica de opening_hours).
    for (const d of days) week.set(d, periods.map((p) => ({ ...p })));
  }
  const out = {};
  for (const [d, periods] of [...week.entries()].sort((a, b) => a[0] - b[0])) if (periods.length) out[String(d)] = periods;
  return Object.keys(out).length ? out : null;
}

// ── Seed (para no duplicar lugares verificados a mano) ──────────────────────

/**
 * Lugares del seed leídos del texto de prisma/seed-kosher.mts (no se puede importar: corre contra la base) y de
 * prisma/kosher-places/*.json. Solo lo que hace falta para detectar duplicados.
 */
export function parseSeedPlaces(seedSource, regionFiles = []) {
  const out = [];
  const start = seedSource.indexOf("const places");
  const end = seedSource.indexOf("const communities");
  const block = start >= 0 ? seedSource.slice(start, end > start ? end : undefined) : "";
  for (const rawChunk of block.split(/\n {2}\{\n/).slice(1)) {
    const chunk = `\n${rawChunk}`;
    const str = (key) => new RegExp(`\\n\\s+${key}: "((?:[^"\\\\]|\\\\.)*)"`).exec(chunk)?.[1] ?? null;
    const num = (key) => Number(new RegExp(`\\n\\s+${key}: (-?[\\d.]+)`).exec(chunk)?.[1]);
    const slug = str("slug");
    const lat = num("lat");
    const lng = num("lng");
    if (slug && Number.isFinite(lat) && Number.isFinite(lng)) {
      out.push({ slug, name: str("name"), nameLocal: str("nameLocal"), type: str("type"), lat, lng, city: str("city"), countryCode: str("countryCode") });
    }
  }
  for (const file of regionFiles) {
    for (const p of file.places ?? []) {
      if (p.slug && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
        out.push({ slug: p.slug, name: p.name, nameLocal: p.nameLocal ?? null, type: p.type, lat: p.lat, lng: p.lng, city: p.city, countryCode: p.countryCode });
      }
    }
  }
  return out;
}

/**
 * Primer lugar existente que es el mismo: a menos de DUPLICATE_METERS con nombre parecido, o a menos de closeMeters
 * con un nombre genérico ("Sinagoga") o, si closeWords, con alguna palabra en común (la misma puerta con otro nombre).
 * Con sameType, solo compara lugares del mismo tipo.
 */
export function findDuplicate(place, existing, { sameType = false, closeMeters = CLOSE_METERS, closeWords = true } = {}) {
  const names = place.names ?? [place.name];
  for (const other of existing) {
    if (sameType && other.type !== place.type) continue;
    const meters = haversineKm(place, other) * 1000;
    if (meters > DUPLICATE_METERS) continue;
    const otherNames = other.names ?? [other.name, other.nameLocal].filter(Boolean);
    if (anySimilarName(names, otherNames)) return other;
    if (meters > closeMeters) continue;
    if (names.every(isGenericName) || otherNames.every(isGenericName)) return other;
    if (closeWords && names.some((a) => otherNames.some((b) => sharesAnyWord(a, b)))) return other;
  }
  return null;
}

/**
 * ¿La etiqueta kosher de un comercio tiene algo que la respalde? Hay muchas respuestas al azar en OSM (un almacén de
 * barrio con diet:kosher=only). Cuenta el nombre, una certificadora, la cocina judía o israelí, o el nombre en hebreo.
 * Sin eso, fetch-osm.mjs pide que el lugar esté cerca de una institución judía.
 */
export function kosherTagSignal(tags) {
  const text = [tags.name, tags.alt_name, tags.official_name, tags.brand, tags.operator, tags.description, tags.branch].filter(Boolean).join(" ");
  if (/kosher|kasher|cosher|kosh\b|glatt|kashrut|jabad|chabad|habad|shalom|israel|hebr|juda|jud[ií]|judeu|yidd|chaim|jaim|mazal|bagel|knish|challah|jala\b|matz/i.test(foldText(text))) return true;
  if (tags["name:he"] || tags.shop === "kosher" || certifierNote(tags)) return true;
  return /(^|;)\s*(kosher|jewish|israeli)\s*($|;)/i.test(tags.cuisine ?? "");
}

/** Km máximos entre un comercio kosher sin otra señal y la institución judía más cercana. */
export const FOOD_NEAR_INSTITUTION_KM = 1;

/** "node/123" → "n123" (sufijo corto y estable para slugs repetidos). */
export function osmShortId(osmId) {
  const [type, id] = osmId.split("/");
  return `${type[0]}${id}`;
}

/** Slug estable: "<ciudad>-<nombre>", y si ya existe, con el id de OSM al final. */
export function placeSlug(place, taken) {
  // Un nombre sin letras latinas (solo hebreo) no da slug: va el id de OSM.
  const name = slugify(place.name) || osmShortId(place.osmId);
  const base = slugify(`${slugify(place.city) || "lugar"}-${name}`);
  if (!taken.has(base)) return base;
  const suffix = `-${osmShortId(place.osmId)}`;
  return `${base.slice(0, 60 - suffix.length).replace(/-+$/, "")}${suffix}`;
}
// creado por pato dev y askforvini
