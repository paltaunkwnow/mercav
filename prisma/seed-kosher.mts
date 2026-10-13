// Mercav Kosher atlas. Every row below was checked against the linked public source on VERIFIED_AT.
// Only add a place with a source that names it at that address; kashrut status only from the certifying agency.
// Idempotent: re-running updates rows by slug and removes seed rows that are no longer listed.
// Run with: npm run seed:kosher
import prismaPkg from "@prisma/client";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

const VERIFIED_AT = new Date("2026-09-29T12:00:00Z");
const BDK = "https://bdk.com.br/estabelecimentos";

type Place = Record<string, unknown> & { slug: string; name: string; sourceUrl: string };

const places: Place[] = [
  {
    slug: "lpz-circulo-israelita",
    name: "Círculo Israelita de Bolivia",
    type: "community",
    lat: -16.507,
    lng: -68.1332,
    address: "Calle Landaeta 346",
    city: "La Paz",
    country: "Bolivia",
    countryCode: "BO",
    status: "unknown",
    denomination: "orthodox",
    phone: "+591 2 2785083",
    notes: "Institución central de la comunidad judía de Bolivia, afiliada al Congreso Judío Mundial. El pin marca la calle; confirmá el acceso por teléfono.",
    sourceUrl: "https://www.worldjewishcongress.org/es/about/communities/BO",
  },
  {
    slug: "lpz-jabad",
    name: "Jabad Bolivia",
    type: "synagogue",
    lat: -16.4966,
    lng: -68.14,
    address: "Calle Santa Cruz 414, esq. Illampu",
    city: "La Paz",
    country: "Bolivia",
    countryCode: "BO",
    status: "unknown",
    denomination: "orthodox",
    orthodoxStream: "chabad",
    nusach: "chabad",
    phone: "+591 765 69 770",
    website: "https://www.chabadofbolivia.com",
    notes: "Casa Jabad dirigida por el rabino Aharon Freiman. Consultá horarios de tefilá y comidas de Shabat directamente con la casa.",
    sourceUrl: "https://www.chabadofbolivia.com",
  },
  {
    slug: "ba-templo-libertad",
    name: "Templo Libertad · CIRA",
    nameLocal: "Congregación Israelita de la República Argentina",
    type: "synagogue",
    lat: -34.5996,
    lng: -58.3839,
    address: "Libertad 769",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    status: "unknown",
    phone: "+54 11 3986-3260",
    website: "https://www.templolibertad.org.ar",
    notes: "Sinagoga histórica de la ciudad. En el mismo edificio funciona el Museo Judío de Buenos Aires.",
    sourceUrl: "https://www.templolibertad.org.ar",
  },
  {
    slug: "ba-amia",
    name: "AMIA",
    nameLocal: "Asociación Mutual Israelita Argentina",
    type: "community",
    lat: -34.6018,
    lng: -58.3994,
    address: "Pasteur 633",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    status: "unknown",
    phone: "+54 11 4959-8800",
    website: "https://www.amia.org.ar",
    notes: "Mutual central de la comunidad judía argentina. Ofrece visitas guiadas con reserva previa.",
    sourceUrl: "https://www.amia.org.ar",
  },
  {
    slug: "ba-museo-holocausto",
    name: "Museo del Holocausto de Buenos Aires",
    type: "museum",
    lat: -34.598,
    lng: -58.3896,
    address: "Montevideo 919",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    status: "unknown",
    phone: "+54 11 3987-1945",
    website: "https://www.museodelholocausto.org.ar",
    notes: "Según su sitio abre de lunes a jueves de 11 a 20 h y domingos de 14 a 18 h.",
    sourceUrl: "https://www.museodelholocausto.org.ar",
  },
  {
    slug: "sp-cip-etz-chaim",
    name: "CIP · Sinagoga Etz Chaim",
    nameLocal: "Congregação Israelita Paulista",
    type: "synagogue",
    lat: -23.5545,
    lng: -46.6608,
    address: "Rua Antônio Carlos 653, Consolação",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    status: "unknown",
    phone: "+55 11 2808-6299",
    website: "https://www.cip.org.br",
    sourceUrl: "https://www.cip.org.br",
  },
  {
    slug: "sp-museu-judaico",
    name: "Museu Judaico de São Paulo",
    type: "museum",
    lat: -23.5508,
    lng: -46.6456,
    address: "Rua Martinho Prado 128, Bela Vista",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    status: "unknown",
    website: "https://museujudaicosp.org.br",
    notes: "Funciona en la antigua sinagoga Beth-El. Según su sitio abre de martes a domingo de 10 a 18 h.",
    sourceUrl: "https://museujudaicosp.org.br",
  },
  {
    slug: "sp-gelato-borelli",
    name: "Gelato Borelli Higienópolis",
    type: "restaurant",
    lat: -23.5445,
    lng: -46.6602,
    address: "Praça Vilaboim 31, Higienópolis",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    status: "certified",
    agencyName: "BDK",
    confirmedAt: VERIFIED_AT,
    phone: "+55 11 97641-8492",
    website: "https://www.gelatoborelli.com.br",
    notes: "Parcialmente kosher según BDK: solo esta unidad está certificada. Pedí el cardápio kosher en el local.",
    sourceUrl: BDK,
  },
  {
    slug: "sp-miracolo",
    name: "Miracolo Gelateria",
    type: "restaurant",
    lat: -23.566,
    lng: -46.6634,
    address: "Alameda Lorena 1178, Jardins",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    status: "certified",
    agencyName: "BDK",
    confirmedAt: VERIFIED_AT,
    phone: "+55 24 99976-3215",
    notes: "Parcialmente kosher según BDK. Consultá el cardápio kosher en la tienda antes de pedir.",
    sourceUrl: BDK,
  },
  {
    slug: "sp-le-botteghe-di-leonardo",
    name: "Le Botteghe di Leonardo",
    type: "restaurant",
    lat: -23.5683,
    lng: -46.6629,
    address: "Rua Oscar Freire 42, Jardins",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    status: "certified",
    agencyName: "BDK",
    confirmedAt: VERIFIED_AT,
    website: "https://www.lebotteghedileonardo.com.br",
    notes: "Parcialmente kosher según BDK. La tienda tiene un cardápio kasher para consultar.",
    sourceUrl: BDK,
  },
  {
    slug: "rec-kahal-zur-israel",
    name: "Sinagoga Kahal Zur Israel",
    nameLocal: "קהל צור ישראל",
    type: "museum",
    lat: -8.0613,
    lng: -34.8713,
    address: "Rua do Bom Jesus 197, Recife Antigo",
    city: "Recife",
    country: "Brasil",
    countryCode: "BR",
    status: "unknown",
    phone: "+55 81 3224-2128",
    notes: "Primera sinagoga de las Américas (1636), hoy museo y Archivo Histórico Judaico de Pernambuco. Confirmá el horario por teléfono.",
    sourceUrl: "https://visit.recife.br/o-que-fazer/atracoes/museus/sinagoga-kahal-zur-israel",
  },
  {
    slug: "mvd-kehila",
    name: "Kehilá · Comunidad Israelita del Uruguay",
    type: "community",
    lat: -34.9202,
    lng: -56.1577,
    address: "Gregorio Suárez 2830, Punta Carretas",
    city: "Montevideo",
    country: "Uruguay",
    countryCode: "UY",
    status: "unknown",
    denomination: "orthodox",
    orthodoxStream: "modern",
    phone: "+598 2712 0100",
    website: "https://www.kehila.org.uy",
    sourceUrl: "https://www.kehila.org.uy",
  },
  {
    slug: "scl-circulo-israelita",
    name: "Círculo Israelita de Santiago",
    type: "synagogue",
    lat: -33.3569,
    lng: -70.513,
    address: "Comandante Malbec 13210, Lo Barnechea",
    city: "Santiago",
    country: "Chile",
    countryCode: "CL",
    status: "unknown",
    denomination: "conservative",
    phone: "+56 2 2240 5000",
    website: "https://www.cis.cl",
    notes: "Comunidad masortí con sinagoga, centro comunitario y mikvé.",
    sourceUrl: "https://www.cis.cl",
  },
];

