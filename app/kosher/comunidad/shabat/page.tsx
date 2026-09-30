import type { Metadata } from "next";
import { ShieldCheck, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, publicAuthorName } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { MEALS } from "@/lib/kosher/labels";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { formatDay, formatTime } from "@/lib/kosher/time";
import { BackLink, CityPills, EmptyState, PageIntro, Pill, SignInCard, cardClass } from "@/components/kosher/ui";
import { HostForm, HostRequestActions, HostRequestToggle } from "@/components/kosher/CommunityForms";

export const metadata: Metadata = { title: "Mesa de Shabat" };

const REQUEST_STATUS = { pending: ["Esperando respuesta", "muted"], accepted: ["Aceptado", "techelet"], declined: ["Sin lugar esta vez", "warn"] } as const;

const mealList = (meals: string[]) => meals.map((m) => MEALS[m as keyof typeof MEALS] ?? m).join(" · ");
const shortDate = (d: Date) => formatDay(d, "UTC", { weekday: "short", month: "short" });

export default async function KosherShabbatPage({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  if (!city) return <EmptyState>Todavía no hay comunidades cargadas.</EmptyState>;

  const shabbat = nextShabbat(city);
  const [hosts, myHost, myRequests] = await Promise.all([
    prisma.kosherHost.findMany({
      where: { city: city.city, countryCode: city.countryCode, state: "approved", active: true, userId: viewer ? { not: viewer.id } : undefined },
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    viewer
      ? prisma.kosherHost.findUnique({
          where: { userId: viewer.id },
          include: {
            requests: {
              where: { date: { gte: new Date(Date.now() - 2 * 86_400_000) } },
              orderBy: { date: "asc" },
              include: { guest: { select: { name: true } } },
            },
          },
        })
      : null,
    viewer
      ? prisma.kosherHostRequest.findMany({
          where: { guestId: viewer.id, date: { gte: new Date(Date.now() - 2 * 86_400_000) } },
          orderBy: { date: "asc" },
          include: { host: { select: { city: true, user: { select: { name: true } } } } },
        })
      : [],
  ]);
  const myCity = myHost ? cities.find((c) => c.city === myHost.city && c.countryCode === myHost.countryCode) : null;

  return (
    <div>
      <BackLink />
      <PageIntro eyebrow="Hajnasat orjim" title={`Mesa de Shabat en ${city.city}`}>
        <p>
          Familias de la comunidad que reciben a quien está de paso. Cada anfitrión lo aprueba un moderador de la kehilá, y la dirección se comparte
          recién cuando acepta tu pedido, por mensaje privado.
        </p>
        {shabbat.candles && (
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            Este Shabat{shabbat.parasha ? ` (${shabbat.parasha})` : ""}: velas {formatTime(shabbat.candles, city.timezone)}, {formatDay(shabbat.candles, city.timezone)}.
          </p>
        )}
      </PageIntro>
      <CityPills cities={cities} current={city.slug} basePath="/kosher/comunidad/shabat" />

      <div className="grid gap-8 lg:grid-cols-[1fr_26rem]">
        <section aria-label="Anfitriones">
          {hosts.length === 0 ? (
            <EmptyState>
              Todavía no hay mesas aprobadas en {city.city}. Mientras tanto, escribí en la sala de la ciudad o consultá con la sinagoga más cercana.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {hosts.map((h) => {
                const name = publicAuthorName(h.user.name);
                return (
                  <li key={h.id} className={cardClass}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Mesa de {name}</h2>
                      <Pill tone="techelet">
                        <ShieldCheck className="mr-1 h-3 w-3" aria-hidden /> Aprobado por la kehilá
                      </Pill>
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1">
                        <UsersRound className="h-3.5 w-3.5" aria-hidden /> Hasta {h.capacity}
                      </span>
                      <span>{mealList(h.meals)}</span>
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text-primary)]">{h.about}</p>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">Kashrut: {h.kashrut}</p>
                    <div className="mt-5">
                      <HostRequestToggle hostId={h.id} name={name} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {myRequests.length > 0 && (
            <section id="mis-pedidos" aria-labelledby="k-mine" className="mt-10 scroll-mt-28">
              <h2 id="k-mine" className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                Mis pedidos
              </h2>
              <ul className="mt-4 divide-y divide-border rounded-[1.75rem] border border-border bg-bg-secondary">
                {myRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                    <span className="text-[var(--text-primary)]">
                      {publicAuthorName(r.host.user.name)} · {r.host.city} · {shortDate(r.date)}
                    </span>
                    <Pill tone={REQUEST_STATUS[r.status][1]}>{REQUEST_STATUS[r.status][0]}</Pill>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          {viewer ? (
            <>
              {myHost && (
                <div id="pedidos" className={`${cardClass} scroll-mt-28`}>
                  <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Pedidos para tu mesa</h2>
                  {myHost.state !== "approved" && (
                    <p className="mt-2">
                      <Pill tone={myHost.state === "pending" ? "muted" : "warn"}>{myHost.state === "pending" ? "En revisión por la kehilá" : "No aprobada"}</Pill>
                    </p>
                  )}
                  {myHost.requests.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Todavía no recibiste pedidos.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {myHost.requests.map((r) => (
                        <li key={r.id} className="rounded-2xl border border-border p-4">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {publicAuthorName(r.guest.name)} · {r.guests} {r.guests === 1 ? "persona" : "personas"}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">{shortDate(r.date)}</p>
                          <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.message}</p>
                          <div className="mt-3">
                            {r.status === "pending" ? <HostRequestActions id={r.id} /> : <Pill tone={REQUEST_STATUS[r.status][1]}>{REQUEST_STATUS[r.status][0]}</Pill>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className={cardClass}>
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{myHost ? "Tu mesa" : "Ofrecé tu mesa"}</h2>
                <p className="mb-5 mt-1 text-sm text-[var(--text-secondary)]">
                  Un moderador de la kehilá la revisa antes de mostrarla. Si cambiás la descripción, vuelve a revisión.
                </p>
                <HostForm
                  cities={cities}
                  existing={!!myHost}
                  initial={
                    myHost
                      ? {
                          citySlug: myCity?.slug ?? "",
                          capacity: String(myHost.capacity),
                          meals: myHost.meals,
                          kashrut: myHost.kashrut,
                          about: myHost.about,
                          active: myHost.active ? "yes" : "no",
                        }
                      : { citySlug: city.slug, meals: ["friday_dinner"], capacity: "2", active: "yes" }
                  }
                />
              </div>
            </>
          ) : (
            <SignInCard callbackUrl={`/kosher/comunidad/shabat?ciudad=${city.slug}`}>Entrá con tu cuenta Mercav para pedir lugar en una mesa o para ofrecer la tuya.</SignInCard>
          )}
        </aside>
      </div>
    </div>
  );
}
