// Baja de OpenStreetMap (Overpass) los lugares judíos y kosher de los 20 países de Latinoamérica de Mercav y escribe
// el snapshot data/kosher/osm-latam.json, que después lee import-osm.mjs. Se corre a mano, no en el build.
//
//   npm run kosher:fetch-osm                         → los 20 países, escribe el snapshot
//   npm run kosher:fetch-osm -- --cache=/tmp/osm     → guarda cada respuesta cruda y la reusa si ya está
//   npm run kosher:fetch-osm -- --country=AR,UY      → solo esos países, imprime números y no escribe
//   npm run kosher:fetch-osm -- --dry-run            → no escribe
//
// Overpass es un servicio comunitario: un país por pedido, pausa entre pedidos, reintentos con espera creciente.
// Datos © colaboradores de OpenStreetMap, licencia ODbL: el snapshot es una base aparte con su fuente.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LATAM_COUNTRIES } from "../../lib/geo/latam.ts";
import { parseHours } from "../../lib/kosher/hours.ts";
import {
  FOOD_NEAR_INSTITUTION_KM,
  OSM_ATTRIBUTION,
  OSM_COPYRIGHT_URL,
  OSM_LICENSE,
  OSM_LICENSE_URL,
  assignCity,
  buildAddress,
  classifyTags,
  cleanPhone,
  cleanWebsite,
  denominationFields,
  findDuplicate,
  haversineKm,
  keptTags,
  mainName,
  nearestTimezone,
  osmOpeningHours,
  overpassQuery,
  parseSeedPlaces,
  placeNames,
  placeSlug,
  tidyName,
} from "./osm-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SNAPSHOT = join(ROOT, "data/kosher/osm-latam.json");
const CITIES = join(ROOT, "data/kosher/latam-cities.json");
const EXCLUDE = join(ROOT, "data/kosher/osm-exclude.json");

const USER_AGENT = "MercavKosherImport/1.0 (+https://kosher.mercav.lat; soporte@mercav.lat)";
const ENDPOINTS = process.env.OVERPASS_URL
  ? [process.env.OVERPASS_URL]
  : ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const PAUSE_MS = 4000;
const MAX_ATTEMPTS = 6;
/** Mínimo de lugares importados para crear la comunidad de una ciudad nueva. */
const MIN_PLACES_FOR_COMMUNITY = 3;

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "true"];
  }),
);
const onlyCountries = args.get("country")?.toUpperCase().split(",").filter(Boolean) ?? null;
const cacheDir = args.get("cache") ?? null;
const dryRun = args.has("dry-run") || !!onlyCountries;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(code) {
  const body = new URLSearchParams({ data: overpassQuery(code) }).toString();
  let lastError = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body,
        signal: AbortSignal.timeout(180_000),
      });
      const text = await res.text();
      if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`HTTP ${res.status}: ${text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160)}`);
      const json = JSON.parse(text);
      // Overpass devuelve 200 con "remark" cuando corta la consulta a la mitad: el resultado está incompleto.
      if (json.remark && /error|timed out|out of memory/i.test(json.remark)) throw new Error(json.remark);
      return { json, endpoint };
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS - 1) break;
      const wait = Math.min(90_000, 5000 * 2 ** attempt) + Math.round(Math.random() * 2000);
      console.warn(`[osm] ${code}: intento ${attempt + 1} en ${new URL(endpoint).host} falló (${error.message}). Reintento en ${Math.round(wait / 1000)} s.`);
      await sleep(wait);
    }
  }
  throw new Error(`${code}: Overpass no respondió (${lastError?.message})`);
}

async function rawCountry(code) {
  const cached = cacheDir && join(cacheDir, `${code}.json`);
  if (cached && existsSync(cached)) return { ...JSON.parse(readFileSync(cached, "utf8")), fromCache: true };
  const { json, endpoint } = await overpass(code);
  const raw = { endpoint, fetchedAt: new Date().toISOString(), osmBase: json.osm3s?.timestamp_osm_base ?? null, elements: json.elements ?? [] };
  if (cached) {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cached, JSON.stringify(raw));
  }
  return raw;
}

function loadSeedPlaces() {
  const source = readFileSync(join(ROOT, "prisma/seed-kosher.mts"), "utf8");
  const dir = join(ROOT, "prisma/kosher-places");
  const regions = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
    : [];
  return parseSeedPlaces(source, regions);
}