const communities = [
  {
    slug: "la-paz",
    timezone: "America/La_Paz",
    name: "Comunidad judía de La Paz",
    city: "La Paz",
    country: "Bolivia",
    countryCode: "BO",
    lat: -16.4958,
    lng: -68.1333,
    languages: ["es", "he"],
    denominationNotes: "Círculo Israelita de Bolivia (ortodoxo) y Casa Jabad.",
  },
  {
    slug: "santa-cruz",
    timezone: "America/La_Paz",
    name: "Comunidad judía de Santa Cruz",
    city: "Santa Cruz de la Sierra",
    country: "Bolivia",
    countryCode: "BO",
    lat: -17.7833,
    lng: -63.1821,
    languages: ["es", "he"],
    denominationNotes: "Círculo Israelita de Santa Cruz, reformista según el Congreso Judío Mundial. Sin dirección pública.",
  },
  {
    slug: "buenos-aires",
    timezone: "America/Argentina/Buenos_Aires",
    name: "Comunidad judía de Buenos Aires",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    lat: -34.6037,
    lng: -58.3816,
    languages: ["es", "he", "yi"],
    denominationNotes: "AMIA como mutual central; kashrut supervisada por Ajdut Kosher, entre otras agencias.",
  },
  {
    slug: "sao-paulo",
    timezone: "America/Sao_Paulo",
    name: "Comunidade judaica de São Paulo",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    lat: -23.5505,
    lng: -46.6333,
    languages: ["pt", "he"],
    denominationNotes: "CIP como congregación central; kashrut supervisada por BDK, entre otras agencias.",
  },
  {
    slug: "recife",
    timezone: "America/Recife",
    name: "Comunidade judaica do Recife",
    city: "Recife",
    country: "Brasil",
    countryCode: "BR",
    lat: -8.0476,
    lng: -34.877,
    languages: ["pt", "he"],
    denominationNotes: "Federação Israelita de Pernambuco. Sede de la primera sinagoga de las Américas.",
  },
  {
    slug: "montevideo",
    timezone: "America/Montevideo",
    name: "Comunidad judía de Montevideo",
    city: "Montevideo",
    country: "Uruguay",
    countryCode: "UY",
    lat: -34.9011,
    lng: -56.1645,
    languages: ["es", "he"],
    denominationNotes: "Kehilá, ortodoxia moderna.",
  },
  {
    slug: "santiago",
    timezone: "America/Santiago",
    name: "Comunidad judía de Santiago",
    city: "Santiago",
    country: "Chile",
    countryCode: "CL",
    lat: -33.4489,
    lng: -70.6693,
    languages: ["es", "he"],
    denominationNotes: "Círculo Israelita de Santiago, masortí.",
  },
];

