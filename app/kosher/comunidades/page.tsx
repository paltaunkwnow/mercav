import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPinned, MessagesSquare } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { cityThreadKey } from "@/lib/kosher/geo";
import { cityKey, placeCountsByCity } from "@/lib/kosher/cities";
import { BackLink, PageIntro, primaryButton, secondaryButton } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Comunidades" };

const LANG: Record<string, string> = { es: "Español", he: "Hebreo", yi: "Ídish", en: "Inglés", pt: "Portugués", fr: "Francés", de: "Alemán", ru: "Ruso", ar: "Árabe" };

export default async function KosherCommunitiesPage() {
  const [communities, counts] = await Promise.all([
    prisma.kosherCommunity.findMany({ orderBy: [{ countryCode: "asc" }, { name: "asc" }] }),
    placeCountsByCity(),
  ]);
  const latamFirst = [...communities].sort((a, b) => Number(!["BO", "AR", "BR"].includes(a.countryCode)) - Number(!["BO", "AR", "BR"].includes(b.countryCode)));

  return (
    <div>
      <BackLink />
      <PageIntro title="Kehilot">
        <p>
          {communities.length === 1 ? "La ciudad" : `Las ${communities.length} ciudades`} con comunidad en Mercav Kosher, cada una con su guía. Cuando
          mostramos una población, es una estimación publicada con su fuente y año, no un censo.
        </p>
      </PageIntro>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {latamFirst.map((c) => {
          const count = counts.get(cityKey(c.city, c.countryCode)) ?? 0;
          const guide = `/kosher/ciudad/${c.slug}`;
          return (
            <li key={c.id} id={c.slug} className="scroll-mt-28">
                <article className="mv-panel flex h-full flex-col p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">{c.country}</p>
                      <h2 className="mv-h3 mt-1">
                        <Link href={guide} className="mv-focus inline-flex items-center gap-1.5 rounded-md hover:text-[var(--k-accent)]">
                          {c.name} <ArrowRight className="h-4 w-4 text-[var(--k-accent)]" aria-hidden />
                        </Link>
                      </h2>
                    </div>
                    {c.population != null && (
                      <div className="text-right">
                        <p className="font-display text-2xl font-semibold tabular-nums text-[var(--text-primary)]">≈ {c.population.toLocaleString("es")}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {c.populationSource}
                          {c.populationYear ? `, ${c.populationYear}` : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  {c.denominationNotes && <p className="mt-4 text-sm text-[var(--text-secondary)]">{c.denominationNotes}</p>}
                  <p className="mt-4 flex-1 text-xs text-[var(--text-secondary)]">Idiomas: {c.languages.map((l) => LANG[l] ?? l).join(", ")}</p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link href={guide} className={primaryButton}>
                      {count ? `Guía de ${c.city} · ${count} ${count === 1 ? "lugar" : "lugares"}` : `Guía de ${c.city}`}
                    </Link>
                    <Link href={`/kosher/mapa?ciudad=${c.slug}`} className={secondaryButton}>
                      <MapPinned className="h-4 w-4" aria-hidden /> Mapa
                    </Link>
                    <Link href={`/kosher/chat?sala=${encodeURIComponent(cityThreadKey(c.city, c.countryCode))}`} className={secondaryButton}>
                      <MessagesSquare className="h-4 w-4" aria-hidden /> Sala de {c.city}
                    </Link>
                  </div>
                </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
// creado por pato dev y askforvini
