import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarPlus } from "@/components/icons";
import { hebrewSerif } from "@/components/kosher/sidur/hebrew-font";
import { PageIntro, Pill } from "@/components/kosher/ui";
import { FESTIVALS, KIND_LABEL, LAST_YEAR, nextOfFestival, occurrenceShort, todayKey } from "@/lib/kosher/festivals";
import { KOSHER_URL, SITE_URL, canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";
import { cn } from "@/lib/utils";

const TITLE = "Festividades del calendario hebreo";
const DESCRIPTION = `Rosh Hashaná, Iom Kipur, Sucot, Janucá, Purim, Pésaj, Shavuot y las demás fechas del calendario hebreo: qué se celebra, qué se acostumbra, si se trabaja y sus fechas hasta ${LAST_YEAR}.`;
const PAGE_URL = canonicalFor("/kosher/festividades");
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const KIND_TONE = { "iom-tov": "gold", ayuno: "warn", fiesta: "techelet", recordacion: "muted" } as const;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { type: "website", locale: "es_419", siteName: "Mercav Kosher", url: PAGE_URL, title: TITLE, description: DESCRIPTION },
};

export default function FestivalsPage() {
  const today = todayKey();
  const upcoming = FESTIVALS.map((festival) => ({ festival, next: nextOfFestival(festival, today) })).sort((a, b) =>
    (a.next?.occurrence.begins ?? "9999").localeCompare(b.next?.occurrence.begins ?? "9999"),
  );
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "es",
      url: PAGE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: FESTIVALS.length,
        itemListElement: FESTIVALS.map((f, i) => ({ "@type": "ListItem", position: i + 1, name: f.name, url: canonicalFor(`/kosher/festividades/${f.slug}`) })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: KOSHER_URL },
        { "@type": "ListItem", position: 2, name: "Festividades", item: PAGE_URL },
      ],
    },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <PageIntro title={TITLE}>
        <p>
          Qué se celebra en cada fecha, qué se acostumbra hacer, si es iom tov y cuándo cae hasta {LAST_YEAR}. Ordenadas por la que viene
          primero.
        </p>
      </PageIntro>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map(({ festival, next }) => (
          <li key={festival.slug}>
            <Link
              href={`/kosher/festividades/${festival.slug}`}
              className="mv-panel mv-panel-interactive mv-focus flex h-full flex-col p-5 md:p-6"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="mv-h3">{festival.name}</span>
                <Pill tone={KIND_TONE[festival.kind]}>{KIND_LABEL[festival.kind]}</Pill>
              </span>
              <span lang="he" dir="rtl" className={cn(hebrewSerif.className, "mt-1 text-left text-lg text-techelet")}>
                {festival.hebrew}
              </span>
              <span className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{festival.summary}</span>
              {next && (
                <span className="mt-auto pt-4 text-sm font-semibold text-[var(--text-primary)]">
                  {festival.parts.length > 1 ? `${next.part.name}: ${occurrenceShort(festival, next.occurrence)}` : capitalize(occurrenceShort(festival, next.occurrence))}
                  {next.occurrence.first <= today ? " · ahora" : ""}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="fest-how" className="mv-panel mt-16 p-6 md:p-7">
        <h2 id="fest-how" className="mv-h3">
          Cómo leer las fechas
        </h2>
        <div className="mt-3 flex max-w-3xl flex-col gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            En el calendario hebreo el día empieza a la noche: cada fiesta arranca al atardecer del día anterior a su primer día y termina al
            anochecer. Los ayunos menores son la excepción: empiezan al amanecer.
          </p>
          <p>
            Las fechas son las de la diáspora. En Israel, Pésaj y Shavuot duran un día menos, y Shminí Atzeret y Simjat Torá caen el
            mismo día; en cada página está la diferencia. Mercav Kosher no dictamina halajá: ante cualquier duda, consultá con tu rabino.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/kosher/calendario" className="mv-focus -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-techelet hover:underline">
            <CalendarPlus className="h-4 w-4" aria-hidden /> Sumá las fechas a tu calendario <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link href="/kosher/sidur" className="mv-focus -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-techelet hover:underline sm:ml-0">
            <BookOpen className="h-4 w-4" aria-hidden /> Sidur de bolsillo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
