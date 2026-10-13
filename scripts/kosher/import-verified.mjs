// Importa a la base los lugares verificados de prisma/kosher-places/*.json (listas oficiales de las certificadoras).
//
//   npm run kosher:import-verified -- --dry-run        → no escribe; valida los archivos y muestra el plan (con base si hay DATABASE_URL)
//   npm run kosher:import-verified -- --force          → importa fuera de producción (usa .env.local / .env)
//   npm run kosher:import-verified -- --dir=/carpeta   → lee otra carpeta (también KOSHER_VERIFIED_DIR), para probar
//
// En el build corre después de import-osm.mjs y solo en producción (VERCEL_ENV=production). KOSHER_VERIFIED_IMPORT=0
// lo apaga. Tiene un tiempo máximo y nunca hace fallar el build: ante cualquier error lo informa y sale con 0.
//
// Reglas (las decide planVerified de verified-lib.mjs):
// - Entra con source "seed", verifiedAt del archivo, confirmedAt = verifiedAt y publicado. Lo inválido se informa y no entra.
// - Mismo slug: se refresca desde el archivo mientras nadie lo haya editado en Mercav (administradores, sugerencias
//   aceptadas, reclamos aprobados o certificado cargado).
// - Si no, un lugar publicado a menos de 80 m con nombre parecido: si es de OpenStreetMap y nadie lo tocó, pasa a
//   verificado ahí mismo (conserva slug y osmId, así no se rompen los links); si lo cargó la comunidad o tiene
//   administradores, se saltea y se informa.
// - Crea la comunidad de cada ciudad de data/kosher/latam-cities.json que recibe lugares verificados y no la tiene.
// - No borra nada: sacar un lugar del archivo no lo quita de la base (eso lo hace npm run seed:kosher).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseSeedPlaces } from "./osm-lib.mjs";
import { MANAGED_KEYS, planCommunities, planVerified, readVerifiedDir } from "./verified-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_DIR = join(ROOT, "prisma/kosher-places");
const CITIES = join(ROOT, "data/kosher/latam-cities.json");
const SNAPSHOT = join(ROOT, "data/kosher/osm-latam.json");
const SEED = join(ROOT, "prisma/seed-kosher.mts");
const TIMEOUT_MS = Number(process.env.KOSHER_VERIFIED_IMPORT_TIMEOUT_MS) || 60_000;
const CREATE_BATCH = 100;
const UPDATE_BATCH = 50;

const prefix = (message) => console.log(`[kosher-verificados] ${message}`);

/** prisma/kosher-places, u otra carpeta con KOSHER_VERIFIED_DIR (para probar sin tocar los archivos reales). */
export function verifiedDir(env = process.env) {
  return env.KOSHER_VERIFIED_DIR ? resolve(env.KOSHER_VERIFIED_DIR) : DEFAULT_DIR;
}

export function loadCities() {
  return JSON.parse(readFileSync(CITIES, "utf8")).cities;
}

/** Slugs de los lugares que prisma/seed-kosher.mts carga a mano: no pueden repetirse en los archivos. */
export function seedSlugs() {
  return new Set(existsSync(SEED) ? parseSeedPlaces(readFileSync(SEED, "utf8")).map((p) => p.slug) : []);
}

/** Nivel que da el import de OSM a cada lugar del snapshot: con eso se sabe si un lugar de OSM sigue sin tocar. */
function osmStatuses() {
  if (!existsSync(SNAPSHOT)) return new Map();
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  return new Map((snapshot.places ?? []).map((p) => [p.osmId, p.status]));
}

function describe(p) {
  return `${p.slug} (${p.name}, ${p.city} ${p.countryCode})`;
}

export function reportProblems(problems, log = prefix) {
  for (const { file, slug, errors, warnings } of problems) {
    const where = `${file}${slug ? ` · ${slug}` : ""}`;
    for (const e of errors) log(`  ✗ ${where}: ${e}`);
    for (const w of warnings) log(`  ! ${where}: ${w}`);
  }
}