/** Cuántos datos útiles tiene un elemento: entre duplicados de OSM se queda el más completo. */
function richness(p) {
  return Object.keys(p.tags).length + (p.tags["addr:street"] ? 5 : 0) + (p.phone ? 3 : 0) + (p.website ? 3 : 0) + (p.hours ? 3 : 0);
}

async function main() {
  const cities = JSON.parse(readFileSync(CITIES, "utf8")).cities;
  const excluded = new Map((existsSync(EXCLUDE) ? JSON.parse(readFileSync(EXCLUDE, "utf8")).exclude : []).map((e) => [e.osmId, e.reason]));
  const seedPlaces = loadSeedPlaces();
  const countries = LATAM_COUNTRIES.filter((c) => !onlyCountries || onlyCountries.includes(c.code));

  const candidates = [];
  /** osmId de cada comercio → ¿su etiqueta kosher tiene respaldo propio? (kosherTagSignal) */
  const foodSignal = new Map();
  const skipped = [];
  const perCountry = {};
  let first = true;
  /** El pedido más viejo a Overpass (con caché puede ser anterior a hoy). */
  let fetchedAt = null;

  for (const country of countries) {
    if (!first && !(cacheDir && existsSync(join(cacheDir, `${country.code}.json`)))) await sleep(PAUSE_MS);
    first = false;
    const raw = await rawCountry(country.code);
    console.log(`[osm] ${country.code}: ${raw.elements.length} elementos${raw.fromCache ? " (caché)" : ""}`);
    perCountry[country.code] = { elements: raw.elements.length, places: 0, osmBase: raw.osmBase };
    const at = raw.fetchedAt ?? raw.osmBase;
    if (at && (!fetchedAt || at < fetchedAt)) fetchedAt = at;

    for (const el of raw.elements) {
      const tags = el.tags ?? {};
      const osmId = `${el.type}/${el.id}`;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const skip = (reason) => skipped.push({ osmId, name: mainName(tags) || null, countryCode: country.code, reason });
      if (excluded.has(osmId)) {
        skip(`excluido a mano: ${excluded.get(osmId)}`);
        continue;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        skip("sin coordenadas");
        continue;
      }
      const kind = classifyTags(tags);
      if (kind.skip) {
        skip(kind.skip);
        continue;
      }
      const assigned = assignCity({ lat, lng, countryCode: country.code, addrCity: tags["addr:city"] }, cities);
      if (!assigned) {
        skip("sin ciudad: no tiene addr:city y no hay una ciudad de la lista a menos de su radio");
        continue;
      }
      const city = assigned.city?.city ?? assigned.name;
      const openingHours = tags.opening_hours?.trim() || null;
      if (kind.food) foodSignal.set(osmId, kind.signal);
      candidates.push({
        osmId,
        name: tidyName(mainName(tags)).slice(0, 120),
        nameLocal: (tags["name:he"] || (tags.official_name !== tags.name ? tags.official_name : "") || "").trim().slice(0, 120) || null,
        type: kind.type,
        status: kind.status,
        lat: Math.round(lat * 1e7) / 1e7,
        lng: Math.round(lng * 1e7) / 1e7,
        address: buildAddress(tags, { cityName: city, cityAliases: assigned.city?.aliases }),
        city,
        citySlug: assigned.city?.slug ?? null,
        cityAssignment: assigned.how,
        country: country.name,
        countryCode: country.code,
        timezone: assigned.city?.timezone ?? nearestTimezone({ lat, lng, countryCode: country.code }, cities, country.timezone),
        phone: cleanPhone(tags),
        website: cleanWebsite(tags),
        openingHours,
        hours: parseHours(osmOpeningHours(openingHours)),
        notes: kind.notes,
        ...denominationFields(tags),
        names: placeNames(tags),
        tags: keptTags(tags),
      });
    }
  }

  // Un comercio con diet:kosher y nada más que lo respalde solo entra cerca de una institución judía.
  const anchors = [...candidates.filter((c) => !foodSignal.has(c.osmId)), ...seedPlaces];
  const plausible = candidates.filter((c) => {
    if (!foodSignal.has(c.osmId) || foodSignal.get(c.osmId) || anchors.some((a) => haversineKm(c, a) <= FOOD_NEAR_INSTITUTION_KM)) return true;
    skipped.push({
      osmId: c.osmId,
      name: c.name,
      countryCode: c.countryCode,
      reason: `etiqueta kosher sin respaldo: sin "kosher" en el nombre ni certificadora, y a más de ${FOOD_NEAR_INSTITUTION_KM} km de una institución judía`,
    });
    return false;
  });

  // Duplicados dentro de OSM (el nodo y el edificio de la misma sinagoga): queda el más completo.
  const kept = [];
  for (const p of plausible.sort((a, b) => richness(b) - richness(a) || a.osmId.localeCompare(b.osmId))) {
    const twin = findDuplicate(p, kept, { sameType: true, closeWords: false });
    if (twin) {
      skipped.push({ osmId: p.osmId, name: p.name, countryCode: p.countryCode, reason: `duplicado en OSM de ${twin.osmId}` });
      continue;
    }
    const seedTwin = findDuplicate(p, seedPlaces);
    if (seedTwin) {
      skipped.push({ osmId: p.osmId, name: p.name, countryCode: p.countryCode, reason: `ya está en el seed: ${seedTwin.slug}` });
      continue;
    }
    kept.push(p);
  }

  // Slugs estables: orden fijo y, si chocan, el id de OSM al final.
  kept.sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.city.localeCompare(b.city, "es") || a.name.localeCompare(b.name, "es") || a.osmId.localeCompare(b.osmId));
  const taken = new Set(seedPlaces.map((p) => p.slug));
  for (const p of kept) {
    p.slug = placeSlug(p, taken);
    taken.add(p.slug);
  }

  // Ciudades de la lista que reciben lugares; las que llegan al mínimo tendrán comunidad.
  const counts = new Map();
  for (const p of kept) {
    perCountry[p.countryCode].places++;
    if (p.citySlug) counts.set(p.citySlug, (counts.get(p.citySlug) ?? 0) + 1);
  }
  const usedCities = cities
    .filter((c) => counts.has(c.slug))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      city: c.city,
      country: c.country,
      countryCode: c.countryCode,
      lat: c.lat,
      lng: c.lng,
      timezone: c.timezone,
      languages: c.languages,
      places: counts.get(c.slug),
      community: counts.get(c.slug) >= MIN_PLACES_FOR_COMMUNITY,
    }));

  const byType = {};
  const byStatus = {};
  const byCountryType = {};
  for (const p of kept) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    byCountryType[p.countryCode] ??= {};
    byCountryType[p.countryCode][p.type] = (byCountryType[p.countryCode][p.type] ?? 0) + 1;
  }
  const skipReasons = {};
  for (const s of skipped) {
    const key = s.reason.replace(/: .*$/, "").replace(/ de (node|way|relation)\/\d+$/, "");
    skipReasons[key] = (skipReasons[key] ?? 0) + 1;
  }

  const snapshot = {
    source: "OpenStreetMap",
    license: OSM_LICENSE,
    licenseUrl: OSM_LICENSE_URL,
    attribution: OSM_ATTRIBUTION,
    attributionUrl: OSM_COPYRIGHT_URL,
    note: "Base de datos aparte, derivada de OpenStreetMap (ODbL). Mercav no emite hechsher: ningún lugar importado queda certificado.",
    fetchedAt: fetchedAt ?? new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    countries: perCountry,
    stats: { places: kept.length, skipped: skipped.length, byType, byStatus, byCountryType, skipReasons },
    cities: usedCities,
    places: kept.map(({ names, ...p }) => ({ ...p, altNames: names.filter((n) => n !== p.name) })),
    skipped: skipped.sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.osmId.localeCompare(b.osmId)),
  };

  console.log(`[osm] ${kept.length} lugares, ${skipped.length} descartados.`);
  console.log("[osm] Por país y tipo:", JSON.stringify(byCountryType));
  console.log("[osm] Por nivel:", JSON.stringify(byStatus));
  console.log("[osm] Descartes:", JSON.stringify(skipReasons));
  console.log(`[osm] Ciudades con comunidad (≥ ${MIN_PLACES_FOR_COMMUNITY}): ${usedCities.filter((c) => c.community).map((c) => `${c.city} (${c.places})`).join(", ")}`);
  const loose = kept.filter((p) => !p.citySlug);
  if (loose.length) console.log(`[osm] Fuera de la lista de ciudades (${loose.length}): ${[...new Set(loose.map((p) => `${p.city}/${p.countryCode}`))].join(", ")}`);

  if (dryRun) {
    console.log("[osm] Sin escribir (--dry-run o --country).");
    return;
  }
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  writeFileSync(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`[osm] Escrito ${SNAPSHOT.replace(`${ROOT}/`, "")}`);
}

main().catch((error) => {
  console.error(`[osm] ${error.message}`);
  process.exitCode = 1;
});
// creado por pato dev y askforvini
