import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, Flame, MessagesSquare, MoonStar, UsersRound, UtensilsCrossed } from "@/components/icons";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { cityThreadKey } from "@/lib/kosher/geo";
import { AGENCIES } from "@/lib/kosher/agencies";
import { EVENT_KIND, FOOD_TYPES, PRAYER } from "@/lib/kosher/labels";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { formatDateTime, formatDay, formatTime } from "@/lib/kosher/time";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { CityPills, EmptyState, PageIntro, cardClass } from "@/components/kosher/ui";
import { NearestCityButton } from "@/components/kosher/CommunityForms";

export const metadata: Metadata = { title: "Modo viaje" };

function Block({ title, href, linkLabel, icon, children }: { title: string; href: string; linkLabel: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="mv-h3 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <Link href={href} className="mv-focus -mr-2 inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-semibold text-techelet hover:underline">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function KosherTravelPage({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  if (!city) return <EmptyState>Todavía no hay comunidades cargadas.</EmptyState>;

  const tz = city.timezone;
  const now = new Date();
  const where = { city: city.city, countryCode: city.countryCode };
  const shabbat = nextShabbat(city);
  const [places, events, minyanim, hosts] = await Promise.all([
    prisma.kosherPlace.findMany({ where: { ...where, published: true }, orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }] }),
    prisma.kosherEvent.findMany({ where: { ...where, state: "approved", startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 4 }),
    prisma.kosherMinyan.findMany({
      where: { ...where, startsAt: { gte: new Date(now.getTime() - 30 * 60_000) } },
      orderBy: { startsAt: "asc" },
      take: 3,
      include: { _count: { select: { rsvps: true } }, place: { select: { name: true } } },
    }),
    prisma.kosherHost.count({ where: { ...where, state: "approved", active: true } }),
  ]);
  const food = places.filter((p) => FOOD_TYPES.includes(p.type));
  const prayer = places.filter((p) => p.type === "synagogue" || p.type === "mikvah" || p.type === "community");
  const agencies = AGENCIES.filter((a) => a.countryCode === city.countryCode);
  const q = `?ciudad=${city.slug}`;

  const placeList = (list: typeof places) =>
    list.length === 0 ? (
      <p className="text-sm text-[var(--text-secondary)]">Todavía no hay lugares verificados de este tipo en {city.city}.</p>
    ) : (
      <ul className="divide-y divide-[var(--mv-hairline)]">
        {list.slice(0, 5).map((p) => (
          <li key={p.id}>
            <Link href={`/kosher/lugar/${p.slug}`} className="mv-focus group -mx-2 flex min-h-14 items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--mv-panel-hover)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
                <PlaceIcon type={p.type} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{p.address}</span>
              </span>
              <StatusBadge status={p.status} type={p.type} verified={!!p.verifiedAt} />
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <div>
      <PageIntro eyebrow="Modo viaje" title={`De viaje en ${city.city}`} actions={<NearestCityButton cities={cities} basePath="/kosher/viaje" />}>
        <p>Todo lo que necesitás al llegar a una ciudad: dónde comer y rezar, el horario de Shabat, la agenda y la conversación de la comunidad local.</p>
      </PageIntro>
      <CityPills cities={cities} current={city.slug} basePath="/kosher/viaje" />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] bg-[var(--mv-gold-wash)] p-5 ring-1 ring-inset ring-gold/25">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
            <Flame className="h-3.5 w-3.5" aria-hidden /> Velas
          </p>
          <p className="mv-data mt-1 text-2xl text-[var(--text-primary)]">{shabbat.candles ? formatTime(shabbat.candles, tz) : "—"}</p>
          {shabbat.candles && <p className="text-xs text-[var(--text-secondary)]">{formatDay(shabbat.candles, tz)}</p>}
        </div>
        <div className="rounded-[1.5rem] bg-techelet-dim p-5 ring-1 ring-inset ring-techelet/25">
          <p className="flex items-center gap-1.5 text-xs font-medium text-techelet">
            <MoonStar className="h-3.5 w-3.5" aria-hidden /> Havdalá
          </p>
          <p className="mv-data mt-1 text-2xl text-[var(--text-primary)]">{shabbat.havdalah ? formatTime(shabbat.havdalah, tz) : "—"}</p>
          {shabbat.havdalah && (
            <p className="text-xs text-[var(--text-secondary)]">
              {formatDay(shabbat.havdalah, tz)} · {shabbat.parasha ?? shabbat.chag ?? "Shabat"}
            </p>
          )}
        </div>
        <Link href={`/kosher/comunidad/shabat${q}`} className="mv-panel mv-panel-interactive mv-focus group rounded-[1.5rem] p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden /> Mesa de Shabat
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
            {hosts} {hosts === 1 ? "anfitrión" : "anfitriones"}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Pedí lugar para Shabat</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Dónde comer" href={`/kosher/mapa?q=${encodeURIComponent(city.city)}`} linkLabel="Mapa" icon={<UtensilsCrossed className="h-5 w-5 text-gold" aria-hidden />}>
          {placeList(food)}
        </Block>
        <Block title="Dónde rezar" href={`/kosher/mapa?q=${encodeURIComponent(city.city)}`} linkLabel="Mapa" icon={<UsersRound className="h-5 w-5 text-gold" aria-hidden />}>
          {placeList(prayer)}
          {minyanim.length > 0 && (
            <div className="mt-4 border-t border-[var(--mv-hairline)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Minianim abiertos</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {minyanim.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3 text-[var(--text-secondary)]">
                    <span>
                      {PRAYER[m.prayer]} · {formatDateTime(m.startsAt, tz)}
                    </span>
                    <span className="mv-data">{m._count.rsvps}/10</span>
                  </li>
                ))}
              </ul>
              <Link href={`/kosher/comunidad/minian${q}`} className="mv-focus mt-2 inline-flex min-h-10 items-center rounded text-sm font-semibold text-techelet hover:underline">
                Confirmar o pedir minián
              </Link>
            </div>
          )}
        </Block>
        <Block title="Agenda" href={`/kosher/comunidad/agenda${q}`} linkLabel="Ver agenda" icon={<CalendarDays className="h-5 w-5 text-gold" aria-hidden />}>
          {events.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No hay eventos publicados para los próximos días.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{e.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {EVENT_KIND[e.kind]} · {formatDateTime(e.startsAt, tz)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block
          title="Comunidad local"
          href={`/kosher/chat?sala=${encodeURIComponent(cityThreadKey(city.city, city.countryCode))}`}
          linkLabel="Entrar a la sala"
          icon={<MessagesSquare className="h-5 w-5 text-gold" aria-hidden />}
        >
          <p className="text-sm text-[var(--text-secondary)]">
            Preguntá en la sala de {city.city}: horarios, dónde conseguir algo, recomendaciones. Responden miembros de la comunidad con cuenta Mercav.
          </p>
          {agencies.length > 0 && (
            <div className="mt-4 border-t border-[var(--mv-hairline)] pt-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                <BookOpenCheck className="h-4 w-4 text-techelet" aria-hidden /> Kashrut en {city.country}
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {agencies.map((a) => (
                  <li key={a.slug}>
                    <a
                      href={a.lists?.url ?? a.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mv-focus inline-flex h-10 items-center rounded-full border border-[var(--mv-hairline-strong)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--color-border-gold)]"
                    >
                      {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href={`/kosher/calendario${q}`} className="mv-focus mt-4 inline-flex min-h-10 items-center rounded text-sm font-semibold text-techelet hover:underline">
            Zmanim de hoy y calendario
          </Link>
        </Block>
      </div>
    </div>
  );
}
