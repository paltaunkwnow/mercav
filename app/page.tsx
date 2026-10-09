import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  LandingCTA,
  LandingFAQ,
  LandingHero,
  LandingMarquee,
  LandingMervi,
  LandingPillars,
  LandingRegion,
  LandingSteps,
  LandingTrust,
  type KevItem,
  type LandingData,
  type PayslipDemo,
  type PlaceItem,
} from "@/components/home/HomeLanding";
import type { CountryInfo, ShabbatCity } from "@/components/home/LandingClient";
import { PWN_FEED_SOURCES } from "@/lib/integrations/pwn/feed-catalog";
import { dayOffEntries } from "@/lib/calendar";
import { DEFAULT_COUNTRY, LATAM_COUNTRIES, formatMoney, isLatamCountry, todayIn } from "@/lib/geo/latam";
import { computePayrollLine } from "@/lib/business/bolivia/payroll";
import { PARAMS_2026 } from "@/lib/business/bolivia/params";
import { nextShabbat, type ZmanimCity } from "@/lib/kosher/zmanim";
import { PLACE_TYPES, STATUS } from "@/lib/kosher/labels";

export const dynamic = "force-dynamic";

/** Próximos feriados con descanso de un país, desde hoy en su zona horaria. */
function upcomingHolidays(code: string, limit: number) {
  const c = LATAM_COUNTRIES.find((x) => x.code === code);
  if (!c) return [];
  const today = todayIn(c.timezone);
  const year = Number(today.slice(0, 4));
  try {
    return [...dayOffEntries(year, c.code), ...dayOffEntries(year + 1, c.code)]
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit)
      .map((e) => ({ date: e.date, title: e.title }));
  } catch (error) {
    console.warn(`Feriados de ${c.code} no disponibles en la portada:`, error);
    return [];
  }
}

/** País por país: el próximo feriado con descanso y cómo se ve un monto. */
function countries(): CountryInfo[] {
  return LATAM_COUNTRIES.map((c) => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
    money: formatMoney(1234.5, c.code),
    holiday: upcomingHolidays(c.code, 1)[0] ?? null,
  }));
}

/** Una boleta real del motor de planillas: Bolivia, octubre de 2026, cuatro años de antigüedad. */
function payslipDemo(): PayslipDemo {
  const r = computePayrollLine(
    {
      baseSalary: 4500,
      hireDate: "2022-06-01",
      productive: false,
      year: 2026,
      month: 10,
      daysWorked: 30,
      overtimeHours: 0,
      sundayHolidayDays: 0,
      otherBonuses: 0,
      advances: 0,
      otherDeductions: 0,
      rcivaCredit: 0,
    },
    PARAMS_2026,
  );
  const bs = (n: number) => formatMoney(n, "BO");
  const pct = (n: number) => `${new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(n * 100)} %`;
  const g = PARAMS_2026.gestora;
  return {
    rows: [
      { label: "Haber básico", value: bs(r.earned.basic) },
      { label: `Bono de antigüedad (${pct(r.seniorityRate)})`, short: `Antigüedad (${pct(r.seniorityRate)})`, value: bs(r.earned.seniority) },
      { label: "Total ganado", value: bs(r.earned.total), strong: true },
      { label: `Aportes a la Gestora (${pct(g.vejez + g.riesgoComun + g.comision + g.solidario)})`, short: `Gestora (${pct(g.vejez + g.riesgoComun + g.comision + g.solidario)})`, value: bs(r.deductions.gestora.total), minus: true },
      { label: "RC-IVA", value: bs(r.deductions.rciva.retained), minus: true },
    ],
    gross: bs(r.earned.total),
    deductions: bs(r.deductions.total),
    net: bs(r.netPay),
    note: `Calculada con las reglas de ${PARAMS_2026.year} (mínimo nacional: ${bs(PARAMS_2026.smn).replace(/,00$/, "")}). El sueldo y la antigüedad son de ejemplo.`,
  };
}

