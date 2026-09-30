import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, publicAuthorName } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { MINYAN_SIZE, PRAYER } from "@/lib/kosher/labels";
import { formatDay, formatTime } from "@/lib/kosher/time";
import { BackLink, CityPills, EmptyState, PageIntro, Pill, SignInCard, cardClass } from "@/components/kosher/ui";
import { MinyanForm, RsvpButton } from "@/components/kosher/CommunityForms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Minián" };

export default async function KosherMinyanPage({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  if (!city) return <EmptyState>Todavía no hay comunidades cargadas.</EmptyState>;

  const [minyanim, places] = await Promise.all([
    prisma.kosherMinyan.findMany({
      where: { city: city.city, countryCode: city.countryCode, startsAt: { gte: new Date(Date.now() - 30 * 60_000) } },
      orderBy: { startsAt: "asc" },
      take: 40,
      include: {
        place: { select: { slug: true, name: true } },
        createdBy: { select: { name: true } },
        rsvps: { select: { userId: true } },
      },
    }),
    prisma.kosherPlace.findMany({
      where: { published: true, type: { in: ["synagogue", "community", "school"] } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true, city: true },
    }),
  ]);

  return (
    <div>
      <BackLink />
      <PageIntro eyebrow="Minián" title={`Minianim en ${city.city}`}>
        <p>Pedí minián para una tefilá o para decir kadish, y confirmá tu lugar en los que ya están abiertos. Cuando llegan a diez, avisamos a todos.</p>
      </PageIntro>
      <CityPills cities={cities} current={city.slug} basePath="/kosher/comunidad/minian" />

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section aria-label="Minianim abiertos">
          {minyanim.length === 0 ? (
            <EmptyState>No hay minianim abiertos en {city.city}. Los horarios fijos de cada sinagoga están en su ficha del mapa.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {minyanim.map((m) => {
                const count = m.rsvps.length;
                const going = !!viewer && m.rsvps.some((r) => r.userId === viewer.id);
                const full = count >= MINYAN_SIZE;
                return (
                  <li key={m.id} className={cardClass}>
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="gold">{PRAYER[m.prayer]}</Pill>
                          {full && <Pill tone="techelet">¡Hay minián!</Pill>}
                        </div>
                        <p className="mt-3 font-display text-xl font-semibold text-[var(--text-primary)]">
                          {formatDay(m.startsAt, city.timezone, { weekday: "long", month: "short" })} · {formatTime(m.startsAt, city.timezone)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {m.place ? (
                            <Link href={`/kosher/lugar/${m.place.slug}`} className="font-medium text-techelet hover:underline">
                              {m.place.name}
                            </Link>
                          ) : (
                            m.locationNote
                          )}
                          {m.place && m.locationNote && <span>· {m.locationNote}</span>}
                        </p>
                        {m.note && <p className="mt-2 text-sm italic text-[var(--text-secondary)]">“{m.note}”</p>}
                        <p className="mt-2 text-xs text-[var(--text-tertiary)]">Lo pidió {publicAuthorName(m.createdBy.name)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch gap-3 md:w-44">
                        <div>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">Confirmados</span>
                            <span className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                              {count}/{MINYAN_SIZE}
                            </span>
                          </div>
                          <div
                            className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-tertiary"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={MINYAN_SIZE}
                            aria-valuenow={Math.min(count, MINYAN_SIZE)}
                            aria-label="Personas confirmadas"
                          >
                            <div className={cn("h-full rounded-full", full ? "bg-techelet" : "bg-gold")} style={{ width: `${Math.min(100, (count / MINYAN_SIZE) * 100)}%` }} />
                          </div>
                        </div>
                        <RsvpButton id={m.id} going={going} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          {viewer ? (
            <div className={cardClass}>
              <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Pedir minián</h2>
              <p className="mb-5 mt-1 text-sm text-[var(--text-secondary)]">
                Se publica al instante y avisa a quienes activaron alertas de minián en la ciudad. Preferí sinagogas o lugares públicos.
              </p>
              <MinyanForm cities={cities} places={places} city={city.slug} />
            </div>
          ) : (
            <SignInCard callbackUrl={`/kosher/comunidad/minian?ciudad=${city.slug}`}>Entrá con tu cuenta Mercav para pedir o confirmar un minián.</SignInCard>
          )}
        </aside>
      </div>
    </div>
  );
}
