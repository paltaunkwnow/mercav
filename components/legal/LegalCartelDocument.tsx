import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ArrowRight, ArrowUp } from "@/components/icons";
import { subprocessorsList, type LegalDocument } from "@/lib/legal/documents";
import { SUBPROCESSORS } from "@/lib/legal/site";
import { HostLink } from "@/components/layout/HostContext";
import { ManageCookiesLink } from "@/components/legal/ManageCookiesLink";
import { LEGAL_RELATED, legalSections } from "@/components/legal/LegalDocumentView";
import { LegalToc } from "@/components/legal/LegalToc";
import { Starburst } from "@/components/site/cartel/primitives";
import { cn } from "@/lib/utils";

/*
 * Documento legal de mercav.lat en el mundo del cartel, en modo lectura: la portada del documento es un campo de
 * tinta con el título; el cuerpo va en blanco y negro, con la letra del sistema y un renglón cómodo.
 */

type Ink = "yellow" | "green" | "orange" | "magenta" | "inverse";

/** Cada documento tiene su tinta fija, por familia: las reglas de uso, tus datos, cookies, pagos y el titular. */
const DOC_INK: Record<string, Ink> = {
  terminos: "yellow",
  "legal/uso-aceptable": "yellow",
  privacidad: "green",
  "legal/derechos": "green",
  cookies: "orange",
  "legal/reembolsos": "magenta",
  "aviso-legal": "inverse",
};

const INK_SCOPE: Record<Ink, string | undefined> = {
  yellow: "c-ink-yellow",
  green: "c-ink-green",
  orange: "c-ink-orange",
  magenta: "c-ink-magenta",
  inverse: undefined,
};

/** Rutas internas que pueden aparecer en el texto legal y que existen como página. */
const INTERNAL_PATHS = new Set(["/contacto", "/precios", "/legal/derechos", "/kosher/perfil", "/kosher/terminos"]);

/** "Última actualización: 8 de octubre de 2026" o "Versión 2 · 8 de octubre de 2026" → datos de la portada. */
function docMeta(doc: LegalDocument, sectionCount: number) {
  const meta: { label: string; value: string }[] = [];
  const badge = doc.badge?.trim();
  if (badge) {
    const versioned = badge.match(/^Versión\s+(\S+)\s+·\s+(.+)$/);
    if (versioned) meta.push({ label: "Última actualización", value: versioned[2] }, { label: "Versión", value: versioned[1] });
    else meta.push({ label: "Última actualización", value: badge.replace(/^Última actualización:\s*/, "") });
  }
  meta.push({ label: "Secciones", value: String(sectionCount) });
  return meta;
}

