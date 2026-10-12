import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, CalendarPlus } from "@/components/icons";
import { hebrewSerif } from "@/components/kosher/sidur/hebrew-font";
import { BackLink, Pill, cardClass } from "@/components/kosher/ui";
import {
  KIND_LABEL,
  LAST_YEAR,
  describeOccurrence,
  festivalBySlug,
  festivalFaq,
  nextOfFestival,
  occurrencesOf,
  shortDate,
  todayKey,
  type Festival,
  type FestivalPart,
} from "@/lib/kosher/festivals";
import { sidurBySlug } from "@/lib/kosher/sidur";
import { KOSHER_URL, canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";
import { cn } from "@/lib/utils";

const KIND_TONE = { "iom-tov": "gold", ayuno: "warn", fiesta: "techelet", recordacion: "muted" } as const;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const festival = festivalBySlug(params.slug);
  if (!festival) return { title: "Festividad no encontrada" };
  const next = nextOfFestival(festival);
  const year = next?.occurrence.first.slice(0, 4);
  const url = canonicalFor(`/kosher/festividades/${festival.slug}`);
  const title = `${festival.name}${year ? ` ${year}` : ""}: qué es, costumbres y fechas`;
  const description = `${festival.summary} ${next ? describeOccurrence(festival, next.part, next.occurrence) : ""}`.trim();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "es_419", siteName: "Mercav Kosher", url, title, description },
  };
}