/** Ciudades para el próximo Shabat. La primera es la del hero. */
const SHABBAT_CITIES: (ZmanimCity & { slug: string })[] = [
  { slug: "la-paz", city: "La Paz", countryCode: "BO", lat: -16.4955, lng: -68.1336, timezone: "America/La_Paz" },
  { slug: "santa-cruz", city: "Santa Cruz", countryCode: "BO", lat: -17.7833, lng: -63.1821, timezone: "America/La_Paz" },
  { slug: "buenos-aires", city: "Buenos Aires", countryCode: "AR", lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires" },
  { slug: "sao-paulo", city: "São Paulo", countryCode: "BR", lat: -23.5505, lng: -46.6333, timezone: "America/Sao_Paulo" },
  { slug: "cdmx", city: "Ciudad de México", countryCode: "MX", lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City" },
  { slug: "santiago", city: "Santiago", countryCode: "CL", lat: -33.4489, lng: -70.6693, timezone: "America/Santiago" },
  { slug: "lima", city: "Lima", countryCode: "PE", lat: -12.0464, lng: -77.0428, timezone: "America/Lima" },
  { slug: "bogota", city: "Bogotá", countryCode: "CO", lat: 4.711, lng: -74.0721, timezone: "America/Bogota" },
  { slug: "montevideo", city: "Montevideo", countryCode: "UY", lat: -34.9011, lng: -56.1645, timezone: "America/Montevideo" },
];

function shabbat(): ShabbatCity[] {
  return SHABBAT_CITIES.map((c) => {
    try {
      const s = nextShabbat(c);
      return { slug: c.slug, city: c.city, timezone: c.timezone, candles: s.candles, havdalah: s.havdalah, parasha: s.parasha, chag: s.chag };
    } catch {
      return { slug: c.slug, city: c.city, timezone: c.timezone, candles: null, havdalah: null, parasha: null, chag: null };
    }
  });
}

/** Ciudad del Shabat que se muestra primero según el país de quien visita. */
const SHABBAT_BY_COUNTRY: Record<string, string> = { BO: "la-paz", AR: "buenos-aires", BR: "sao-paulo", MX: "cdmx", CL: "santiago", PE: "lima", CO: "bogota", UY: "montevideo" };

export default async function Home() {
  // País de quien visita por IP, según lo informa el hosting (Vercel o Cloudflare). Solo elige qué país mostrar primero; no se guarda.
  const h = headers();
  const geo = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry");
  const detected = isLatamCountry(geo);
  const country = detected ? geo!.toUpperCase() : DEFAULT_COUNTRY;

  // Pwn consulta estos feeds y además las API de HIBP, NVD y CISA KEV.
  const pwnSources = Array.from(new Set(["Have I Been Pwned", "NVD", "CISA KEV", ...PWN_FEED_SOURCES.map((source) => source.forumLabel)]));

  let kevs: KevItem[] = [];
  let places: PlaceItem[] = [];
  try {
    const [vulns, rows] = await Promise.all([
      prisma.pwnVulnerability.findMany({
        where: { kev: true },
        orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        take: 4,
        select: { cveId: true, cvssScore: true, publishedAt: true },
      }),
      prisma.kosherPlace.findMany({
        where: { published: true },
        orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }],
        take: 12,
        select: { name: true, city: true, type: true, status: true },
      }),
    ]);
    kevs = vulns
      .filter((v) => /^CVE-\d{4}-\d{4,}$/.test(v.cveId))
      .map((v) => ({ cveId: v.cveId, cvss: v.cvssScore, published: v.publishedAt?.toISOString() ?? null, url: `https://nvd.nist.gov/vuln/detail/${v.cveId}` }));
    places = rows
      .sort((a, b) => Number(b.status === "certified") - Number(a.status === "certified"))
      .map((p) => ({ name: p.name, city: p.city, type: PLACE_TYPES[p.type], status: STATUS[p.status], certified: p.status === "certified" }));
  } catch (dbError) {
    // Sin base, la portada igual se muestra: Pwn y Kosher quedan sin sus listas en vivo.
    console.warn("Portada sin datos en vivo de Pwn y Kosher:", dbError);
  }

  const payslip = payslipDemo();
  const firstCity = SHABBAT_BY_COUNTRY[country] ?? "la-paz";
  const cities = shabbat().sort((a, b) => Number(b.slug === firstCity) - Number(a.slug === firstCity));
  const countryInfo = LATAM_COUNTRIES.find((c) => c.code === country) ?? LATAM_COUNTRIES[0];
  const data: LandingData = {
    payslip,
    pwnSources,
    kevs,
    places,
    shabbat: cities,
    countries: countries(),
    country,
    detected,
    today: todayIn(countryInfo.timezone),
    phone: {
      payslip: { rows: payslip.rows, net: payslip.net },
      shabbat: cities[0] ? { city: cities[0].city, timezone: cities[0].timezone, candles: cities[0].candles, havdalah: cities[0].havdalah, parasha: cities[0].parasha } : null,
      holidays: upcomingHolidays(country, 3),
      countryName: countryInfo.name,
      sources: pwnSources,
    },
  };

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <LandingHero data={data} />
      <LandingMarquee />
      <LandingPillars data={data} />
      <LandingSteps />
      <LandingRegion data={data} />
      <LandingMervi />
      <LandingTrust />
      <LandingFAQ />
      <LandingCTA />
    </div>
  );
}
// creado por pato dev y askforvini
