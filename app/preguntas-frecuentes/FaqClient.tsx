"use client";

import { useState } from "react";
import { HelpCircle } from "@/components/icons";
import { Container, Section } from "@/components/site/primitives";
import { FaqItem, FaqSearch } from "./FaqAccordion";

export type FaqSection = { id: string; title: string; items: { q: string; a: string }[] };

/** Búsqueda, categorías y preguntas que se abren. El contenido llega armado desde el servidor. */
export function FaqClient({ sections }: { sections: FaqSection[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const term = query.trim().toLowerCase();

  const visible = term
    ? sections.map((s) => ({ ...s, items: s.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(term)) })).filter((s) => s.items.length > 0)
    : sections;
  const count = visible.reduce((n, s) => n + s.items.length, 0);
  const toggle = (q: string) => setOpen((current) => (current.includes(q) ? current.filter((x) => x !== q) : [...current, q]));

  return (
    <Section tight className="!pt-0">
      <Container>
        <div className="max-w-2xl">
          <FaqSearch value={query} onChange={setQuery} placeholder="Buscá respuestas: planes, caja, pagos, cuenta…" resultCount={count} />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Categorías" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <ul className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
              {visible.map((s) => (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    className="mv-focus flex h-10 items-center whitespace-nowrap rounded-full border border-[var(--mv-hairline)] px-4 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] lg:-ml-3 lg:rounded-xl lg:border-transparent lg:px-3 lg:hover:bg-[var(--mv-panel-hover)]"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-12">
            {visible.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28">
                <h2 id={`${s.id}-h`} className="mv-h3 mb-5">
                  {s.title}
                </h2>
                <ul className="space-y-2.5">
                  {s.items.map((item) => (
                    <FaqItem key={item.q} question={item.q} answer={item.a} open={open.includes(item.q)} onToggle={() => toggle(item.q)} />
                  ))}
                </ul>
              </section>
            ))}
            {visible.length === 0 ? (
              <div className="mv-panel flex flex-col items-center px-6 py-14 text-center">
                <HelpCircle className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden />
                <p className="mt-4 font-semibold text-[var(--text-primary)]">No encontramos resultados para “{query}”.</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Probá con otra palabra o escribinos a soporte.</p>
                <button type="button" onClick={() => setQuery("")} className="mv-link mt-5 text-sm">
                  Limpiar búsqueda
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
// creado por pato dev y askforvini