/** Correos, direcciones web y rutas del sitio dentro de un párrafo, como links. El texto queda igual. */
function linkify(text: string): ReactNode[] {
  const token = /(https?:\/\/\S+[^\s.,;:)»])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(^|[\s(])(\/[a-z][\w-]*(?:\/[\w-]+)*)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(text))) {
    const [whole, url, email, lead = "", path] = match;
    if (path && !INTERNAL_PATHS.has(path)) continue;
    const start = match.index + lead.length;
    if (start > last) out.push(text.slice(last, start));
    if (url) {
      out.push(
        <a key={start} href={url} target="_blank" rel="noopener noreferrer" className="c-link">
          {url}
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>,
      );
    } else if (email) {
      out.push(
        <a key={start} href={`mailto:${email}`} className="c-link">
          {email}
        </a>,
      );
    } else {
      out.push(
        <HostLink key={start} href={path} className="c-link">
          {path}
        </HostLink>,
      );
    }
    last = match.index + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** "Registro: nombre, …" → el rótulo inicial en negrita, para recorrer listas de datos de un vistazo. */
function leadLabel(text: string) {
  const match = text.match(/^([A-ZÁÉÍÓÚÑ][^:.;!?]{0,46}):\s/);
  return match && match[1].split(/\s+/).length <= 5 ? match[1] : null;
}

function Paragraph({ text }: { text: string }) {
  const label = leadLabel(text);
  if (!label) return <p>{linkify(text)}</p>;
  return (
    <p>
      <strong>{label}:</strong>
      {linkify(text.slice(label.length + 1))}
    </p>
  );
}

/** Los encargados del tratamiento: el mismo contenido del párrafo de la política, en una tabla. */
function SubprocessorTable({ labelledBy }: { labelledBy: string }) {
  return (
    <table role="table" aria-labelledby={labelledBy} className="c-table">
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">Proveedor</th>
          <th role="columnheader" scope="col">Finalidad</th>
          <th role="columnheader" scope="col">Región</th>
          <th role="columnheader" scope="col">Política</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {SUBPROCESSORS.map((s) => (
          <tr role="row" key={s.name}>
            <td role="cell" data-label="Proveedor">{s.name}</td>
            <td role="cell" data-label="Finalidad">{s.purpose}</td>
            <td role="cell" data-label="Región">{s.region}</td>
            <td role="cell" data-label="Política">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="c-link">
                {s.url
                  .replace(/^https?:\/\//, "")
                  .split("/")
                  .map((part, i) => (
                    <Fragment key={i}>
                      {i > 0 ? (
                        <>
                          /<wbr />
                        </>
                      ) : null}
                      {part}
                    </Fragment>
                  ))}
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LegalCartelDocument({ doc }: { doc: LegalDocument }) {
  const sections = legalSections(doc);
  const ink = DOC_INK[doc.slug] ?? "yellow";
  const meta = docMeta(doc, sections.length);
  const related = LEGAL_RELATED.filter((r) => r.href !== `/${doc.slug}`);
  const isCookies = doc.slug === "cookies";

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <article aria-labelledby="legal-title" className={cn("flex flex-col", INK_SCOPE[ink])}>
        <header className="pt-[calc(var(--c-nav-h)+env(safe-area-inset-top,0px))]">
          <div className={ink === "inverse" ? "c-inverse" : "c-band"}>
            <div className="c-container pb-10 pt-12 md:pb-14 md:pt-20">
              <h1
                id="legal-title"
                className="c-display max-w-[15ch] scroll-mt-[calc(var(--c-nav-h)+3rem)] text-[clamp(2.75rem,1.5rem+5vw,6.5rem)] !leading-[0.9] [overflow-wrap:anywhere] [text-wrap:balance]"
              >
                {doc.title}
              </h1>
              <p className="c-lead mt-6 md:mt-8">{doc.subtitle}</p>
              <dl className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t-2 border-[var(--c-line-strong)] pt-5 md:mt-14">
                {meta.map((m, i) => (
                  <div key={m.label} className="flex items-center gap-6">
                    {i > 0 ? (
                      <span aria-hidden className="hidden sm:block">
                        <Starburst className="h-3 w-3" />
                      </span>
                    ) : null}
                    <div className="flex flex-col gap-1">
                      <dt className="c-label text-[var(--c-soft)]">{m.label}</dt>
                      <dd className="c-num text-[1.0625rem] font-semibold">{m.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </header>

        <div className="c-container">
          <div className="grid grid-cols-1 gap-10 pb-20 pt-10 md:pb-28 md:pt-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14 lg:pt-20 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-24">
            <LegalToc items={sections.map(({ id, num, label }) => ({ id, num, label }))} />

            <div className="min-w-0 max-w-[40rem]">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-h`}
                  className="scroll-mt-[calc(var(--c-nav-h)+1.5rem)] border-t-2 border-[var(--c-line)] py-10 first:border-t-0 first:pt-0 md:py-12"
                >
                  <h2 id={`${section.id}-h`} className="c-h3 group flex items-baseline gap-x-4">
                    {section.num ? <span className="c-num shrink-0 text-[var(--c-muted)]">{section.num}</span> : null}
                    <span className="min-w-0">{section.label}</span>
                    <a
                      href={`#${section.id}`}
                      aria-label={`Enlace a la sección ${section.label}`}
                      className="ml-auto shrink-0 self-center rounded-[2px] px-1 text-[1.125rem] text-[var(--c-muted)] opacity-0 transition-opacity duration-150 hover:text-[var(--c-text)] focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      #
                    </a>
                  </h2>
                  <div className="c-read mt-5 md:mt-6">
                    {section.body.map((paragraph, i) =>
                      paragraph === subprocessorsList ? (
                        <SubprocessorTable key={`${section.id}-${i}`} labelledBy={`${section.id}-h`} />
                      ) : (
                        <Paragraph key={`${section.id}-${i}`} text={paragraph} />
                      ),
                    )}
                  </div>
                </section>
              ))}

              <footer className="mt-2 flex flex-col gap-12 border-t-2 border-[var(--c-line-strong)] pt-12 md:gap-14 md:pt-14">
                {isCookies ? (
                  <div className="flex flex-col gap-6 border-b-2 border-[var(--c-line)] pb-12 sm:flex-row sm:items-end sm:justify-between md:pb-14">
                    <div className="flex flex-col gap-3">
                      <h2 className="c-h3">Tu elección de cookies</h2>
                      <p className="text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">Podés revisarla o cambiarla cuando quieras.</p>
                    </div>
                    <ManageCookiesLink className="c-btn w-full shrink-0 sm:w-auto" />
                  </div>
                ) : null}

                <p className="max-w-[36em] text-[0.9375rem] leading-relaxed text-[var(--c-muted)]">
                  Este texto es informativo. Revisalo con asesoría legal antes de operaciones reguladas. ¿Dudas sobre este documento?{" "}
                  {/* Las páginas legales viven en mercav.lat; /contacto, en app.mercav.lat. */}
                  <HostLink href="/contacto" className="c-link font-semibold !text-[var(--c-text)]">
                    Escribinos
                  </HostLink>
                  .
                </p>

                <nav aria-labelledby="legal-related">
                  <h2 id="legal-related" className="c-h3">
                    Otros documentos
                  </h2>
                  <ul className="mt-6 grid border-t-2 border-[var(--c-line)] sm:grid-cols-2 sm:gap-x-10">
                    {related.map((r) => (
                      <li key={r.href} className="border-b-2 border-[var(--c-line)]">
                        <Link
                          href={r.href}
                          className="c-label flex min-h-14 items-center justify-between gap-4 py-3 !text-[1.25rem] transition-colors duration-150 hover:text-[var(--c-yellow-text)]"
                        >
                          {r.label}
                          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <a
                  href="#legal-title"
                  className="c-label inline-flex min-h-11 w-fit items-center gap-2 !text-[1.15rem] text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                  Volver arriba
                </a>
              </footer>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
// creado por pato dev y askforvini
