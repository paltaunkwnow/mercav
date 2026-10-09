import type { CSSProperties, ReactNode } from "react";
import { StatusTag } from "@/components/site/cartel/primitives";

const FACTS = [
  { label: "Estándar", value: "Kashrut" },
  { label: "Sede", value: "Santa Cruz" },
  { label: "Alcance", value: "Bolivia" },
  { label: "Directorio", value: "Mercav Kosher" },
];

/** "KEREM" a 100px, peso 850: 10000 / ancho. Ver FitLines en primitives.tsx. */
const KEREM_FIT = 41.312;

/**
 * Kerem by Mercav, el próximo proyecto: un cartel magenta con la foto impresa encima (multiplicada sobre la tinta).
 * Lo pegan Quiénes somos e Inversores; cada página trae su texto.
 */
export function KeremPoster({
  titleId,
  status,
  line,
  children,
  tilt = "-0.5deg",
}: {
  titleId: string;
  status: ReactNode;
  /** El dato del cartel, entre dos filetes. */
  line: ReactNode;
  children: ReactNode;
  tilt?: string;
}) {
  return (
    <article aria-labelledby={titleId} className="c-poster c-paste c-band c-ink-magenta" style={{ "--tilt": tilt } as CSSProperties}>
      <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14 lg:p-14">
        <div className="flex flex-col gap-6">
          <div>
            <StatusTag>{status}</StatusTag>
          </div>
          <h2 id={titleId} className="c-display c-fit max-w-[28rem]">
            <span className="c-fit-line" style={{ "--fit": (KEREM_FIT * 0.995).toFixed(3) } as CSSProperties}>
              Kerem
            </span>{" "}
            <span className="c-label mt-2 block text-[1.5rem] md:text-[1.9rem]">by Mercav</span>
          </h2>
          <p className="c-label border-y-2 border-current py-3 text-[1.25rem] md:text-[1.45rem]">{line}</p>
          <div className="flex max-w-[38rem] flex-col gap-4 text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">{children}</div>
          <dl className="grid grid-cols-2 gap-x-6 border-t-2 border-[var(--c-line-strong)]">
            {FACTS.map((f) => (
              <div key={f.label} className="border-b-2 border-[var(--c-line)] py-3">
                <dt className="c-label text-[0.95rem] text-[var(--c-soft)]">{f.label}</dt>
                <dd className="mt-1 font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure>
          <div className="aspect-[4/3] overflow-hidden lg:aspect-[4/5]">
            <img
              src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover mix-blend-multiply contrast-[1.15] grayscale"
            />
          </div>
          <figcaption className="mt-3 text-[0.875rem] text-[var(--c-soft)]">Imagen ilustrativa. Kerem todavía no abrió sus puertas.</figcaption>
        </figure>
      </div>
    </article>
  );
}
// creado por pato dev y askforvini
