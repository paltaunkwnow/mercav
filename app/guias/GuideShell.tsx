import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { HostLink } from "@/components/layout/HostContext";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection } from "@/components/site/cartel/primitives";
import { SITE_URL } from "@/lib/seo/site";
import { GUIDES, type Guide } from "./guides";

const DATE = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDate = (date: string) => DATE.format(new Date(`${date}T12:00:00Z`));

/** Marco de lectura de una guía, en el mundo cartel del sitio: encabezado, cuerpo angosto, cierre y guías relacionadas. */
export function GuideShell({ guide, children }: { guide: Guide; children: ReactNode }) {
  const url = `${SITE_URL}/guias/${guide.slug}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.updated,
      dateModified: guide.updated,
      inLanguage: "es",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "Mercav", url: SITE_URL },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mercav", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guías", item: `${SITE_URL}/guias` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
  ];
  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <article>
        <header className="pt-[calc(var(--c-nav-h)+2.5rem)] md:pt-[calc(var(--c-nav-h)+4rem)]">
          <div className="c-container max-w-[52rem]">
            <Link href="/guias" className="inline-flex items-center gap-2 text-[0.95rem] font-semibold text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Todas las guías
            </Link>
            <h1 className="c-display mt-5 text-[clamp(2.6rem,1.4rem+4.5vw,4.8rem)] leading-[0.9] [text-wrap:balance]">{guide.title}</h1>
            <p className="c-lead mt-6">{guide.description}</p>
            <p className="mt-6 text-[0.95rem] text-[var(--c-muted)]">
              Actualizada el <time dateTime={guide.updated}>{longDate(guide.updated)}</time> · {guide.minutes} min de lectura
            </p>
          </div>
        </header>
        <div className="c-container max-w-[52rem] py-14 md:py-20">
          <div className="flex flex-col gap-12">{children}</div>
        </div>
      </article>

      <section aria-labelledby="guia-cierre" className="c-band c-ink-yellow">
        <div className="c-container grid gap-8 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <h2 id="guia-cierre" className="c-h2">
            Hacelo con Mercav.
          </h2>
          <div className="flex flex-col gap-6 lg:pb-2">
            <HostLink href={guide.next.href} className="c-link inline-flex w-fit items-center gap-2 text-[1.125rem] font-semibold text-[var(--c-text)]">
              {guide.next.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </HostLink>
            <AuthCTA tone="ink" />
          </div>
        </div>
      </section>

      <CartelSection labelledBy="guia-otras">
        <div className="c-container">
          <h2 id="guia-otras" className="c-h2">
            Más guías.
          </h2>
          <ul className="mt-10 grid gap-3 md:grid-cols-3">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="group flex h-full flex-col gap-3 rounded-[1.25rem] p-6 shadow-[inset_0_0_0_2px_var(--c-line)] transition-shadow duration-200 hover:shadow-[inset_0_0_0_2px_var(--c-yellow)]">
                  <span className="c-h3 !text-[1.6rem]">{g.title}</span>
                  <span className="mt-auto text-[0.95rem] text-[var(--c-muted)]">{g.minutes} min de lectura</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>
    </div>
  );
}

/** Una sección de la guía: título y texto con el ancho cómodo para leer. */
export function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="c-h3">{title}</h2>
      <div className="flex flex-col gap-4 text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">{children}</div>
    </section>
  );
}

/** Tabla de dos columnas (concepto y valor), con la fila del total resaltada. */
export function GuideRows({ rows, caption, title }: { rows: { label: ReactNode; value: ReactNode; strong?: boolean }[]; caption?: string; title?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      {title ? <p className="pb-1 font-semibold text-[var(--c-text)]">{title}</p> : null}
      <dl className="border-t-2 border-[var(--c-line)]">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-baseline justify-between gap-4 border-b-2 border-[var(--c-line)] py-2.5 text-[1rem] ${r.strong ? "font-semibold text-[var(--c-text)]" : ""}`}>
            <dt className={r.strong ? undefined : "text-[var(--c-soft)]"}>{r.label}</dt>
            <dd className="c-num shrink-0">{r.value}</dd>
          </div>
        ))}
      </dl>
      {caption ? <figcaption className="text-[0.9rem] leading-snug text-[var(--c-muted)]">{caption}</figcaption> : null}
    </figure>
  );
}
/** Lista con viñetas cortas, para pasos y recomendaciones. */
export function GuideList({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2">
          <span aria-hidden className={ordered ? "c-num font-semibold text-[var(--c-yellow-text)]" : "mt-[0.6em] h-[3px] w-3 bg-[var(--c-yellow-text)]"}>
            {ordered ? `${i + 1}.` : null}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}

/** Aviso dentro de la guía: lo que hay que confirmar o tener en cuenta. */
export function GuideNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-[1.25rem] bg-[var(--c-raised)] p-6 text-[1rem] leading-relaxed text-[var(--c-soft)] sm:p-7">
      <p className="font-semibold text-[var(--c-text)]">{title}</p>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </aside>
  );
}
// creado por pato dev y askforvini