/**
 * Valida, arma el plan y (sin dryRun) lo aplica con el cliente que recibe. Lo usan este script y prisma/seed-kosher.mts.
 * Devuelve el plan y lo escrito, para registros y tests.
 */
export async function runVerifiedImport({ prisma, Prisma, dir = verifiedDir(), dryRun = false, log = prefix, reservedSlugs = seedSlugs() }) {
  const cities = loadCities();
  const { files, places, problems } = readVerifiedDir(dir, { cities, reservedSlugs });
  const invalid = problems.filter((p) => p.errors.length).length;
  log(`${files.length} archivos en ${dir}: ${places.length} lugares válidos${invalid ? `, ${invalid} con errores (no entran)` : ""}.`);
  reportProblems(problems, log);
  const result = { places, problems, plan: null, communities: [], written: { created: 0, upgraded: 0, refreshed: 0, communities: 0 } };
  if (!places.length) return result;

  const rows = await prisma.kosherPlace.findMany({
    select: {
      id: true,
      slug: true,
      osmId: true,
      published: true,
      certificateUrl: true,
      ...Object.fromEntries(MANAGED_KEYS.map((k) => [k, true])),
      _count: { select: { managers: true, edits: { where: { status: "accepted" } }, claims: { where: { state: "approved" } } } },
    },
  });
  const plan = planVerified({ places, rows, osmStatuses: osmStatuses() });
  const ours = [...plan.creates, ...plan.upgrades, ...plan.refreshes, ...plan.unchanged].map((x) => x.place);
  const existingCommunities = await prisma.kosherCommunity.findMany({ select: { slug: true, city: true, countryCode: true } });
  const communities = planCommunities(ours, existingCommunities, cities);
  result.plan = plan;
  result.communities = communities;

  log(
    `Plan: ${plan.creates.length} nuevos, ${plan.upgrades.length} de OpenStreetMap pasan a verificados, ${plan.refreshes.length} para actualizar, ` +
      `${plan.unchanged.length} sin cambios, ${plan.skipped.length} salteados, ${communities.length} comunidades nuevas` +
      `${communities.length ? ` (${communities.map((c) => c.city).join(", ")})` : ""}.`,
  );
  for (const u of plan.upgrades) log(`  ↑ ${describe(u.place)} ← ${u.row.slug} (${u.row.osmId}, por ${u.how})`);
  for (const r of plan.refreshes) log(`  ~ ${describe(r.place)}: ${r.changed.join(", ")}`);
  for (const s of plan.skipped) log(`  · ${describe(s.place)}: ${s.reason}`);
  if (dryRun) {
    log("--dry-run: no se escribió nada.");
    return result;
  }

  // Json? no acepta null en Prisma: se omite al crear y se borra con DbNull al actualizar.
  const forCreate = ({ hours, ...rest }) => (hours ? { ...rest, hours } : rest);
  const forUpdate = (data) => ("hours" in data && !data.hours ? { ...data, hours: Prisma.DbNull } : data);
  const untouchedEdits = { managers: { none: {} }, edits: { none: { status: "accepted" } } };

  for (let i = 0; i < plan.creates.length; i += CREATE_BATCH) {
    const batch = plan.creates.slice(i, i + CREATE_BATCH).map((c) => forCreate(c.data));
    result.written.created += (await prisma.kosherPlace.createMany({ data: batch, skipDuplicates: true })).count;
  }
  // El where repite las condiciones del plan: si alguien editó la ficha mientras tanto, no se pisa.
  const updates = [
    ...plan.upgrades.map((u) => ({
      kind: "upgraded",
      where: { id: u.row.id, source: "osm", status: u.row.status, confirmedAt: null, verifiedAt: null, certificateUrl: null, ...untouchedEdits },
      data: u.data,
    })),
    ...plan.refreshes.map((r) => ({
      kind: "refreshed",
      where: { id: r.row.id, source: "seed", certificateUrl: null, ...untouchedEdits, claims: { none: { state: "approved" } } },
      data: r.data,
    })),
  ];
  for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
    const batch = updates.slice(i, i + UPDATE_BATCH);
    const results = await prisma.$transaction(batch.map((u) => prisma.kosherPlace.updateMany({ where: u.where, data: forUpdate(u.data) })));
    results.forEach((r, j) => (result.written[batch[j].kind] += r.count));
  }
  if (communities.length) result.written.communities = (await prisma.kosherCommunity.createMany({ data: communities, skipDuplicates: true })).count;
  const w = result.written;
  log(`Listo: ${w.created} creados, ${w.upgraded} pasados a verificados, ${w.refreshed} actualizados, ${w.communities} comunidades creadas.`);
  return result;
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

