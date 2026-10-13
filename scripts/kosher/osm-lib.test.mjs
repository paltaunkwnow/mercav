// npm run kosher:test-osm
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHours } from "../../lib/kosher/hours.ts";
import {
  assignCity,
  buildAddress,
  classifyTags,
  cleanWebsite,
  findDuplicate,
  isUntouchedOsm,
  mainName,
  osmOpeningHours,
  parseSeedPlaces,
  placeSlug,
  similarNames,
  tidyName,
} from "./osm-lib.mjs";

const hours = (raw) => parseHours(osmOpeningHours(raw));

test("horario: patrones simples", () => {
  assert.deepEqual(hours("Mo-Fr 09:00-18:00; Sa 10:00-14:00"), {
    1: [{ open: "09:00", close: "18:00" }],
    2: [{ open: "09:00", close: "18:00" }],
    3: [{ open: "09:00", close: "18:00" }],
    4: [{ open: "09:00", close: "18:00" }],
    5: [{ open: "09:00", close: "18:00" }],
    6: [{ open: "10:00", close: "14:00" }],
  });
  const suTh = hours("Su-Th 12:00-15:00,19:00-23:00");
  assert.deepEqual(Object.keys(suTh), ["0", "1", "2", "3", "4"]);
  assert.deepEqual(suTh["0"], [
    { open: "12:00", close: "15:00" },
    { open: "19:00", close: "23:00" },
  ]);
  assert.deepEqual(hours("24/7")["3"], [{ open: "00:00", close: "24:00" }]);
  assert.deepEqual(Object.keys(hours("10:00-22:00")), ["0", "1", "2", "3", "4", "5", "6"]);
});

test("horario: reglas que pisan, off, PH y medianoche", () => {
  const h = hours("Mo-Su 10:00-22:00; Sa off; PH off");
  assert.equal(h["6"], undefined);
  assert.deepEqual(h["0"], [{ open: "10:00", close: "22:00" }]);
  assert.deepEqual(hours("Fr 20:00-02:00")["5"], [{ open: "20:00", close: "02:00" }]);
  assert.deepEqual(hours("Sa 19:00-26:00")["6"], [{ open: "19:00", close: "02:00" }]);
  assert.deepEqual(hours("Mo-Fr 08:00-17:00, Sa 09:00-13:00")["6"], [{ open: "09:00", close: "13:00" }]);
  assert.deepEqual(hours("Mo,We 9:30-12:00")["3"], [{ open: "09:30", close: "12:00" }]);
});

test("horario: lo que no se entiende queda en null", () => {
  for (const raw of ["Jan-Mar Mo-Fr 09:00-18:00", "Mo-Fr 09:00+", "sunrise-sunset", 'Mo-Fr 09:00-18:00 "con reserva"', "Lu-Vi 09:00-18:00", "Mo[1] 10:00-12:00", "", null]) {
    assert.equal(hours(raw), null, String(raw));
  }
});

test("tipo y nivel: nunca certified", () => {
  assert.deepEqual(classifyTags({ amenity: "place_of_worship", religion: "jewish", name: "Templo X" }), { type: "synagogue", status: "unknown", notes: null });
  assert.equal(classifyTags({ amenity: "restaurant", "diet:kosher": "only", name: "R" }).status, "self_declared");
  assert.equal(classifyTags({ amenity: "fast_food", "diet:kosher": "yes", name: "R" }).status, "some_dishes");
  assert.equal(classifyTags({ shop: "supermarket", "diet:kosher": "yes", name: "S" }).status, "some_products");
  assert.deepEqual(classifyTags({ shop: "butcher", "diet:kosher": "only", name: "B" }).type, "butcher");
  assert.equal(classifyTags({ shop: "kosher", name: "K" }).status, "self_declared");
  const cert = classifyTags({ amenity: "restaurant", "diet:kosher": "only", "diet:kosher:certification": "Ajdut Kosher", name: "R" });
  assert.equal(cert.status, "self_declared");
  assert.equal(cert.notes, "Según OpenStreetMap: Ajdut Kosher");
  assert.equal(classifyTags({ amenity: "school", religion: "jewish", name: "Escuela" }).type, "school");
  assert.equal(classifyTags({ amenity: "mikveh", name: "Mikve" }).type, "mikvah");
  assert.equal(classifyTags({ tourism: "museum", name: "Museo del Holocausto" }).type, "museum");
  assert.equal(classifyTags({ amenity: "community_centre", religion: "jewish", name: "Hebraica" }).type, "community");
});

