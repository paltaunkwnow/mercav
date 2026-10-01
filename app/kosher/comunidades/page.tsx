import type { Metadata } from "next";
import Link from "next/link";
import { MapPinned, MessagesSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cityThreadKey } from "@/lib/kosher/geo";
import { BackLink, PageIntro, primaryButton, secondaryButton } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Comunidades" };

const LANG: Record<string, string> = { es: "Español", he: "Hebreo", yi: "Ídish", en: "Inglés", pt: "Portugués", fr: "Francés", de: "Alemán", ru: "Ruso", ar: "Árabe" };

export default async function KosherCommunitiesPage() {
  const [communities, places] = await Promise.all([
    prisma.kosherCommunity.findMany({ orderBy: [{ countryCode: "asc" }, { name: "asc" }] }),
    prisma.kosherPlace.groupBy({ by: ["city", "countryCode"], where: { published: true }, _count: { _all: true } }),
  ]);
  const counts = new Map(places.map((p) => [cityThreadKey(p.city, p.countryCode), p._count._all]));
  const latamFirst = [...communities].sort((a, b) => Number(!["BO", "AR", "BR"].includes(a.countryCode)) - Number(!["BO", "AR", "BR"].includes(b.countryCode)));

  return (
    <div>
      <BackLink />
      <PageIntro eyebrow={`${communities.length} ${communities.length === 1 ? "ciudad" : "ciudades"}`} title="Kehilot">
        <p>Las ciudades con comunidad en Mercav Kosher. Cuando mostramos una población, es una estimación publicada con su fuente y año, no un censo.</p>
      </PageIntro>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {latamFirst.map((c) => {
          const key = cityThreadKey(c.city, c.countryCode);
          return (
            <li key={c.id} id={c.slug} className="scroll-mt-28">
                <article className="mv-panel flex h-full flex-col p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">{c.country}</p>
                      <h2 className="mv-h3 mt-1">{c.name}</h2>
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
                    <Link href={`/kosher/mapa?q=${encodeURIComponent(c.city)}`} className={primaryButton}>
                      <MapPinned className="h-4 w-4" aria-hidden />
                      {counts.get(key) ? `${counts.get(key)} lugares` : "Ver en el mapa"}
                    </Link>
                    <Link href={`/kosher/chat?sala=${encodeURIComponent(key)}`} className={secondaryButton}>
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
