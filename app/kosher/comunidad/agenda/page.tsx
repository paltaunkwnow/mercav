import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, publicAuthorName } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { EVENT_KIND } from "@/lib/kosher/labels";
import { dayKey, formatDay, formatTime } from "@/lib/kosher/time";
import { BackLink, CityPills, EmptyState, PageIntro, Pill, SignInCard, cardClass } from "@/components/kosher/ui";
import { EventForm, RowAction } from "@/components/kosher/CommunityForms";

export const metadata: Metadata = { title: "Agenda comunitaria" };

export default async function KosherAgendaPage({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  if (!city) return <EmptyState>Todavía no hay comunidades cargadas.</EmptyState>;

  const [events, places, mine] = await Promise.all([
    prisma.kosherEvent.findMany({
      where: { city: city.city, countryCode: city.countryCode, state: "approved", startsAt: { gte: new Date(Date.now() - 3_600_000) } },
      orderBy: { startsAt: "asc" },
      take: 60,
      include: { place: { select: { slug: true, name: true } }, createdBy: { select: { name: true } } },
    }),
    prisma.kosherPlace.findMany({ where: { published: true }, orderBy: { name: "asc" }, select: { slug: true, name: true, city: true } }),
    viewer
      ? prisma.kosherEvent.findMany({ where: { createdById: viewer.id, state: "pending" }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } })
      : [],
  ]);

  const days = new Map<string, typeof events>();
  for (const e of events) {
    const key = dayKey(e.startsAt, city.timezone);
    days.set(key, [...(days.get(key) ?? []), e]);
  }

  return (
    <div>
      <BackLink />
      <PageIntro eyebrow="Agenda" title={`Qué pasa en ${city.city}`}>
        <p>Shiurim, tefilot especiales, jaguim y actividades de la comunidad. Lo que publica una institución que administra su ficha aparece como oficial.</p>
      </PageIntro>
      <CityPills cities={cities} current={city.slug} basePath="/kosher/comunidad/agenda" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-label="Eventos">
          {events.length === 0 ? (
            <EmptyState>No hay eventos cargados en {city.city} por ahora. ¿Organizás algo? Sumalo a la agenda.</EmptyState>
          ) : (
            <ol className="space-y-8">
              {[...days.entries()].map(([day, list]) => (
                <li key={day}>
                  <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">{formatDay(list[0].startsAt, city.timezone)}</h2>
                  <ul className="space-y-3">
                    {list.map((e) => (
                      <li key={e.id} className={cardClass}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mv-data text-sm font-medium text-gold">
                            {formatTime(e.startsAt, city.timezone)}
                            {e.endsAt && `–${formatTime(e.endsAt, city.timezone)}`}
                          </span>
                          <Pill>{EVENT_KIND[e.kind]}</Pill>
                          {e.official && (
                            <Pill tone="techelet">
                              <BadgeCheck className="mr-1 h-3 w-3" aria-hidden /> Oficial
                            </Pill>
                          )}
                        </div>
                        <h3 className="mv-h3 mt-3">{e.title}</h3>
                        {e.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{e.body}</p>}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1.5">
                            {e.place ? (
                              <Link href={`/kosher/lugar/${e.place.slug}`} className="mv-focus inline-flex min-h-10 items-center gap-1 rounded font-semibold text-techelet hover:underline">
                                <MapPin className="h-3.5 w-3.5" aria-hidden /> {e.place.name}
                              </Link>
                            ) : (
                              city.city
                            )}
                            {!e.official && <> · por {publicAuthorName(e.createdBy.name)}</>}
                          </span>
                          {viewer && (viewer.id === e.createdById || viewer.isModerator) && (
                            <RowAction url={`/api/kosher/events/${e.id}`} method="DELETE" label="Quitar" done="Evento quitado." />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          {viewer ? (
            <div className={cardClass}>
              <h2 className="mv-h3">Sumar a la agenda</h2>
              <p className="mb-6 mt-2 text-sm text-[var(--text-secondary)]">Lo revisa un moderador antes de publicarlo, salvo que lo publique la institución.</p>
              <EventForm cities={cities} places={places} city={city.slug} />
              {mine.length > 0 && (
                <p className="mt-5 border-t border-[var(--mv-hairline)] pt-4 text-xs text-[var(--text-secondary)]">
                  En revisión: {mine.map((m) => m.title).join(" · ")}
                </p>
              )}
            </div>
          ) : (
            <SignInCard callbackUrl={`/kosher/comunidad/agenda?ciudad=${city.slug}`}>Entrá con tu cuenta Mercav para sumar un evento a la agenda.</SignInCard>
          )}
        </aside>
      </div>
    </div>
  );
}