export default function FestivalPage({ params }: { params: { slug: string } }) {
  const festival = festivalBySlug(params.slug);
  if (!festival) notFound();

  const today = todayKey();
  const next = nextOfFestival(festival, today);
  const faq = festivalFaq(festival, today);
  const blessings = festival.blessings.map(sidurBySlug).filter((b): b is NonNullable<typeof b> => b !== null);
  const multi = festival.parts.length > 1;
  const url = canonicalFor(`/kosher/festividades/${festival.slug}`);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "es",
      url,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: KOSHER_URL },
        { "@type": "ListItem", position: 2, name: "Festividades", item: canonicalFor("/kosher/festividades") },
        { "@type": "ListItem", position: 3, name: festival.name, item: url },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <BackLink href="/kosher/festividades">Festividades</BackLink>

      <article aria-labelledby="fest-title">
        <header className="mb-8 flex flex-col gap-3">
          <h1 id="fest-title" className="mv-h1">
            {festival.name}
          </h1>
          <p lang="he" dir="rtl" className={cn(hebrewSerif.className, "text-left text-2xl leading-relaxed text-techelet")}>
            {festival.hebrew}
          </p>
          <p className="mv-lead">{festival.summary}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={KIND_TONE[festival.kind]}>{KIND_LABEL[festival.kind]}</Pill>
            <Pill>{festival.hebrewDate}</Pill>
          </div>
        </header>

        {next && (
          <section aria-labelledby="fest-next" className={cn(cardClass, "md:p-8")}>
            <h2 id="fest-next" className="mv-h3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[var(--mv-gold-ink)]" aria-hidden />
              {multi ? "Próximo ayuno" : next.occurrence.first <= today ? "Ahora" : "Próxima fecha"}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-primary)]">{describeOccurrence(festival, next.part, next.occurrence)}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {next.occurrence.hebrewFirst} · {festival.workShort}
            </p>
            <Link
              href="/kosher/calendario"
              className="mv-focus -ml-2 mt-3 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-techelet hover:underline"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              {festival.startsAt === "dawn" ? "Zmanim de tu ciudad y calendario para suscribir" : "Velas de tu ciudad y calendario para suscribir"}
            </Link>
          </section>
        )}

        <section aria-labelledby="fest-about" className="mt-12">
          <h2 id="fest-about" className="mv-h2">
            {multi ? "Qué son los ayunos menores" : `Qué ${festival.plural ? "son" : "es"} ${festival.name}`}
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {festival.about.map((p) => (
              <p key={p} className="mv-body text-base">
                {p}
              </p>
            ))}
          </div>
        </section>

        {multi && (
          <section aria-labelledby="fest-parts" className="mt-12">
            <h2 id="fest-parts" className="mv-h2">
              Cada ayuno y sus fechas
            </h2>
            <div className="mt-6 flex flex-col gap-4">
              {festival.parts.map((part) => (
                <div key={part.key} className={cardClass}>
                  <h3 className="mv-h3">{part.name}</h3>
                  <p lang="he" dir="rtl" className={cn(hebrewSerif.className, "mt-1 text-left text-xl text-techelet")}>
                    {part.hebrew}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{part.hebrewDate}</p>
                  {part.about && <p className="mv-body mt-3">{part.about}</p>}
                  <DateList festival={festival} part={part} today={today} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="fest-customs" className="mt-12">
          <h2 id="fest-customs" className="mv-h2">
            Qué se acostumbra
          </h2>
          <ul className="mv-body mt-4 flex list-disc flex-col gap-2.5 pl-5 text-base">
            {festival.customs.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="fest-work" className="mt-12">
          <h2 id="fest-work" className="mv-h2">
            ¿Se trabaja?
          </h2>
          <p className="mv-body mt-4 text-base">{festival.work}</p>
        </section>

        <section aria-labelledby="fest-israel" className="mt-12">
          <h2 id="fest-israel" className="mv-h2">
            Diáspora e Israel
          </h2>
          <p className="mv-body mt-4 text-base">{festival.israel}</p>
        </section>

        {blessings.length > 0 && (
          <section aria-labelledby="fest-blessings" className="mt-12">
            <h2 id="fest-blessings" className="mv-h2">
              Bendiciones
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {blessings.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/kosher/sidur/${b.slug}`}
                    className="mv-focus inline-flex h-10 items-center gap-2 rounded-full border border-[var(--mv-hairline-strong)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-techelet/40"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-techelet" aria-hidden /> {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!multi && (
          <section aria-labelledby="fest-dates" className="mt-12">
            <h2 id="fest-dates" className="mv-h2">
              Fechas hasta {LAST_YEAR}
            </h2>
            <p className="mv-body mt-3">
              Como toda fecha del calendario hebreo, empieza al atardecer del día anterior al primer día y termina al anochecer del último. Fechas
              de la diáspora{hasIsraelDifference(festival) ? ", con Israel aparte cuando termina antes" : ""}.
            </p>
            <DateList festival={festival} part={festival.parts[0]} today={today} />
          </section>
        )}

        <section aria-labelledby="fest-faq" className="mt-12">
          <h2 id="fest-faq" className="mv-h2">
            Preguntas frecuentes
          </h2>
          <div className="mt-4 flex flex-col divide-y divide-[var(--mv-hairline)]">
            {faq.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="mv-h3">{f.q}</h3>
                <p className="mv-body mt-2">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-[var(--text-secondary)]">
          Fechas calculadas con{" "}
          <a href="https://www.hebcal.com" target="_blank" rel="noreferrer" className="mv-link underline">
            Hebcal
          </a>
          . Mercav Kosher no dictamina halajá: las costumbres cambian según la comunidad, así que ante cualquier duda consultá con tu rabino.
        </p>
      </article>
    </div>
  );
}

function hasIsraelDifference(festival: Festival) {
  return occurrencesOf(festival).some((o) => o.lastIsrael !== o.last);
}

/** Fechas de una parte, del año en curso a 2035: la próxima resaltada, las que pasaron atenuadas. */
function DateList({ festival, part, today }: { festival: Festival; part: FestivalPart; today: string }) {
  const occurrences = occurrencesOf(festival, part);
  const nextKey = occurrences.find((o) => o.last >= today)?.first;
  return (
    <ol className="mt-5 flex flex-col divide-y divide-[var(--mv-hairline)] overflow-hidden rounded-2xl ring-1 ring-inset ring-[var(--mv-hairline)]">
      {occurrences.map((o) => {
        const past = o.last < today;
        const isNext = o.first === nextKey;
        const range =
          festival.startsAt === "dawn"
            ? `${shortDate(o.first)}, del amanecer a la noche`
            : festival.slug === "januca"
              ? `Primera vela el ${shortDate(o.begins)} a la noche · hasta el ${shortDate(o.last)}`
              : o.first === o.last
                ? `Del atardecer del ${shortDate(o.begins)} al anochecer del ${shortDate(o.first)}`
                : `Del atardecer del ${shortDate(o.begins)} al anochecer del ${shortDate(o.last)}`;
        return (
          <li
            key={`${o.hebrewYear}-${o.first}`}
            aria-current={isNext ? "date" : undefined}
            className={cn("grid grid-cols-[3.5rem_1fr] gap-x-4 px-4 py-3", isNext && "bg-[var(--mv-gold-wash)]", past && "opacity-60")}
          >
            <span className="mv-data pt-px text-sm font-semibold text-[var(--text-primary)]">{o.first.slice(0, 4)}</span>
            <span className="text-sm">
              <span className="text-[var(--text-primary)]">{range}</span>
              {o.lastIsrael !== o.last && <span className="text-[var(--text-secondary)]"> · en Israel, hasta el {shortDate(o.lastIsrael)}</span>}
              <span className="block text-xs text-[var(--text-secondary)]">
                {o.hebrewFirst}
                {past && " · ya pasó"}
                {isNext && " · la próxima"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
// creado por pato dev y askforvini
