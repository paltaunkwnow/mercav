// Importa a la base el snapshot de OpenStreetMap (data/kosher/osm-latam.json, lo arma fetch-osm.mjs).
//
//   npm run kosher:import-osm -- --dry-run   → no escribe; cuenta lo que haría (con base si hay DATABASE_URL, si no solo el snapshot)
//   npm run kosher:import-osm -- --force     → importa fuera de producción (usa .env.local / .env)
//
// En el build corre después de prisma generate y solo en producción (VERCEL_ENV=production). KOSHER_OSM_IMPORT=0 lo
// apaga. Tiene un tiempo máximo y nunca hace fallar el build: ante cualquier error lo informa y sale con 0.
//
// Reglas:
// - Upsert por osmId. Los lugares nuevos entran con source "osm", sourceUrl a la ficha de OSM y publicados.
// - Uno existente solo se actualiza si sigue siendo de OSM y nadie lo tocó en Mercav: sin administradores, sin
//   sugerencias aceptadas, sin confirmación ni certificado, y con el mismo nivel que da el import. Nunca se pisa lo
//   que cargó la comunidad o el dueño. Ni el slug ni published cambian después de crearlo.
// - Se saltea lo que ya está en la base con otro origen (a menos de 80 m y con nombre parecido) y lo de osm-exclude.json.
// - Un lugar de OSM que import-verified.mjs pasó a verificado (source "seed", mismo osmId) ya no es de OSM: no se toca.
// - Crea la comunidad (KosherCommunity) de cada ciudad nueva con 3 lugares o más.
// - Nada queda "certified": Mercav no emite hechsher.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IMPORT_STATUSES, isUntouchedOsm } from "./osm-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SNAPSHOT = join(ROOT, "data/kosher/osm-latam.json");
const EXCLUDE = join(ROOT, "data/kosher/osm-exclude.json");
const TIMEOUT_MS = Number(process.env.KOSHER_OSM_IMPORT_TIMEOUT_MS) || 90_000;
const CREATE_BATCH = 200;
const UPDATE_BATCH = 50;
const MIN_PLACES_FOR_COMMUNITY = 3;

const TYPES = new Set(["restaurant", "bakery", "butcher", "grocery_branch", "judaica", "synagogue", "mikvah", "school", "hotel", "community", "museum"]);
const NUSACH = new Set(["ashkenaz", "sefarad", "edot_hamizrach", "spanish_portuguese", "yemenite", "chabad", "other"]);
const DENOMINATION = new Set(["orthodox", "conservative", "other"]);
const STREAM = new Set(["modern", "yeshivish", "chabad", "hasidic", "sephardi", "other"]);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

const argv = new Set(process.argv.slice(2));
const dryRun = argv.has("--dry-run");
const force = argv.has("--force");
const log = (message) => console.log(`[kosher-osm] ${message}`);

/** Mismo criterio que lib/kosher/hours.ts (el snapshot ya pasó por parseHours al armarse; esto es un control). */
function validHours(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const [day, periods] of Object.entries(value)) {
    if (!/^[0-6]$/.test(day) || !Array.isArray(periods)) return null;
    const ok = periods.filter((p) => p && TIME.test(p.open) && TIME.test(p.close) && p.open !== "24:00" && p.open !== p.close);
    if (ok.length) out[day] = ok.slice(0, 4).map((p) => ({ open: p.open, close: p.close }));
  }
  return Object.keys(out).length ? out : null;
}

function validPlace(p) {
  return (
    p &&
    typeof p.osmId === "string" &&
    /^(node|way|relation)\/\d+$/.test(p.osmId) &&
    typeof p.slug === "string" &&
    /^[a-z0-9-]{1,60}$/.test(p.slug) &&
    typeof p.name === "string" &&
    p.name.trim().length >= 2 &&
    TYPES.has(p.type) &&
    IMPORT_STATUSES.has(p.status) &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    typeof p.city === "string" &&
    p.city.length > 0 &&
    typeof p.countryCode === "string" &&
    p.countryCode.length === 2
  );
}

/** Campos que vienen de OSM y se pueden refrescar mientras nadie haya tocado la ficha. */
const BASIC_KEYS = [
  "name", "nameLocal", "type", "lat", "lng", "address", "city", "country", "countryCode", "phone", "website", "notes",
  "hours", "timezone", "nusach", "denomination", "orthodoxStream", "sourceUrl",
];

function basicFields(p) {
  return {
    name: p.name.slice(0, 120),
    nameLocal: p.nameLocal ?? null,
    type: p.type,
    lat: p.lat,
    lng: p.lng,
    address: (p.address || p.city).slice(0, 200),
    city: p.city,
    country: p.country,
    countryCode: p.countryCode,
    phone: p.phone ?? null,
    website: p.website && /^https?:\/\//i.test(p.website) ? p.website : null,
    notes: p.notes ?? null,
    hours: validHours(p.hours),
    timezone: p.timezone ?? null,
    nusach: NUSACH.has(p.nusach) ? p.nusach : null,
    denomination: DENOMINATION.has(p.denomination) ? p.denomination : null,
    orthodoxStream: STREAM.has(p.orthodoxStream) ? p.orthodoxStream : null,
    sourceUrl: `https://www.openstreetmap.org/${p.osmId}`,
  };
}