// Extra verified places live in prisma/kosher-places/*.json (one file per region), same shape as `places`.
// Each file is { verifiedAt: ISO date, places: Place[] }.
function loadRegionFiles(): Array<{ place: Place; verifiedAt: Date }> {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "kosher-places");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const rows: Array<{ place: Place; verifiedAt: Date }> = [];
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(join(dir, file), "utf8")) as { verifiedAt: string; places: Place[] };
    const verifiedAt = new Date(parsed.verifiedAt);
    for (const place of parsed.places) {
      if (!place.slug || !place.name || !place.sourceUrl) throw new Error(`${file}: lugar sin slug, nombre o fuente`);
      rows.push({ place, verifiedAt });
    }
  }
  return rows;
}

async function main() {
  const regionRows = loadRegionFiles();
  const seen = new Set<string>();
  for (const slug of [...places.map((p) => p.slug), ...regionRows.map((r) => r.place.slug)]) {
    if (seen.has(slug)) throw new Error(`Slug repetido en el seed: ${slug}`);
    seen.add(slug);
  }
  const slugs = [...seen];
  const removed = await prisma.kosherPlace.deleteMany({ where: { source: "seed", slug: { notIn: slugs } } });
  // Solo se borran las comunidades que ya no están en el seed y no tienen lugares: las que creó la importación de
  // OpenStreetMap (u otra fuente) tienen lugares publicados y se quedan.
  const withPlaces = await prisma.kosherPlace.findMany({ where: { published: true }, distinct: ["city", "countryCode"], select: { city: true, countryCode: true } });
  const keep = new Set(withPlaces.map((p) => `${p.countryCode}:${p.city}`));
  const stale = await prisma.kosherCommunity.findMany({ where: { slug: { notIn: communities.map((c) => c.slug) } }, select: { id: true, city: true, countryCode: true } });
  const removedCommunities = await prisma.kosherCommunity.deleteMany({
    where: { id: { in: stale.filter((c) => !keep.has(`${c.countryCode}:${c.city}`)).map((c) => c.id) } },
  });

  for (const p of places) {
    const data = { ...p, source: "seed", verifiedAt: VERIFIED_AT } as never;
    await prisma.kosherPlace.upsert({ where: { slug: p.slug }, create: data, update: data });
  }
  for (const { place, verifiedAt } of regionRows) {
    const data = { ...place, source: "seed", verifiedAt } as never;
    await prisma.kosherPlace.upsert({ where: { slug: place.slug }, create: data, update: data });
  }
  for (const c of communities) {
    const data = { ...c, population: null, populationYear: null, populationSource: null };
    await prisma.kosherCommunity.upsert({ where: { slug: c.slug }, create: data, update: data });
  }
  console.log(
    `Kosher: ${places.length + regionRows.length} lugares y ${communities.length} comunidades verificados. Eliminados: ${removed.count} lugares y ${removedCommunities.count} comunidades sin fuente.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
