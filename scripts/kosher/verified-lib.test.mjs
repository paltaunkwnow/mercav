// npm run kosher:test-verified
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { LATAM_COUNTRIES } from "../../lib/geo/latam.ts";
import { parseHours as parseHoursTs } from "../../lib/kosher/hours.ts";
import { FOOD_TYPES as FOOD_TYPES_TS, KOSHER_SERVICES } from "../../lib/kosher/labels.ts";
import {
  DENOMINATIONS,
  FOOD_TYPES,
  FOODS,
  NUSACH,
  PLACE_TYPES,
  SERVICES,
  STATUSES,
  STREAMS,
  closeNames,
  parseHours,
  parseVerifiedAt,
  placeData,
  planCommunities,
  planVerified,
  readVerifiedDir,
  validateEntry,
} from "./verified-lib.mjs";
import { seedSlugs } from "./import-verified.mjs";

const ROOT = new URL("../../", import.meta.url);
const CITIES = JSON.parse(readFileSync(new URL("data/kosher/latam-cities.json", ROOT), "utf8")).cities;
const NOW = new Date("2026-10-12T15:00:00Z");
const VERIFIED_AT = new Date("2026-10-10T12:00:00Z");

const entry = (over = {}) => ({
  slug: "ba-deli-test",
  name: "Deli Test",
  type: "restaurant",
  lat: -34.5805,
  lng: -58.4245,
  address: "Gurruchaga 1000",
  city: "Buenos Aires",
  country: "Argentina",
  countryCode: "AR",
  status: "certified",
  agencyName: "Ajdut Kosher",
  sourceUrl: "https://www.ajdutkosher.org/establecimientos",
  ...over,
});
const validate = (over) => validateEntry(entry(over), { verifiedAt: VERIFIED_AT, cities: CITIES });

test("enums iguales a prisma/schema.prisma y a lib/kosher", () => {
  const schema = readFileSync(new URL("prisma/schema.prisma", ROOT), "utf8");
  const values = (name) =>
    new RegExp(`enum ${name} \\{([^}]*)\\}`)
      .exec(schema)[1]
      .split("\n")
      .map((l) => l.replace(/\/\/.*$/, "").trim())
      .filter(Boolean);
  assert.deepEqual(PLACE_TYPES, values("KosherPlaceType"));
  assert.deepEqual(STATUSES, values("KosherStatus"));
  assert.deepEqual(FOODS, values("KosherFood"));
  assert.deepEqual(NUSACH, values("KosherNusach"));
  assert.deepEqual(DENOMINATIONS, values("KosherDenomination"));
  assert.deepEqual(STREAMS, values("KosherStream"));
  assert.deepEqual(SERVICES, Object.keys(KOSHER_SERVICES));
  assert.deepEqual(FOOD_TYPES, [...FOOD_TYPES_TS]);
  assert.deepEqual([...new Set(CITIES.map((c) => c.countryCode))].sort(), LATAM_COUNTRIES.map((c) => c.code).sort());
});

test("horario: mismas reglas que parseHours de lib/kosher/hours.ts", () => {
  const cases = [
    { 1: [{ open: "09:00", close: "18:00" }], 5: [{ open: "09:00", close: "14:00" }] },
    { 0: [{ open: "19:00", close: "23:00" }, { open: " 12:00 ", close: "15:00" }] },
    { 6: [{ open: "21:00", close: "01:00" }], 7: [{ open: "10:00", close: "11:00" }] },
    { 2: [{ open: "24:00", close: "10:00" }, { open: "9:00", close: "10:00" }, { open: "10:00", close: "10:00" }] },
    { 3: Array.from({ length: 6 }, (_, i) => ({ open: `1${i}:00`, close: `1${i}:30` })) },
    { 4: [{ open: "00:00", close: "24:00" }] },
    { 1: "09:00-18:00" },
    [],
    "Mo-Fr 09:00-18:00",
    null,
  ];
  for (const value of cases) assert.deepEqual(parseHours(value), parseHoursTs(value), JSON.stringify(value));
});

