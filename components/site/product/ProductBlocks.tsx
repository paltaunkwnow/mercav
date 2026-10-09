import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Plus } from "@/components/icons";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection } from "@/components/site/cartel/primitives";
import { PRO_ANNUAL_USD, PRO_MONTHLY_USD } from "@/lib/billing/plans";

/**
 * Piezas de las páginas públicas de producto (/caja, /planillas, /fidelizacion), en el mundo cartel del sitio.
 * Cada página pone su demo real; acá viven el encabezado, las funciones, el precio, las preguntas y los enlaces.
 */

const usd = (n: number) => new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export function ProductHero({ id, title, lead, demo }: { id: string; title: ReactNode; lead: ReactNode; demo: ReactNode }) {
  return (
    <section aria-labelledby={id} className="relative pt-[calc(var(--c-nav-h)+2.5rem)] md:pt-[calc(var(--c-nav-h)+4rem)]">
      <div className="c-container grid gap-14 pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:pb-24">
        <div>
          <h1 id={id} className="c-display text-[clamp(2.9rem,1.2rem+6vw,6.2rem)] leading-[0.86] [text-wrap:balance]">
            {title}
          </h1>
          <p className="c-lead mt-7">{lead}</p>
          <AuthCTA className="mt-9" />
        </div>
        <div className="flex justify-center lg:justify-end">{demo}</div>
      </div>
    </section>
  );
}

export function FeatureGrid({ id, title, items }: { id: string; title: ReactNode; items: { title: string; body: ReactNode }[] }) {
  return (
    <CartelSection labelledBy={id} className="!pt-8 md:!pt-12">
      <div className="c-container">
        <h2 id={id} className="c-h2 max-w-[18ch]">
          {title}
        </h2>
        <ul className="mt-12 grid border-t-2 border-[var(--c-line)] md:mt-16 md:grid-cols-2 md:gap-x-14">
          {items.map((item) => (
            <li key={item.title} className="border-b-2 border-[var(--c-line)] py-6 md:py-8">
              <h3 className="c-h3">{item.title}</h3>
              <p className="c-body mt-2 max-w-[34rem]">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </CartelSection>
  );
}

/** El precio, con los límites del plan Gratis que aplica el código para este producto. */
export function PricingBand({ free }: { free: string }) {
  return (
    <section aria-labelledby="producto-precio" className="c-band c-ink-yellow">
      <div className="c-container grid gap-8 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-end lg:gap-16">
        <h2 id="producto-precio" className="c-h2">
          Gratis para empezar.
        </h2>
        <div className="flex flex-col gap-6 lg:pb-2">
          <p className="max-w-[32rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
            {free} Mercav Pro saca los límites por {usd(PRO_MONTHLY_USD)} USD por mes, o {usd(PRO_ANNUAL_USD)} USD por año.{" "}
            <Link href="/precios" className="c-link font-semibold text-[var(--c-text)]">
              Ver los planes
            </Link>
            .
          </p>
          <AuthCTA tone="ink" />
        </div>
      </div>
    </section>
  );
}

/** Preguntas frecuentes con su FAQPage para los buscadores. Las respuestas son texto plano. */
export function ProductFAQ({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <CartelSection labelledBy="producto-faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <h2 id="producto-faq" className="c-h2">
          Preguntas frecuentes.
        </h2>
        <div className="border-t-2 border-[var(--c-line)]">
          {items.map((f) => (
            <details key={f.q} className="c-faq group border-b-2 border-[var(--c-line)]">
              <summary className="flex items-center justify-between gap-6 py-5">
                <span className="text-[1.125rem] font-semibold leading-snug">{f.q}</span>
                <Plus className="c-faq-icon h-6 w-6 shrink-0 text-[var(--c-magenta-text)]" aria-hidden />
              </summary>
              <p className="c-body pb-6">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </CartelSection>
  );
}

const PRODUCT_LINKS = [
  { href: "/caja", label: "Caja para tu negocio" },
  { href: "/planillas", label: "Planillas de sueldo" },
  { href: "/fidelizacion", label: "Tarjetas de fidelización" },
  { href: "/feriados", label: "Feriados por país" },
];

export function MoreProducts({ current }: { current: string }) {
  return (
    <CartelSection labelledBy="producto-mas" className="!pt-4">
      <div className="c-container">
        <h2 id="producto-mas" className="c-h2">
          También en Mercav.
        </h2>
        <ul className="mt-10 flex flex-wrap gap-2">
          {PRODUCT_LINKS.filter((l) => l.href !== current).map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="c-label inline-flex items-center gap-2 rounded-full px-4 py-2 text-[1.1rem] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-shadow hover:shadow-[inset_0_0_0_2px_currentColor]"
              >
                {l.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </CartelSection>
  );
}
// creado por pato dev y askforvini
