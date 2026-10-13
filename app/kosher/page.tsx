import Link from "next/link";
import { cookies, headers } from "next/headers";
import { ArrowRight, CalendarDays, Flame, MessagesSquare, MoonStar, Plane, Users } from "@/components/icons";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { KosherAtlas } from "@/components/kosher/KosherAtlas";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { KashrutOnboarding } from "@/components/kosher/KashrutPreference";
import { LocationSuggestion } from "@/components/kosher/city/LocationSuggestion";
import { getKosherViewer } from "@/lib/kosher/server";
import { cityKey, listCities, nearestCity, pickCity, placeCountsByCity, type KosherCity } from "@/lib/kosher/cities";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { formatTime } from "@/lib/kosher/time";
import { LATAM_COUNTRIES } from "@/lib/geo/latam";
import { PLACE_TYPES } from "@/lib/kosher/labels";

const GEO_HIDE_COOKIE = "k_geo_hide";

/**
 * La ciudad con guía más cercana a la ubicación aproximada de la conexión (encabezados de IP de Vercel), a menos de 100 km.
 * No pide permiso ni guarda nada. Sin encabezados (en local), ninguna.
 */
function cityFromConnection(cities: KosherCity[]) {
  const h = headers();
  const lat = Number.parseFloat(h.get("x-vercel-ip-latitude") ?? "");
  const lng = Number.parseFloat(h.get("x-vercel-ip-longitude") ?? "");
  if (Number.isFinite(lat) && Number.isFinite(lng)) return nearestCity(cities, { lat, lng }, 100)?.city ?? null;
  const raw = h.get("x-vercel-ip-city");
  const country = h.get("x-vercel-ip-country");
  if (!raw || !country) return null;
  let name = raw;
  try {
    name = decodeURIComponent(raw);
  } catch {
    // Ya venía sin codificar.
  }
  const key = cityKey(name, country);
  return cities.find((c) => cityKey(c.city, c.countryCode) === key) ?? null;
}

const HOME_PLACE = { slug: true, name: true, city: true, countryCode: true, type: true, status: true, verifiedAt: true } satisfies Prisma.KosherPlaceSelect;
type HomePlace = Prisma.KosherPlaceGetPayload<{ select: typeof HOME_PLACE }>;

/** Los números y la lista del atlas. Sin base, la portada se muestra igual, sin datos en vivo (como la portada de Mercav). */
async function loadLiveData() {
  try {
    const [placeCount, communityCount, cityRows, messageCount, places] = await Promise.all([
      prisma.kosherPlace.count({ where: { published: true } }),
      prisma.kosherCommunity.count(),
      prisma.kosherPlace.findMany({ where: { published: true }, distinct: ["city", "countryCode"], select: { city: true } }),
      prisma.kosherMessage.count({ where: { hidden: false } }),
      prisma.kosherPlace.findMany({
        where: { published: true, countryCode: { in: LATAM_COUNTRIES.map((c) => c.code) } },
        orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        select: HOME_PLACE,
        take: 120,
      }),
    ]);
    return { placeCount, communityCount, cityRows, messageCount, places };
  } catch (dbError) {
    console.warn("Inicio de Mercav Kosher sin datos en vivo:", dbError);
    return { placeCount: 0, communityCount: 0, cityRows: [] as { city: string }[], messageCount: 0, places: [] as HomePlace[] };
  }
}