test("validación: un lugar correcto queda listo para la base", () => {
  const { place, errors, warnings } = validate({
    city: "CABA",
    hours: { 1: [{ open: "12:00", close: "15:00" }] },
    services: ["takeaway", "delivery"],
    priceLevel: 2,
    foodCategory: "meat",
    website: "www.ejemplo.com",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, ["website no es http(s), se ignora"]);
  assert.equal(place.city, "Buenos Aires", "el alias se normaliza a la ciudad curada");
  assert.equal(place.address, "Gurruchaga 1000", "un alias no se agrega a la dirección");
  assert.equal(place.timezone, "America/Argentina/Buenos_Aires");
  assert.equal(place.source, "seed");
  assert.equal(place.verifiedAt, VERIFIED_AT);
  assert.equal(place.confirmedAt, VERIFIED_AT);
  assert.equal(place.website, null);
  assert.equal(place.communityCity, "buenos-aires");
  assert.deepEqual(place.services, ["takeaway", "delivery"]);
});

test("validación: un suburbio entra en su área metropolitana y queda en la dirección", () => {
  const { place } = validateEntry(
    { ...entry(), lat: -33.4103, lng: -70.5673, address: "Av. Apoquindo 3000", city: "Las Condes", country: "Chile", countryCode: "CL" },
    { verifiedAt: VERIFIED_AT, cities: CITIES },
  );
  assert.equal(place.city, "Santiago");
  assert.equal(place.address, "Av. Apoquindo 3000, Las Condes");
  assert.equal(place.timezone, "America/Santiago");
});

test("validación: errores que dejan el lugar afuera", () => {
  const reasons = (over) => validate(over).errors.join(" | ");
  assert.match(reasons({ sourceUrl: "javascript:alert(1)" }), /sourceUrl/);
  assert.match(reasons({ sourceUrl: undefined }), /sourceUrl/);
  assert.match(reasons({ type: "cafe" }), /type inválido/);
  assert.match(reasons({ status: "kosher" }), /status inválido/);
  assert.match(reasons({ agencyName: undefined }), /certified sin agencyName/);
  assert.match(reasons({ slug: "BA Deli" }), /slug inválido/);
  assert.match(reasons({ countryCode: "US" }), /countryCode/);
  assert.match(reasons({ lat: 34.58 }), /lat fuera/);
  assert.match(reasons({ lat: "-34.58" }), /lat fuera/);
  assert.match(reasons({ lat: -58.4245, lng: -34.5805 }), /km de Buenos Aires/, "lat/lng invertidas");
  assert.match(reasons({ address: " " }), /address/);
  assert.equal(validateEntry("x", { verifiedAt: VERIFIED_AT, cities: CITIES }).place, null);
});

test("validación: datos opcionales malos se descartan con aviso", () => {
  const { place, errors, warnings } = validate({
    hours: { 1: [{ open: "25:00", close: "26:00" }] },
    priceLevel: 5,
    services: ["wifi", "valet"],
    foodCategory: "fish",
    glatt: "yes",
    phone: "123",
    hechsher: "x",
  });
  assert.deepEqual(errors, []);
  assert.equal(place.hours, null);
  assert.equal(place.priceLevel, null);
  assert.deepEqual(place.services, ["wifi"]);
  assert.equal(place.foodCategory, null);
  assert.equal(place.glatt, null);
  assert.equal(place.phone, null);
  assert.equal(warnings.length, 7);
  assert.ok(validate({ hours: { 1: [{ open: "12:00", close: "15:00" }, { open: "x", close: "y" }] } }).warnings[0].includes("turnos inválidos"));
});

test("verifiedAt: fecha al mediodía UTC, ni vieja ni futura", () => {
  assert.equal(parseVerifiedAt("2026-10-10", NOW).toISOString(), "2026-10-10T12:00:00.000Z");
  assert.equal(parseVerifiedAt("2026-10-20", NOW), null);
  assert.equal(parseVerifiedAt("2019-12-31", NOW), null);
  assert.equal(parseVerifiedAt("ayer", NOW), null);
  assert.equal(parseVerifiedAt(undefined, NOW), null);
});

test("carpeta: slugs repetidos, reservados y archivos rotos", () => {
  const dir = mkdtempSync(join(tmpdir(), "kosher-verified-"));
  try {
    writeFileSync(join(dir, "ar.json"), JSON.stringify({ verifiedAt: "2026-10-10", places: [entry(), entry({ slug: "lpz-jabad" }), entry({ slug: "ba-otro", type: "x" })] }));
    writeFileSync(join(dir, "br.json"), JSON.stringify({ verifiedAt: "2026-10-11", places: [entry()] }));
    writeFileSync(join(dir, "cl.json"), JSON.stringify({ verifiedAt: "mañana", places: [entry({ slug: "scl-sin-fecha" })] }));
    writeFileSync(join(dir, "uy.json"), "{ roto");
    writeFileSync(join(dir, "notas.txt"), "no es json");
    const { files, places, problems, slugs } = readVerifiedDir(dir, { cities: CITIES, reservedSlugs: new Set(["lpz-jabad"]), now: NOW });
    assert.deepEqual(files, ["ar.json", "br.json", "cl.json", "uy.json"]);
    assert.deepEqual(places.map((p) => [p.slug, p.file]), [["ba-deli-test", "ar.json"]]);
    const byKey = Object.fromEntries(problems.map((p) => [`${p.file}:${p.slug}`, p.errors.join(" | ")]));
    assert.match(byKey["ar.json:lpz-jabad"], /seed-kosher/);
    assert.match(byKey["ar.json:ba-otro"], /type inválido/);
    assert.match(byKey["br.json:ba-deli-test"], /repetido/);
    assert.match(byKey["cl.json:null"], /verifiedAt/);
    assert.match(byKey["uy.json:null"], /JSON inválido/);
    assert.deepEqual([...slugs].sort(), ["ba-deli-test", "ba-otro", "lpz-jabad", "scl-sin-fecha"], "también los slugs con errores");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("nombres del mismo lugar", () => {
  assert.ok(closeNames("McDonald's Kosher Abasto", "McDonald's Kosher"));
  assert.ok(closeNames("Jabad Palermo", "Beit Jabad Palermo"));
  assert.ok(closeNames("Le Botteghe di Leonardo", "Botteghe di Leonardo Jardins"));
  assert.ok(!closeNames("Sushi Club", "Sushi Pop"), "una palabra en común no alcanza");
  assert.ok(!closeNames("Kosher", "Sinagoga"));
});

// ── Plan ────────────────────────────────────────────────────────────────────

let nextId = 1;
const row = (over = {}) => ({
  id: `r${nextId++}`,
  slug: "x",
  osmId: null,
  published: true,
  certificateUrl: null,
  name: "X",
  nameLocal: null,
  type: "restaurant",
  lat: -34.5805,
  lng: -58.4245,
  source: "osm",
  status: "self_declared",
  confirmedAt: null,
  verifiedAt: null,
  services: [],
  _count: { managers: 0, edits: 0, claims: 0 },
  ...over,
});
const verified = (over) => validate(over).place;

/** Aplica el plan sobre las filas en memoria, como lo haría la base. */
function applyPlan(rows, plan) {
  const out = rows.map((r) => ({ ...r }));
  for (const c of plan.creates) out.push(row({ ...c.data, id: `r${nextId++}` }));
  for (const u of [...plan.upgrades, ...plan.refreshes]) Object.assign(out.find((r) => r.id === u.row.id), u.data);
  return out;
}

test("plan: crea, pasa OSM a verificado y saltea lo editado en Mercav", () => {
  const places = [
    verified({ slug: "ba-nuevo", name: "Restaurante Nuevo", lat: -34.59, lng: -58.43 }),
    verified({ slug: "ba-mcdonalds-abasto", name: "McDonald's Kosher Abasto", lat: -34.60312, lng: -58.41118 }),
    verified({ slug: "ba-palermo-kosher", name: "Palermo Kosher", type: "grocery_branch", lat: -34.58092, lng: -58.41205 }),
    verified({ slug: "ba-comunidad", name: "Pizzería Comunitaria", lat: -34.57, lng: -58.44 }),
    verified({ slug: "ba-editado", name: "Editado", lat: -34.56, lng: -58.45 }),
  ];
  const rows = [
    row({ slug: "buenos-aires-mcdonald-s-kosher", name: "McDonald's Kosher", osmId: "node/1", lat: -34.6031063, lng: -58.411171 }),
    row({ slug: "buenos-aires-palermo-kosher", name: "Palermo Kosher", type: "grocery_branch", status: "some_products", osmId: "node/2", lat: -34.5809149, lng: -58.4120422, _count: { managers: 1, edits: 0, claims: 0 } }),
    row({ slug: "ba-pizzeria", name: "Pizzería Comunitaria", source: "community", status: "community_report", lat: -34.57001, lng: -58.44001 }),
    row({ slug: "ba-editado", name: "Editado", source: "seed", status: "certified", lat: -34.56, lng: -58.45, _count: { managers: 0, edits: 1, claims: 0 } }),
  ];
  const plan = planVerified({ places, rows, osmStatuses: new Map([["node/1", "self_declared"], ["node/2", "some_products"]]) });
  assert.deepEqual(plan.creates.map((c) => c.data.slug), ["ba-nuevo"]);
  assert.equal(plan.upgrades.length, 1);
  const up = plan.upgrades[0];
  assert.equal(up.row.slug, "buenos-aires-mcdonald-s-kosher");
  assert.equal(up.data.slug, undefined, "conserva el slug de OSM");
  assert.equal(up.data.osmId, undefined, "conserva el osmId");
  assert.equal(up.data.source, "seed");
  assert.equal(up.data.status, "certified");
  assert.equal(up.data.published, true);
  assert.equal(up.data.notes, null, "lo que el archivo no trae queda vacío");
  assert.deepEqual(
    plan.skipped.map((s) => [s.place.slug, s.reason.split(" (")[0]]),
    [
      ["ba-palermo-kosher", "ya existe de OpenStreetMap editado en Mercav"],
      ["ba-comunidad", "ya existe cargado por la comunidad"],
      ["ba-editado", "editado en Mercav"],
    ],
  );

  // Segunda corrida sobre el resultado: no hay nada que hacer.
  const again = planVerified({ places, rows: applyPlan(rows, plan), osmStatuses: new Map([["node/2", "some_products"]]) });
  assert.equal(again.creates.length + again.upgrades.length + again.refreshes.length, 0);
  assert.deepEqual(again.unchanged.map((u) => u.place.slug), ["ba-nuevo", "ba-mcdonalds-abasto"]);
  assert.equal(again.skipped.length, 3);
});

test("plan: un lugar verificado sin editar se refresca desde el archivo", () => {
  const before = verified({ slug: "ba-deli", phone: "+54 11 4444-0000" });
  const rows = [row({ ...placeData(before), slug: "ba-deli" })];
  const after = verified({ slug: "ba-deli", phone: "+54 11 4444-1111", hours: { 5: [{ open: "09:00", close: "14:00" }] } });
  const plan = planVerified({ places: [after], rows });
  assert.equal(plan.refreshes.length, 1);
  assert.deepEqual(plan.refreshes[0].changed, ["phone", "hours"]);
  assert.deepEqual(Object.keys(plan.refreshes[0].data), ["phone", "hours"]);
  const managed = planVerified({ places: [after], rows: [{ ...rows[0], _count: { managers: 1, edits: 0, claims: 0 } }] });
  assert.equal(managed.refreshes.length, 0);
  assert.match(managed.skipped[0].reason, /editado en Mercav/);
  const certificate = planVerified({ places: [after], rows: [{ ...rows[0], certificateUrl: "https://x.org/c.pdf" }] });
  assert.match(certificate.skipped[0].reason, /editado en Mercav/);
});

test("plan: OSM tocado, otro tipo, lejos, slug ajeno y seed a mano", () => {
  const p = verified({ slug: "ba-tejelet", name: "Tejelet", type: "grocery_branch", lat: -34.579227, lng: -58.4151224 });
  const osm = row({ slug: "buenos-aires-tejelet", name: "Tejelet", type: "grocery_branch", status: "some_products", osmId: "node/3", lat: -34.579227, lng: -58.4151224 });
  const statuses = new Map([["node/3", "some_products"]]);
  assert.equal(planVerified({ places: [p], rows: [osm], osmStatuses: statuses }).upgrades.length, 1);
  // Cambió el nivel (una sugerencia aceptada, o un moderador): ya no es de OSM sin tocar.
  assert.equal(planVerified({ places: [p], rows: [{ ...osm, status: "certified" }], osmStatuses: statuses }).skipped.length, 1);
  assert.equal(planVerified({ places: [p], rows: [{ ...osm, verifiedAt: new Date() }], osmStatuses: statuses }).skipped.length, 1);
  // Sinagoga con el mismo nombre en la puerta de al lado: no es el mismo lugar.
  assert.equal(planVerified({ places: [p], rows: [{ ...osm, type: "synagogue", status: "unknown" }] }).creates.length, 1);
  // A más de 80 m.
  assert.equal(planVerified({ places: [p], rows: [{ ...osm, lat: -34.5805 }], osmStatuses: statuses }).creates.length, 1);
  // Despublicado: no cuenta.
  assert.equal(planVerified({ places: [p], rows: [{ ...osm, published: false }], osmStatuses: statuses }).creates.length, 1);
  // El slug del archivo lo usa otro lugar en otra parte.
  const taken = planVerified({ places: [p], rows: [row({ slug: "ba-tejelet", name: "Otro", lat: -34.7, lng: -58.5, source: "community" })] });
  assert.match(taken.skipped[0].reason, /slug ya lo usa otro lugar/);
  assert.equal(taken.creates.length, 0);
  // Ya está en prisma/seed-kosher.mts con otro slug.
  const seed = planVerified({ places: [p], rows: [row({ slug: "ba-tejelet-seed", name: "Tejelet", type: "grocery_branch", source: "seed", status: "certified", lat: -34.57923, lng: -58.41512 })] });
  assert.match(seed.skipped[0].reason, /ya está verificado como ba-tejelet-seed/);
});

test("plan: dos lugares del archivo no se quedan con la misma ficha de OSM", () => {
  const a = verified({ slug: "ba-deli-centro", name: "Kosher Deli Centro", lat: -34.6, lng: -58.4 });
  const b = verified({ slug: "ba-deli", name: "Kosher Deli", lat: -34.6001, lng: -58.4001 });
  const osm = row({ slug: "buenos-aires-kosher-deli", name: "Kosher Deli", osmId: "node/4", lat: -34.6, lng: -58.4 });
  const plan = planVerified({ places: [a, b], rows: [osm] });
  assert.deepEqual(plan.upgrades.map((u) => u.place.slug), ["ba-deli"], "gana el nombre idéntico");
  assert.deepEqual(plan.creates.map((c) => c.place.slug), ["ba-deli-centro"]);
});

test("comunidades: solo las ciudades curadas que faltan", () => {
  const places = [verified({ slug: "a" }), verified({ slug: "b", lat: -31.4201, lng: -64.1888, city: "Córdoba", address: "Calle 1" }), { communityCity: null }];
  const existing = [{ slug: "buenos-aires", city: "Buenos Aires", countryCode: "AR" }, { slug: "cordoba-ar", city: "Otra", countryCode: "AR" }];
  const out = planCommunities(places, existing, CITIES);
  assert.deepEqual(out.map((c) => [c.slug, c.city, c.timezone]), [["cordoba-ar-ar", "Córdoba", "America/Argentina/Cordoba"]]);
});

test("los archivos de prisma/kosher-places son válidos", () => {
  assert.ok(seedSlugs().has("lpz-jabad"), "lee los slugs de prisma/seed-kosher.mts");
  const { places, problems } = readVerifiedDir(fileURLToPath(new URL("prisma/kosher-places", ROOT)), { cities: CITIES, reservedSlugs: seedSlugs() });
  const list = problems.flatMap((p) => [...p.errors, ...p.warnings].map((m) => `${p.file} · ${p.slug}: ${m}`));
  assert.deepEqual(list, [], `${list.length} problemas en ${places.length + problems.length} lugares`);
});
// creado por pato dev y askforvini
