import type { Metadata } from "next";
import Link from "next/link";
import { MapPinned, MessagesSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cityThreadKey } from "@/lib/kosher/geo";
import { KosherReveal } from "@/components/kosher/KosherReveal";

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
      <header className="mb-10 max-w-2xl">
        <Link href="/kosher/comunidad" className="text-sm font-medium text-techelet hover:underline">
          ← Comunidad
        </Link>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">Kehilot</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Las ciudades con comunidad en Mercav Kosher. Cuando mostramos una población, es una estimación publicada con su fuente y año, no un censo.
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {latamFirst.map((c, i) => {
          const key = cityThreadKey(c.city, c.countryCode);
          return (
            <li key={c.id} id={c.slug} className="scroll-mt-28">
              <KosherReveal delay={(i % 4) * 0.04}>
                <article className="h-full rounded-[1.75rem] border border-border bg-bg-secondary p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">{c.country}</p>
                      <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">{c.name}</h2>
                    </div>
                    {c.population != null && (
                      <div className="text-right">
                        <p className="font-display text-2xl font-semibold tabular-nums text-gold">≈ {c.population.toLocaleString("es")}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {c.populationSource}
                          {c.populationYear ? `, ${c.populationYear}` : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  {c.denominationNotes && <p className="mt-4 text-sm text-[var(--text-secondary)]">{c.denominationNotes}</p>}
                  <p className="mt-4 text-xs text-[var(--text-tertiary)]">Idiomas: {c.languages.map((l) => LANG[l] ?? l).join(", ")}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={`/kosher/mapa?q=${encodeURIComponent(c.city)}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-semibold text-black">
                      <MapPinned className="h-4 w-4" aria-hidden />
                      {counts.get(key) ? `${counts.get(key)} lugares` : "Ver en el mapa"}
                    </Link>
                    <Link href={`/kosher/chat?sala=${encodeURIComponent(key)}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-[var(--text-primary)] hover:border-gold/50">
                      <MessagesSquare className="h-4 w-4" aria-hidden /> Sala de {c.city}
                    </Link>
                  </div>
                </article>
              </KosherReveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