function parseArgs(argv) {
  const args = { dryRun: argv.includes("--dry-run"), force: argv.includes("--force"), dir: verifiedDir() };
  for (const [i, a] of argv.entries()) {
    if (a.startsWith("--dir=")) args.dir = resolve(a.slice(6));
    else if (a === "--dir" && argv[i + 1]) args.dir = resolve(argv[i + 1]);
  }
  return args;
}

async function run({ dryRun, dir }) {
  loadEnvFiles();
  const { sessionDatabaseUrl } = await import("../migrate-deploy.mjs");
  const url = sessionDatabaseUrl();
  if (!url) {
    if (dryRun) {
      const { files, places, problems } = readVerifiedDir(dir, { cities: loadCities(), reservedSlugs: seedSlugs() });
      prefix(`${files.length} archivos en ${dir}: ${places.length} lugares válidos.`);
      reportProblems(problems);
      const byCountry = {};
      for (const p of places) byCountry[p.countryCode] = (byCountry[p.countryCode] ?? 0) + 1;
      for (const [code, n] of Object.entries(byCountry).sort()) prefix(`  ${code}: ${n}`);
      prefix("--dry-run sin DATABASE_URL: solo se leyeron los archivos.");
    } else prefix("Falta DATABASE_URL: no se importa.");
    return;
  }

  const prismaModule = await import("@prisma/client");
  const { PrismaClient, Prisma } = prismaModule.default ?? prismaModule;
  const dbUrl = new URL(url);
  // Una conexión alcanza y no compite con el resto del build por el pooler.
  if (!dbUrl.searchParams.has("connection_limit")) dbUrl.searchParams.set("connection_limit", "1");
  if (!dbUrl.searchParams.has("connect_timeout")) dbUrl.searchParams.set("connect_timeout", "15");
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl.toString() } } });
  try {
    await runVerifiedImport({ prisma, Prisma, dir, dryRun });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (process.env.KOSHER_VERIFIED_IMPORT === "0") {
    prefix("KOSHER_VERIFIED_IMPORT=0: no se importa.");
    return;
  }
  if (process.env.VERCEL_ENV !== "production" && !args.force && !args.dryRun) {
    prefix("No es el deploy de producción: no se importa (usá --force o --dry-run).");
    return;
  }
  if (!existsSync(args.dir)) {
    prefix(`No existe ${args.dir}: nada que importar.`);
    return;
  }
  const timer = setTimeout(() => {
    prefix(`Pasaron ${Math.round(TIMEOUT_MS / 1000)} s: se corta el import y el build sigue. Lo que falte entra en el próximo deploy.`);
    process.exit(0);
  }, TIMEOUT_MS);
  timer.unref();
  await run(args);
  clearTimeout(timer);
}

// Solo corre como script; prisma/seed-kosher.mts importa runVerifiedImport sin disparar esto.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Nunca hace fallar el build: cualquier error se informa y se sale con 0.
  for (const event of ["unhandledRejection", "uncaughtException"]) {
    process.on(event, (error) => {
      prefix(`Error inesperado, el build sigue: ${error?.message ?? error}`);
      process.exit(0);
    });
  }
  main()
    .catch((error) => prefix(`No se pudo importar, el build sigue: ${error?.message ?? error}`))
    .finally(() => {
      process.exitCode = 0;
    });
}
// creado por pato dev y askforvini
