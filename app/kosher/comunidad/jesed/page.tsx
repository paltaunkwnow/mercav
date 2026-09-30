import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, publicAuthorName } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { CHESED_KIND } from "@/lib/kosher/labels";
import { BackLink, CityPills, EmptyState, PageIntro, Pill, SignInCard, cardClass } from "@/components/kosher/ui";
import { ChesedForm, RowAction } from "@/components/kosher/CommunityForms";

export const metadata: Metadata = { title: "Jésed" };

const TONE = { volunteer: "techelet", bikur_cholim: "gold", donation: "muted", need: "warn" } as const;

export default async function KosherChesedPage({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  if (!city) return <EmptyState>Todavía no hay comunidades cargadas.</EmptyState>;

  const now = new Date();
  const [posts, mine] = await Promise.all([
    prisma.kosherChesed.findMany({
      where: { city: city.city, countryCode: city.countryCode, state: "approved", closed: false, expiresAt: { gte: now } },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    viewer
      ? prisma.kosherChesed.findMany({ where: { createdById: viewer.id, state: "pending" }, select: { id: true, title: true } })
      : [],
  ]);

  return (
    <div>
      <BackLink />
      <PageIntro eyebrow="Jésed" title={`Tablón de jésed · ${city.city}`}>
        <p>
          Voluntariado, bikur jolim, donaciones y necesidades concretas de la comunidad. Cada pedido lo revisa un moderador y se retira solo al
          vencer.
        </p>
      </PageIntro>
      <CityPills cities={cities} current={city.slug} basePath="/kosher/comunidad/jesed" />

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section aria-label="Pedidos activos">
          {posts.length === 0 ? (
            <EmptyState>No hay pedidos activos en {city.city}. Si sabés de alguien que necesita una mano, sumalo al tablón.</EmptyState>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {posts.map((p) => {
                const days = Math.max(0, Math.ceil((p.expiresAt.getTime() - now.getTime()) / 86_400_000));
                return (
                  <li key={p.id} className={`${cardClass} flex flex-col`}>
                    <div className="flex items-center justify-between gap-2">
                      <Pill tone={TONE[p.kind]}>{CHESED_KIND[p.kind]}</Pill>
                      <span className="text-[11px] text-[var(--text-tertiary)]">{days === 1 ? "vence mañana" : `${days} días más`}</span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">{p.title}</h2>
                    <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{p.body}</p>
                    {p.contact && <p className="mt-3 rounded-xl bg-bg-tertiary/70 px-3 py-2 text-sm text-[var(--text-primary)]">{p.contact}</p>}
                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--text-tertiary)]">
                      <span>Publicado por {publicAuthorName(p.createdBy.name)}</span>
                      {viewer && (viewer.id === p.createdById || viewer.isModerator) && (
                        <RowAction url={`/api/kosher/chesed/${p.id}`} label="Ya se resolvió" done="Marcado como resuelto." />
                      )}
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
              <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Publicar un pedido</h2>
              <p className="mb-5 mt-1 text-sm text-[var(--text-secondary)]">
                Pedí permiso antes de publicar por otra persona, y dejá que la institución o la familia coordine los detalles privados.
              </p>
              <ChesedForm cities={cities} city={city.slug} />
              {mine.length > 0 && (
                <p className="mt-5 border-t border-border pt-4 text-xs text-[var(--text-tertiary)]">En revisión: {mine.map((m) => m.title).join(" · ")}</p>
              )}
            </div>
          ) : (
            <SignInCard callbackUrl={`/kosher/comunidad/jesed?ciudad=${city.slug}`}>Entrá con tu cuenta Mercav para publicar un pedido de jésed.</SignInCard>
          )}
        </aside>
      </div>
    </div>
  );
}
