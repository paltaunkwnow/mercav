import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUp } from "lucide-react";
import type { LegalDocument } from "@/lib/legal/documents";
import { Container } from "@/components/site/primitives";
import { ManageCookiesLink } from "@/components/legal/ManageCookiesLink";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "4 bis. Mercav Kosher" → { num: "4 bis", label: "Mercav Kosher" } */
function splitTitle(title: string) {
  const match = title.match(/^(\d+(?:\s*bis)?)\.\s+(.*)$/i);
  return match ? { num: match[1], label: match[2] } : { num: null, label: title };
}

const RELATED = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/cookies", label: "Política de cookies" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/legal/derechos", label: "Tus derechos sobre los datos" },
  { href: "/legal/reembolsos", label: "Reembolsos" },
  { href: "/legal/uso-aceptable", label: "Uso aceptable" },
];

function Plain({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/**
 * `embedded` renders the document inside another layout (e.g. the Pwn shell):
 * no full-page hero padding, no aura, no own background and no extra container gutters.
 */
export function LegalDocumentView({ doc, embedded = false }: { doc: LegalDocument; embedded?: boolean }) {
  const Wrap = embedded ? Plain : Container;
  const seen = new Map<string, number>();
  const sections = doc.sections.map((section) => {
    const base = slugify(section.title) || "seccion";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return { ...section, id: count ? `${base}-${count + 1}` : base, ...splitTitle(section.title) };
  });
  const related = RELATED.filter((r) => r.href !== `/${doc.slug}`);
  const isCookies = doc.slug === "cookies";

  return (
    <article className={`relative w-full ${embedded ? "" : "bg-bg-primary"}`} aria-labelledby="legal-title">
      <header className={`relative w-full overflow-hidden ${embedded ? "pb-10 pt-2 md:pb-12" : "pb-10 pt-28 md:pb-14 md:pt-36"}`}>
        {embedded ? null : <div className="mv-aura" aria-hidden />}
        <Wrap className="relative">
          <div>
          <Link
            href="/"
            className="mv-focus -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Inicio
          </Link>
          </div>
          <p className="mv-kicker mt-6">Documento legal</p>
          <h1 id="legal-title" className="mv-h1 mt-4 max-w-4xl">
            {doc.title}
          </h1>
          <p className="mv-lead mt-5">{doc.subtitle}</p>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {doc.badge ? (
              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-tertiary)]">Vigencia</dt>
                <dd className="font-medium text-[var(--text-primary)]">{doc.badge}</dd>
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <dt className="text-[var(--text-tertiary)]">Secciones</dt>
              <dd className="mv-data text-[var(--text-primary)]">{sections.length}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[var(--text-tertiary)]">Ruta</dt>
              <dd className="mv-data text-[var(--text-primary)]">/{doc.slug}</dd>
            </div>
          </dl>
        </Wrap>
      </header>

      <Wrap>
        <div className="mv-divider" aria-hidden />
        <div className="grid grid-cols-1 gap-10 pb-20 pt-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16 lg:pt-14">
          <nav aria-label="Índice del documento" className={`lg:sticky lg:self-start ${embedded ? "lg:top-40" : "lg:top-28"}`}>
            <details className="group mv-panel rounded-[1.25rem] lg:hidden">
              <summary className="mv-focus flex h-12 cursor-pointer list-none items-center justify-between rounded-[1.25rem] px-5 text-sm font-semibold text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
                Índice
                <span className="mv-data text-xs text-[var(--text-tertiary)] group-open:hidden">{sections.length} secciones</span>
                <span className="hidden text-xs text-[var(--text-tertiary)] group-open:inline">Cerrar</span>
              </summary>
              <TocList sections={sections} />
            </details>
            <div className="hidden lg:block">
              <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">En este documento</p>
              <TocList sections={sections} />
            </div>
          </nav>

          <div className="min-w-0 max-w-[44rem]">
            {sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className={`${embedded ? "scroll-mt-40" : "scroll-mt-28"} border-b border-[var(--mv-hairline)] py-9 first:pt-0 last:border-b-0`}>
                <h2 id={`${section.id}-h`} className="group flex items-baseline gap-3 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-[1.375rem]">
                  {section.num ? <span className="mv-data shrink-0 text-sm font-normal text-gold">{section.num}</span> : null}
                  <span className="min-w-0">{section.label}</span>
                  <a
                    href={`#${section.id}`}
                    className="mv-focus ml-auto shrink-0 rounded px-1 text-sm font-normal text-[var(--text-tertiary)] opacity-0 transition-opacity hover:text-gold focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label={`Enlace a la sección ${section.label}`}
                  >
                    #
                  </a>
                </h2>
                <div className="mt-4 space-y-4 text-[1rem] leading-[1.75] text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                  {section.body.map((paragraph, i) => (
                    <p key={`${section.id}-${i}`}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <footer className="mt-6 flex flex-col gap-6">
              {isCookies ? (
                <div className="liquid-glass flex flex-col gap-4 rounded-[1.5rem] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Tu elección de cookies</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Podés revisarla o cambiarla cuando quieras.</p>
                  </div>
                  <ManageCookiesLink className="mv-btn mv-btn-secondary mv-btn-sm w-full sm:w-auto" />
                </div>
              ) : null}
              <p className="text-sm leading-relaxed text-[var(--text-tertiary)]">
                Este texto es informativo. Revisalo con asesoría legal antes de operaciones reguladas. ¿Dudas sobre este documento?{" "}
                <Link href="/contacto" className="mv-link">
                  Escribinos
                </Link>
                .
              </p>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Otros documentos</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {related.map((r) => (
                    <li key={r.href}>
                      <Link href={r.href} className="mv-chip mv-focus h-9 px-3.5 text-[13px] transition-colors hover:text-[var(--text-primary)]">
                        {r.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#legal-title" className="mv-focus inline-flex h-10 w-fit items-center gap-2 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ArrowUp className="h-4 w-4" aria-hidden /> Volver arriba
              </a>
            </footer>
          </div>
        </div>
      </Wrap>
    </article>
  );
}

function TocList({ sections }: { sections: { id: string; num: string | null; label: string }[] }) {
  return (
    <ol className="space-y-0.5 px-2 pb-3 lg:px-0 lg:pb-0">
      {sections.map((s) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="mv-focus flex min-h-10 items-baseline gap-2.5 rounded-xl px-3 py-2 text-sm leading-snug text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] lg:-ml-3"
          >
            {s.num ? <span className="mv-data w-8 shrink-0 text-xs text-[var(--text-tertiary)]">{s.num}</span> : null}
            <span>{s.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
// creado por pato dev y askforvini
