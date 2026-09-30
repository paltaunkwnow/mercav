import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, Flame, MessagesSquare, MoonStar, UsersRound, UtensilsCrossed } from "lucide-react";
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
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--text-primary)]">
          {icon}
          {title}
        </h2>
        <Link href={href} className="inline-flex h-9 items-center gap-1 rounded-full text-sm font-medium text-techelet hover:underline">
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
      <ul className="divide-y divide-border">
        {list.slice(0, 5).map((p) => (
          <li key={p.id}>
            <Link href={`/kosher/lugar/${p.slug}`} className="flex items-center gap-3 py-3 hover:text-gold">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                <PlaceIcon type={p.type} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="block truncate text-xs text-[var(--text-tertiary)]">{p.address}</span>
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
        <div className="rounded-2xl bg-gold/10 p-4 ring-1 ring-inset ring-gold/25">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
            <Flame className="h-3.5 w-3.5" aria-hidden /> Velas
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{shabbat.candles ? formatTime(shabbat.candles, tz) : "—"}</p>
          {shabbat.candles && <p className="text-xs text-[var(--text-secondary)]">{formatDay(shabbat.candles, tz)}</p>}
        </div>
        <div className="rounded-2xl bg-techelet-dim p-4 ring-1 ring-inset ring-techelet/25">
          <p className="flex items-center gap-1.5 text-xs font-medium text-techelet">
            <MoonStar className="h-3.5 w-3.5" aria-hidden /> Havdalá
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{shabbat.havdalah ? formatTime(shabbat.havdalah, tz) : "—"}</p>
          {shabbat.havdalah && (
            <p className="text-xs text-[var(--text-secondary)]">
              {formatDay(shabbat.havdalah, tz)} · {shabbat.parasha ?? shabbat.chag ?? "Shabat"}
            </p>
          )}
        </div>
        <Link href={`/kosher/comunidad/shabat${q}`} className="group rounded-2xl border border-border bg-bg-secondary p-4 hover:border-gold/40">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden /> Mesa de Shabat
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)] group-hover:text-gold">
            {hosts} {hosts === 1 ? "anfitrión" : "anfitriones"}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Pedí lugar para Shabat</p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Dónde comer" href={`/kosher/mapa?q=${encodeURIComponent(city.city)}`} linkLabel="Mapa" icon={<UtensilsCrossed className="h-5 w-5 text-gold" aria-hidden />}>
          {placeList(food)}
        </Block>
        <Block title="Dónde rezar" href={`/kosher/mapa?q=${encodeURIComponent(city.city)}`} linkLabel="Mapa" icon={<UsersRound className="h-5 w-5 text-gold" aria-hidden />}>
          {placeList(prayer)}
          {minyanim.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Minianim abiertos</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {minyanim.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3 text-[var(--text-secondary)]">
                    <span>
                      {PRAYER[m.prayer]} · {formatDateTime(m.startsAt, tz)}
                    </span>
                    <span className="font-mono tabular-nums">{m._count.rsvps}/10</span>
                  </li>
                ))}
              </ul>
              <Link href={`/kosher/comunidad/minian${q}`} className="mt-2 inline-flex text-sm font-medium text-techelet hover:underline">
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
                <li key={e.id} className="rounded-2xl bg-bg-tertiary/60 px-4 py-3">
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
            <div className="mt-4 border-t border-border pt-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <BookOpenCheck className="h-3.5 w-3.5" aria-hidden /> Kashrut en {city.country}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {agencies.map((a) => (
                  <li key={a.slug}>
                    <a
                      href={a.lists?.url ?? a.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-xs font-semibold text-[var(--text-primary)] hover:border-gold/50"
                    >
                      {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href={`/kosher/calendario${q}`} className="mt-4 inline-flex text-sm font-medium text-techelet hover:underline">
            Zmanim de hoy y calendario
          </Link>
        </Block>
      </div>
    </div>
  );
}