/** JSON con las claves ordenadas, para comparar el horario guardado con el nuevo. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value ?? null);
}

function changedFields(row, data) {
  return Object.keys(data).filter((k) => (k === "hours" ? canonical(row.hours) !== canonical(data.hours) : (row[k] ?? null) !== (data[k] ?? null)));
}

function loadEnvFiles() {
  // En Vercel las variables ya están; en local se leen como Next (.env.local gana sobre .env, y el entorno sobre ambos).
  if (process.env.VERCEL) return;
  for (const file of [".env.local", ".env"]) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    try {
      process.loadEnvFile(path);
    } catch {
      // Node viejo sin loadEnvFile o archivo ilegible: se sigue con el entorno.
    }
  }
}

async function run() {
  if (!existsSync(SNAPSHOT)) {
    log("No hay snapshot (data/kosher/osm-latam.json): nada que importar.");
    return;
  }
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const excluded = new Set((existsSync(EXCLUDE) ? JSON.parse(readFileSync(EXCLUDE, "utf8")).exclude : []).map((e) => e.osmId));
  const all = Array.isArray(snapshot.places) ? snapshot.places : [];
  const places = all.filter((p) => validPlace(p) && !excluded.has(p.osmId));
  const invalid = all.length - places.length;
  log(`Snapshot del ${snapshot.fetchedAt ?? "?"}: ${places.length} lugares${invalid ? ` (${invalid} inválidos o excluidos)` : ""}. ${snapshot.attribution ?? ""}`);

  loadEnvFiles();
  const { sessionDatabaseUrl } = await import("../migrate-deploy.mjs");
  const url = sessionDatabaseUrl();
  if (!url) {
    if (dryRun) printSnapshotStats(snapshot, places);
    else log("Falta DATABASE_URL: no se importa.");
    return;
  }

  const lib = await import("./osm-lib.mjs");
  const prismaModule = await import("@prisma/client");
  const { PrismaClient, Prisma } = prismaModule.default ?? prismaModule;
  const dbUrl = new URL(url);
  // Una conexión alcanza y no compite con el resto del build por el pooler.
  if (!dbUrl.searchParams.has("connection_limit")) dbUrl.searchParams.set("connection_limit", "1");
  if (!dbUrl.searchParams.has("connect_timeout")) dbUrl.searchParams.set("connect_timeout", "15");
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl.toString() } } });

  try {
    const byOsmId = new Map();
    const osmIds = places.map((p) => p.osmId);
    for (let i = 0; i < osmIds.length; i += 1000) {
      const rows = await prisma.kosherPlace.findMany({
        where: { osmId: { in: osmIds.slice(i, i + 1000) } },
        select: {
          id: true,
          osmId: true,
          source: true,
          status: true,
          confirmedAt: true,
          verifiedAt: true,
          certificateUrl: true,
          ...Object.fromEntries(BASIC_KEYS.map((k) => [k, true])),
          _count: { select: { managers: true, edits: { where: { status: "accepted" } } } },
        },
      });
      for (const row of rows) byOsmId.set(row.osmId, row);
    }
    // Lo que no es de OSM, incluidos los lugares de OSM que ya pasaron a verificados (tienen osmId y source "seed").
    const others = await prisma.kosherPlace.findMany({
      where: { OR: [{ osmId: null }, { NOT: { source: "osm" } }] },
      select: { slug: true, name: true, nameLocal: true, lat: true, lng: true },
    });
    const taken = new Set((await prisma.kosherPlace.findMany({ select: { slug: true } })).map((r) => r.slug));

    const creates = [];
    const updates = [];
    const counts = { unchanged: 0, edited: 0, duplicate: 0 };
    const presentByCity = new Map();

    for (const p of places) {
      const row = byOsmId.get(p.osmId);
      const data = basicFields(p);
      if (row) {
        presentByCity.set(`${p.city}|${p.countryCode}`, (presentByCity.get(`${p.city}|${p.countryCode}`) ?? 0) + 1);
        if (!isUntouchedOsm(row, p.status)) {
          counts.edited++;
          continue;
        }
        const changed = changedFields(row, data);
        if (!changed.length) {
          counts.unchanged++;
          continue;
        }
        updates.push({ id: row.id, status: row.status, data: Object.fromEntries(changed.map((k) => [k, data[k]])) });
        continue;
      }
      if (lib.findDuplicate({ ...p, names: [p.name, ...(p.altNames ?? [])] }, others)) {
        counts.duplicate++;
        continue;
      }
      let slug = taken.has(p.slug) ? lib.placeSlug(p, taken) : p.slug;
      for (let n = 2; taken.has(slug); n++) slug = `${p.slug.slice(0, 55)}-${n}`;
      taken.add(slug);
      presentByCity.set(`${p.city}|${p.countryCode}`, (presentByCity.get(`${p.city}|${p.countryCode}`) ?? 0) + 1);
      creates.push({ ...data, slug, osmId: p.osmId, status: p.status, source: "osm", published: true });
    }

    // Comunidades de ciudades nuevas con suficientes lugares.
    const existingCommunities = await prisma.kosherCommunity.findMany({ select: { slug: true, city: true, countryCode: true } });
    const communityKeys = new Set(existingCommunities.map((c) => `${c.city}|${c.countryCode}`));
    const communitySlugs = new Set(existingCommunities.map((c) => c.slug));
    const newCommunities = [];
    for (const c of snapshot.cities ?? []) {
      const key = `${c.city}|${c.countryCode}`;
      if (communityKeys.has(key) || (presentByCity.get(key) ?? 0) < MIN_PLACES_FOR_COMMUNITY) continue;
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng) || !c.slug || !c.timezone) continue;
      let slug = c.slug;
      if (communitySlugs.has(slug)) slug = `${c.slug}-${c.countryCode.toLowerCase()}`;
      if (communitySlugs.has(slug)) continue;
      communitySlugs.add(slug);
      communityKeys.add(key);
      newCommunities.push({
        slug,
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

    log(
      `Plan: ${creates.length} nuevos, ${updates.length} para actualizar, ${counts.unchanged} sin cambios, ` +
        `${counts.edited} editados en Mercav (no se tocan), ${counts.duplicate} ya cargados con otro origen, ` +
        `${newCommunities.length} comunidades nuevas${newCommunities.length ? ` (${newCommunities.map((c) => c.city).join(", ")})` : ""}.`,
    );
    if (dryRun) {
      log("--dry-run: no se escribió nada.");
      return;
    }

    // Json? no acepta null en Prisma: se omite al crear y se borra con DbNull al actualizar.
    const forCreate = (row) => {
      const { hours, ...rest } = row;
      return hours ? { ...rest, hours } : rest;
    };
    let created = 0;
    for (let i = 0; i < creates.length; i += CREATE_BATCH) {
      const result = await prisma.kosherPlace.createMany({ data: creates.slice(i, i + CREATE_BATCH).map(forCreate), skipDuplicates: true });
      created += result.count;
    }
    let updated = 0;
    for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
      const batch = updates.slice(i, i + UPDATE_BATCH);
      const results = await prisma.$transaction(
        batch.map(({ id, status, data }) =>
          // El where repite las condiciones: si alguien editó la ficha mientras tanto, no se pisa.
          prisma.kosherPlace.updateMany({
            where: {
              id,
              status,
              source: "osm",
              confirmedAt: null,
              verifiedAt: null,
              certificateUrl: null,
              managers: { none: {} },
              edits: { none: { status: "accepted" } },
            },
            data: "hours" in data && !data.hours ? { ...data, hours: Prisma.DbNull } : data,
          }),
        ),
      );
      updated += results.reduce((sum, r) => sum + r.count, 0);
    }
    const communities = newCommunities.length ? (await prisma.kosherCommunity.createMany({ data: newCommunities, skipDuplicates: true })).count : 0;
    log(`Listo: ${created} lugares creados, ${updated} actualizados, ${communities} comunidades creadas.`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function printSnapshotStats(snapshot, places) {
  const byCountry = {};
  for (const p of places) {
    byCountry[p.countryCode] ??= {};
    byCountry[p.countryCode][p.type] = (byCountry[p.countryCode][p.type] ?? 0) + 1;
  }
  for (const [code, types] of Object.entries(byCountry).sort()) {
    const total = Object.values(types).reduce((a, b) => a + b, 0);
    log(`  ${code}: ${total} (${Object.entries(types).map(([t, n]) => `${t} ${n}`).join(", ")})`);
  }
  const withCommunity = (snapshot.cities ?? []).filter((c) => c.community);
  log(`  Ciudades con 3 lugares o más (comunidad si falta): ${withCommunity.map((c) => `${c.city} (${c.places})`).join(", ") || "ninguna"}`);
  log("--dry-run sin DATABASE_URL: solo se leyó el snapshot.");
}

async function main() {
  if (process.env.KOSHER_OSM_IMPORT === "0") {
    log("KOSHER_OSM_IMPORT=0: no se importa.");
    return;
  }
  if (process.env.VERCEL_ENV !== "production" && !force && !dryRun) {
    log("No es el deploy de producción: no se importa (usá --force o --dry-run).");
    return;
  }
  const timer = setTimeout(() => {
    log(`Pasaron ${Math.round(TIMEOUT_MS / 1000)} s: se corta el import y el build sigue. Lo que falte entra en el próximo deploy.`);
    process.exit(0);
  }, TIMEOUT_MS);
  timer.unref();
  await run();
  clearTimeout(timer);
}

// Nunca hace fallar el build: cualquier error se informa y se sale con 0.
for (const event of ["unhandledRejection", "uncaughtException"]) {
  process.on(event, (error) => {
    log(`Error inesperado, el build sigue: ${error?.message ?? error}`);
    process.exit(0);
  });
}
main()
  .catch((error) => log(`No se pudo importar, el build sigue: ${error?.message ?? error}`))
  .finally(() => {
    process.exitCode = 0;
  });
// creado por pato dev y askforvini