/** El inicio de Mercav Kosher: el atlas como en el celular de la portada y, debajo, la vida de la comunidad. */
export default async function KosherHome() {
  const { placeCount, communityCount, cityRows, messageCount, places } = await loadLiveData();
  // Si la base no responde, la portada igual se muestra: sin ciudad elegida ni números en vivo.
  const [viewer, cities, counts] = await Promise.all([
    getKosherViewer().catch(() => null),
    listCities().catch(() => []),
    placeCountsByCity().catch(() => new Map<string, number>()),
  ]);
  const city = pickCity(cities, undefined, viewer);
  const shabbat = city ? nextShabbat(city) : null;

  // Solo ciudades con lugares publicados tienen guía.
  const guideCities = new Map(cities.filter((c) => counts.get(cityKey(c.city, c.countryCode))).map((c) => [cityKey(c.city, c.countryCode), c]));
  const here = cityFromConnection([...guideCities.values()]);
  const suggestion = here && here.slug !== city?.slug && cookies().get(GEO_HIDE_COOKIE)?.value !== here.slug ? here : null;
  const cityGuides: Record<string, string> = {};
  for (const p of places) {
    const guide = guideCities.get(cityKey(p.city, p.countryCode));
    if (guide) cityGuides[p.city] = guide.slug;
  }

  const stats = [
    { value: placeCount, label: "lugares" },
    { value: cityRows.length, label: "ciudades" },
    { value: communityCount, label: "kehilot" },
    { value: messageCount, label: "mensajes" },
  ].filter((s) => s.value > 0);

  const tiles = [
    { href: "/kosher/comunidad", icon: Users, title: "Comunidad", sub: "Agenda, minián y jésed" },
    { href: "/kosher/viaje", icon: Plane, title: "Modo viaje", sub: "Comer y rezar al llegar" },
    { href: "/kosher/chat", icon: MessagesSquare, title: "Chat", sub: "Una sala por ciudad" },
  ];

  return (
    <div className="mv-container mt-8 md:mt-10">
      {suggestion && <LocationSuggestion slug={suggestion.slug} city={suggestion.city} cookie={GEO_HIDE_COOKIE} />}
      <KashrutOnboarding server={viewer?.profile?.kashrutPreference ?? null} />
      <KosherAtlas
        cityGuides={cityGuides}
        places={places.map((p) => ({
          slug: p.slug,
          name: p.name,
          city: p.city,
          type: p.type,
          typeLabel: PLACE_TYPES[p.type],
          status: p.status,
          verified: !!p.verifiedAt,
        }))}
      />

      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="La comunidad">
        <li className="col-span-2 md:col-span-1">
          <Link
            href={`/kosher/calendario${city ? `?ciudad=${city.slug}` : ""}`}
            className="mv-panel mv-panel-interactive mv-focus flex h-full flex-col p-4 sm:p-5"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--k-accent)_14%,transparent)] text-[var(--k-accent)]">
              <CalendarDays className="h-[22px] w-[22px]" aria-hidden />
            </span>
            <span className="mt-4 block text-[1.05rem] font-semibold leading-tight">{city ? `Shabat en ${city.city}` : "Shabat y zmanim"}</span>
            {city && shabbat?.candles ? (
              <span className="mt-1.5 flex items-center gap-4 text-[0.9rem] text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-gold" aria-hidden />
                  <span className="tabular-nums text-[var(--text-primary)]">{formatTime(shabbat.candles, city.timezone)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MoonStar className="h-4 w-4 text-[var(--k-accent)]" aria-hidden />
                  <span className="tabular-nums text-[var(--text-primary)]">{shabbat.havdalah ? formatTime(shabbat.havdalah, city.timezone) : "—"}</span>
                </span>
              </span>
            ) : (
              <span className="mt-0.5 block text-[0.9rem] text-[var(--text-secondary)]">Velas, Havdalá y jaguim</span>
            )}
          </Link>
        </li>
        {tiles.map(({ href, icon: Icon, title, sub }) => (
          <li key={href} className="last:col-span-2 md:last:col-span-1">
            <Link href={href} className="mv-panel mv-panel-interactive mv-focus flex h-full flex-col p-4 sm:p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--k-accent)_14%,transparent)] text-[var(--k-accent)]">
                <Icon className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <span className="mt-4 block text-[1.05rem] font-semibold leading-tight">{title}</span>
              <span className="mt-0.5 block truncate text-[0.9rem] text-[var(--text-secondary)]">{sub}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="k-estado" className="mv-panel flex flex-col gap-4 p-5 sm:p-6">
          <h2 id="k-estado" className="mv-kicker !text-[var(--k-accent)]">
            Cómo leer un estado
          </h2>
          <ul className="flex flex-wrap gap-2" aria-label="Ejemplos de estado">
            <li><StatusBadge status="certified" type="restaurant" /></li>
            <li><StatusBadge status="supervised" type="restaurant" /></li>
            <li><StatusBadge status="community_report" type="restaurant" /></li>
            <li><StatusBadge status="unknown" type="restaurant" /></li>
          </ul>
          <p className="text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
            Certificado significa que figura una agencia, con fecha. Con supervisión, que se informa un supervisor pero no hay certificado en la ficha. Un
            reporte comunitario es la nota de un miembro. Mercav Kosher no emite hechsher ni psak: muestra quién certifica y desde cuándo.
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-2 text-[0.9rem] font-semibold">
            <Link href="/kosher/kashrut" className="mv-focus inline-flex items-center gap-1.5 rounded-md text-[var(--k-accent)]">
              Todos los niveles de kashrut <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/kosher/comunidad/agencias" className="mv-focus inline-flex items-center gap-1.5 rounded-md text-[var(--k-accent)]">
              Agencias de kashrut <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/kosher/terminos" className="mv-focus inline-flex items-center gap-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Términos de Mercav Kosher
            </Link>
          </p>
        </section>

        {stats.length ? (
          <section aria-labelledby="k-hoy" className="mv-panel flex flex-col gap-4 p-5 sm:p-6">
            <h2 id="k-hoy" className="mv-kicker !text-[var(--k-accent)]">
              El atlas hoy
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="text-[0.85rem] text-[var(--text-secondary)]">{s.label}</dt>
                  <dd className="text-[1.75rem] font-bold tabular-nums leading-tight tracking-[-0.02em]">{s.value.toLocaleString("es")}</dd>
                </div>
              ))}
            </dl>
            <p lang="he" dir="rtl" className="mt-auto text-[1.05rem] text-[var(--k-accent)]">
              כָּל יִשְׂרָאֵל עֲרֵבִים זֶה בָּזֶה
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