test("tipo: se descarta lo que no corresponde", () => {
  assert.ok(classifyTags({ amenity: "place_of_worship", religion: "jewish" }).skip, "sin nombre");
  assert.ok(classifyTags({ amenity: "place_of_worship", religion: "jewish", name: "Centro Mesiánico" }).skip);
  assert.ok(classifyTags({ amenity: "place_of_worship", religion: "jewish", name: "Iglesia Israelita del Nuevo Pacto" }).skip);
  assert.ok(classifyTags({ landuse: "cemetery", religion: "jewish", name: "Cementerio" }).skip);
  assert.ok(classifyTags({ amenity: "restaurant", "diet:kosher": "no", name: "R" }).skip);
  assert.ok(classifyTags({ amenity: "pharmacy", "diet:kosher": "yes", name: "F" }).skip);
  assert.ok(classifyTags({ amenity: "place_of_worship", religion: "jewish", name: "Salón del Reino de los Testigos de Jehová" }).skip);
  assert.ok(classifyTags({ amenity: "place_of_worship", religion: "jewish", name: "Maçonaria Temple" }).skip);
  assert.ok(classifyTags({ tourism: "museum", name: "Memorial do Poder Judiciário" }).skip, "judiciário no es judío");
  const bulk = { shop: "supermarket", name: "Super", "diet:kosher": "only", "diet:halal": "yes", "diet:vegan": "yes", "diet:gluten_free": "yes" };
  assert.ok(classifyTags(bulk).skip, "todas las dietas en yes");
  assert.equal(classifyTags({ ...bulk, name: "Super Kosher" }).status, "self_declared", "con señal propia sí entra");
  assert.equal(classifyTags({ shop: "convenience", name: "Tienda", "diet:kosher": "only" }).signal, false);
  assert.ok(classifyTags({ amenity: "school", religion: "jewish", name: "EMEB Padre José", "operator:type": "government" }).skip);
});

test("nombre: branch y alternativos", () => {
  assert.equal(mainName({ name: "McDonald's", branch: "Kosher" }), "McDonald's Kosher");
  assert.equal(mainName({ name: "Palermo Kosher", branch: "Kosher" }), "Palermo Kosher");
  assert.equal(mainName({ alt_name: "Sinagoga Beit Yaakov;Beit Yaakov" }), "Sinagoga Beit Yaakov");
  assert.equal(tidyName("museo judio del paraguay"), "Museo Judio del Paraguay");
  assert.equal(tidyName("AMIA"), "AMIA");
});

const CITIES = [
  { slug: "buenos-aires", city: "Buenos Aires", countryCode: "AR", lat: -34.6037, lng: -58.3816, radiusKm: 45, aliases: ["Ciudad Autónoma de Buenos Aires"] },
  { slug: "la-plata", city: "La Plata", countryCode: "AR", lat: -34.9205, lng: -57.9536, radiusKm: 20 },
];

test("ciudad: alias, suburbio, sin lista y fuera de todo", () => {
  assert.equal(assignCity({ lat: -34.6, lng: -58.4, countryCode: "AR", addrCity: "Ciudad Autónoma de Buenos Aires" }, CITIES).city.slug, "buenos-aires");
  const lanus = assignCity({ lat: -34.7065, lng: -58.3862, countryCode: "AR", addrCity: "Lanús" }, CITIES);
  assert.equal(lanus.city.slug, "buenos-aires");
  assert.equal(lanus.how, "nearest");
  const calafate = assignCity({ lat: -50.3384, lng: -72.2667, countryCode: "AR", addrCity: "El Calafate" }, CITIES);
  assert.equal(calafate.city, null);
  assert.equal(calafate.name, "El Calafate");
  assert.equal(assignCity({ lat: -31.18, lng: -59.4, countryCode: "AR" }, CITIES), null);
  // addr:city de otra ciudad de la lista pero el punto queda lejísimos: se usa la cercanía.
  assert.equal(assignCity({ lat: -34.92, lng: -57.95, countryCode: "AR", addrCity: "Buenos Aires" }, CITIES).city.slug, "buenos-aires");
});

test("dirección: calle, barrio y suburbio dentro de la metrópoli", () => {
  assert.equal(buildAddress({ "addr:street": "Libertad", "addr:housenumber": "769" }, { cityName: "Buenos Aires" }), "Libertad 769");
  assert.equal(buildAddress({ "addr:street": "Tucumán", "addr:housenumber": "1270", "addr:city": "Lanús" }, { cityName: "Buenos Aires" }), "Tucumán 1270, Lanús");
  assert.equal(buildAddress({}, { cityName: "Rosario" }), "Rosario");
  assert.equal(
    buildAddress({ "addr:street": "Paso", "addr:housenumber": "423", "addr:city": "Ciudad Autónoma de Buenos Aires" }, { cityName: "Buenos Aires", cityAliases: ["Ciudad Autónoma de Buenos Aires"] }),
    "Paso 423",
  );
});

test("sitio web solo http(s)", () => {
  assert.equal(cleanWebsite({ website: "www.ejemplo.org" }), "https://www.ejemplo.org/");
  assert.equal(cleanWebsite({ website: "javascript:alert(1)" }), null);
  assert.equal(cleanWebsite({ "contact:instagram": "@algo" }), null);
});

