import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { MoreProducts } from "@/components/site/product/ProductBlocks";
import { SITE_URL } from "@/lib/seo/site";
import { GUIDES } from "./guides";

export const metadata: Metadata = {
  title: "Guías para tu negocio",
  description: "Cómo armar la planilla de sueldos, fidelizar clientes, planificar los feriados y cuidar los datos de tu empresa. Con datos reales, en español.",
};

export default function GuidesPage() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guías de Mercav",
    itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/guias/${g.slug}`, name: g.title })),
  };

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <header className="pt-[calc(var(--c-nav-h)+2.5rem)] md:pt-[calc(var(--c-nav-h)+4rem)]">
        <div className="c-container">
          <h1 className="c-display text-[clamp(4rem,2rem+9vw,9rem)]">Guías.</h1>
          <p className="c-lead mt-6">Cómo hacer las cosas del negocio, paso a paso y con números de verdad: sueldos, clientes, feriados y seguridad.</p>
        </div>
      </header>

      <section aria-label="Todas las guías" className="py-14 md:py-20">
        <div className="c-container">
          <ol className="border-t-2 border-[var(--c-line)]">
            {GUIDES.map((g, i) => (
              <li key={g.slug} className="border-b-2 border-[var(--c-line)]">
                <Link href={`/guias/${g.slug}`} className="group grid gap-x-8 gap-y-3 py-8 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,0.8fr)_auto] md:items-baseline md:py-10">
                  <span className="c-display c-num text-[2.5rem] leading-none text-[var(--c-yellow-text)]" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="c-h3 transition-colors duration-150 group-hover:text-[var(--c-yellow-text)]">{g.title}</h2>
                  <p className="c-body">{g.description}</p>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap text-[0.95rem] text-[var(--c-muted)]">
                    {g.minutes} min
                    <ArrowRight className="h-5 w-5 text-[var(--c-text)] transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <MoreProducts current="/guias" />
    </div>
  );
}
// creado por pato dev y askforvini
