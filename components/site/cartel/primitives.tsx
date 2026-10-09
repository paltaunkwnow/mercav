import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Piezas del cartel (mundo visual de mercav.lat). Ver app/cartel.css.
 */

export type FitLine = {
  text: string;
  /**
   * Tamaño en cqi para que el renglón llene el ancho: 10000 / (ancho en px del texto a 100px, peso 850, mayúsculas).
   * Para medir uno nuevo: en la consola de una página del sitio, poné el texto en un span con
   * `font-family: var(--font-cartel); font-weight: 850; text-transform: uppercase; font-size: 100px` y leé su ancho.
   */
  fit: number;
  className?: string;
};

/** Titular de cartel: cada renglón mide lo mismo que el bloque. */
export function FitLines({ lines, as: Tag = "h1", id, className }: { lines: FitLine[]; as?: "h1" | "h2" | "p"; id?: string; className?: string }) {
  return (
    <Tag id={id} className={cn("c-display c-fit", className)}>
      {lines.map((line, i) => (
        <span key={i} className={cn("c-fit-line", line.className)} style={{ "--fit": (line.fit * 0.98).toFixed(3) } as CSSProperties}>
          {line.text}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/** Estrella de doce puntas, el único ornamento del cartel. */
export function Starburst({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("c-star", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} fill="currentColor">
      {title ? <title>{title}</title> : null}
      <path d="M12 0l2.4 4.3 4.6-1.6-.9 4.8 4.6 1.5-3.4 3.4 3.4 3.5-4.6 1.4.9 4.8-4.6-1.5L12 24l-2.4-4.4-4.6 1.5.9-4.8-4.6-1.4 3.4-3.5L1.3 8l4.6-1.5L5 1.7l4.6 1.6Z" />
    </svg>
  );
}

/** Sección con el ritmo vertical del cartel: más aire arriba del titular que abajo. */
export function CartelSection({
  children,
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative py-20 md:py-28 lg:py-32", className)}>
      {children}
    </section>
  );
}

/** Estado de un módulo, en la grilla de etiquetas de cada cartel. */
export function StatusTag({ children = "En vivo" }: { children?: ReactNode }) {
  return (
    <span className="c-label inline-flex items-center gap-2 rounded-[2px] px-2 py-1 text-[0.95rem] shadow-[inset_0_0_0_2px_currentColor]">
      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}
// creado por pato dev y askforvini
