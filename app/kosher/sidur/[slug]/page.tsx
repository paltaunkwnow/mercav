import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, ExternalLink, Sparkles } from "@/components/icons";
import { BerajaText } from "@/components/kosher/sidur/BerajaText";
import { BackLink, Pill, cardClass } from "@/components/kosher/ui";
import { festivalBySlug } from "@/lib/kosher/festivals";
import { SIDUR, SIDUR_UPDATED, sidurBySlug, sidurCategoryLabel } from "@/lib/kosher/sidur";
import { KOSHER_URL, SITE_URL, canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";
import { cn } from "@/lib/utils";

const description = (name: string, about: string) =>
  `${about}. ${name} en hebreo con nikud, con transliteración, traducción al español y cuándo se dice.`;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const entry = sidurBySlug(params.slug);
  if (!entry) return { title: "Bendición no encontrada" };
  const url = canonicalFor(`/kosher/sidur/${entry.slug}`);
  const title = `${entry.name}: ${entry.about.charAt(0).toLowerCase()}${entry.about.slice(1)}`;
  return {
    title,
    description: description(entry.name, entry.about),
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "es_419", siteName: "Mercav Kosher", url, title, description: description(entry.name, entry.about), modifiedTime: SIDUR_UPDATED },
  };
}

export default function SidurEntryPage({ params }: { params: { slug: string } }) {
  const entry = sidurBySlug(params.slug);
  if (!entry) notFound();

  const url = canonicalFor(`/kosher/sidur/${entry.slug}`);
  const festivals = (entry.festivals ?? []).map(festivalBySlug).filter((f): f is NonNullable<typeof f> => f !== null);
  const related = SIDUR.filter((e) => e.category === entry.category && e.slug !== entry.slug);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${entry.name}: ${entry.about}`,
      description: description(entry.name, entry.about),
      inLanguage: "es",
      datePublished: SIDUR_UPDATED,
      dateModified: SIDUR_UPDATED,
      mainEntityOfPage: url,
      articleSection: sidurCategoryLabel(entry.category),
      author: { "@type": "Organization", name: "Mercav", url: SITE_URL },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: KOSHER_URL },
        { "@type": "ListItem", position: 2, name: "Sidur de bolsillo", item: canonicalFor("/kosher/sidur") },
        { "@type": "ListItem", position: 3, name: entry.name, item: url },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <BackLink href="/kosher/sidur">Sidur de bolsillo</BackLink>

      <article aria-labelledby="beraja-title">
        <header className="mb-8 flex flex-col gap-3">
          <h1 id="beraja-title" className="mv-h1">
            {entry.name}
          </h1>
          <p className="mv-lead">{entry.about}</p>
          <div>
            <Pill tone="techelet">{sidurCategoryLabel(entry.category)}</Pill>
          </div>
        </header>

        <div className={cn(cardClass, "md:p-8")}>
          <BerajaText entry={entry} size="lg" />
          {entry.partial && <p className="mt-8 border-t border-[var(--mv-hairline)] pt-5 text-sm leading-relaxed text-[var(--text-secondary)]">{entry.partial}</p>}
        </div>

        <section aria-labelledby="beraja-when" className="mt-10">
          <h2 id="beraja-when" className="mv-h3">
            Cuándo se dice
          </h2>
          <p className="mv-body mt-3">{entry.when}</p>
          {entry.calendarLink && (
            <Link href="/kosher/calendario" className="mv-focus -ml-2 mt-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-techelet hover:underline">
              <CalendarDays className="h-4 w-4" aria-hidden /> Ver los horarios de tu ciudad
            </Link>
          )}
        </section>

        {entry.notes && entry.notes.length > 0 && (
          <section aria-labelledby="beraja-notes" className="mt-10">
            <h2 id="beraja-notes" className="mv-h3">
              Costumbres y variantes
            </h2>
            <ul className="mv-body mt-3 flex list-disc flex-col gap-2 pl-5">
              {entry.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        {festivals.length > 0 && (
          <section aria-labelledby="beraja-festivals" className="mt-10">
            <h2 id="beraja-festivals" className="mv-h3">
              Festividades
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {festivals.map((f) => (
                <li key={f.slug}>
                  <Link
                    href={`/kosher/festividades/${f.slug}`}
                    className="mv-focus inline-flex h-10 items-center gap-2 rounded-full border border-[var(--mv-hairline-strong)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-techelet/40"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[var(--mv-gold-ink)]" aria-hidden /> {f.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-sm leading-relaxed text-[var(--text-secondary)]">
          {entry.source && (
            <>
              <a href={entry.source.url} target="_blank" rel="noreferrer" className="mv-link inline-flex items-center gap-1 underline">
                {entry.source.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
              {". "}
            </>
          )}
          Las costumbres cambian de una comunidad a otra: ante cualquier duda, consultá con tu rabino.
        </p>
      </article>

      {related.length > 0 && (
        <nav aria-labelledby="beraja-related" className="mt-16">
          <h2 id="beraja-related" className="mv-h3">
            Otras bendiciones: {sidurCategoryLabel(entry.category)}
          </h2>
          <ul className="mv-panel mt-4 divide-y divide-[var(--mv-hairline)] overflow-hidden">
            {related.map((e) => (
              <li key={e.slug}>
                <Link href={`/kosher/sidur/${e.slug}`} className="mv-focus flex min-h-[3.5rem] items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-[var(--mv-panel-hover)]">
                  <span>
                    <span className="block font-semibold text-[var(--text-primary)]">{e.name}</span>
                    <span className="block text-sm text-[var(--text-secondary)]">{e.about}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