test("duplicados y slugs", () => {
  assert.ok(similarNames("Templo Libertad · CIRA", "Sinagoga de la Congregación Israelita (CIRA)"));
  assert.ok(!similarNames("Sinagoga Or Torah", "Templo Israelita"), "solo palabras genéricas");
  assert.ok(similarNames("Templo Libertad · CIRA", "Templo Libertad (Sinagoga)"));
  assert.ok(similarNames("Jabad Bolivia", "Beit Jabad Bolivia"));
  assert.ok(!similarNames("Beit Jabad Palermo", "Beit Jabad Belgrano"));
  const seed = [{ slug: "ba-templo-libertad", name: "Templo Libertad · CIRA", lat: -34.5996, lng: -58.3839 }];
  const osm = { name: "Sinagoga de la Congregación Israelita (CIRA)", names: ["Sinagoga de la Congregación Israelita (CIRA)", "Templo Libertad (Sinagoga)"], lat: -34.59961, lng: -58.38392 };
  assert.equal(findDuplicate(osm, seed)?.slug, "ba-templo-libertad");
  assert.equal(findDuplicate({ ...osm, lat: -34.61 }, seed), null, "a más de 80 m no es el mismo");
  const jabad = [{ slug: "lpz-jabad", name: "Jabad Bolivia", lat: -16.4966, lng: -68.14 }];
  assert.equal(findDuplicate({ name: "Casa Jabad", lat: -16.4966, lng: -68.14 }, jabad)?.slug, "lpz-jabad", "misma puerta, otra forma de nombrarla");
  const cis = [{ name: "Centro Israelita Sionista de Costa Rica", type: "synagogue", lat: 9.938, lng: -84.1175 }];
  assert.ok(findDuplicate({ name: "Sinagoga", type: "synagogue", lat: 9.9379, lng: -84.1173 }, cis, { sameType: true, closeWords: false }), "nombre genérico pegado");
  const once = [{ name: "Sinagoga Shaaré Tefilá", type: "synagogue", lat: -34.6004, lng: -58.4031 }];
  assert.equal(findDuplicate({ name: "Sinagoga Or Torah", type: "synagogue", lat: -34.6005, lng: -58.4031 }, once, { sameType: true, closeWords: false }), null);
  const taken = new Set(["buenos-aires-beit-jabad"]);
  assert.equal(placeSlug({ city: "Buenos Aires", name: "Beit Jabad", osmId: "way/1528638181" }, taken), "buenos-aires-beit-jabad-w1528638181");
  assert.equal(placeSlug({ city: "São Paulo", name: "Beit Chabad Itaim", osmId: "node/1" }, taken), "sao-paulo-beit-chabad-itaim");
  assert.equal(placeSlug({ city: "Santos", name: "בית יעקב", osmId: "way/463431073" }, taken), "santos-w463431073");
});

test("seed: lee los lugares del texto de seed-kosher.mts", () => {
  const source = `const places: Place[] = [
  {
    slug: "lpz-jabad",
    name: "Jabad Bolivia",
    type: "synagogue",
    lat: -16.4966,
    lng: -68.14,
  },
];

const communities = [];`;
  assert.deepEqual(parseSeedPlaces(source).map((p) => [p.slug, p.name, p.lat, p.lng]), [["lpz-jabad", "Jabad Bolivia", -16.4966, -68.14]]);
});
test("import-osm solo refresca lo que sigue siendo de OSM sin tocar", () => {
  const row = { source: "osm", status: "self_declared", confirmedAt: null, verifiedAt: null, certificateUrl: null, _count: { managers: 0, edits: 0 } };
  assert.ok(isUntouchedOsm(row, "self_declared"));
  assert.ok(isUntouchedOsm(row), "sin nivel del snapshot alcanza con un nivel del import");
  // import-verified.mjs lo pasó a verificado: conserva el osmId pero ya no es de OSM.
  assert.ok(!isUntouchedOsm({ ...row, source: "seed", status: "certified", verifiedAt: new Date(), confirmedAt: new Date() }, "self_declared"));
  assert.ok(!isUntouchedOsm({ ...row, source: "seed" }, "self_declared"), "aunque el resto coincida");
  assert.ok(!isUntouchedOsm({ ...row, _count: { managers: 1, edits: 0 } }, "self_declared"));
  assert.ok(!isUntouchedOsm({ ...row, _count: { managers: 0, edits: 2 } }, "self_declared"));
  assert.ok(!isUntouchedOsm({ ...row, status: "certified" }));
  assert.ok(!isUntouchedOsm({ ...row, status: "some_dishes" }, "self_declared"));
  assert.ok(!isUntouchedOsm({ ...row, certificateUrl: "https://x.org/c.pdf" }, "self_declared"));
});
// creado por pato dev y askforvini
