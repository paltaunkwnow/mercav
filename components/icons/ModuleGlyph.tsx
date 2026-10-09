import type { SVGProps } from "react";

/** Pictogramas propios de cada módulo, dibujados para el cartel. Se trazan al entrar en pantalla y cada uno tiene su gesto al pasar el mouse. */
export type ModuleGlyphKey = "business" | "fidelizacion" | "publicidad" | "talento" | "empleos" | "herramientas" | "pwn" | "calendario";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { name: ModuleGlyphKey; size?: number | string; title?: string };

export function ModuleGlyph({ name, size = 48, title, className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={`mv-glyph mv-glyph-${name}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {GLYPHS[name]}
    </svg>
  );
}

const GLYPHS: Record<ModuleGlyphKey, JSX.Element> = {
  // Boleta de pago: la hoja y tres filas que se calculan una tras otra.
  business: (
    <>
      <path className="mg-d" d="M13 5h17l7 7v29a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path className="mg-d" d="M30 5v7h7" />
      <path className="mg-row mg-row-1" d="M17 21h14" />
      <path className="mg-row mg-row-2" d="M17 28h14" />
      <path className="mg-row mg-row-3" d="M17 35h8" />
    </>
  ),
  // Tarjeta de sellos: los sellos se marcan en orden y el último es el premio.
  fidelizacion: (
    <>
      <rect className="mg-d" x="4" y="11" width="40" height="27" rx="4" />
      <circle className="mg-stamp mg-stamp-1" cx="13" cy="24.5" r="3.2" />
      <circle className="mg-stamp mg-stamp-2" cx="22" cy="24.5" r="3.2" />
      <circle className="mg-stamp mg-stamp-3" cx="31" cy="24.5" r="3.2" />
      <path className="mg-stamp mg-stamp-4" d="m38.5 21 1.1 2.3 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3Z" strokeWidth={2} />
    </>
  ),
  // Megáfono con ondas que salen en secuencia.
  publicidad: (
    <>
      <path className="mg-d" d="M6 20v8a2 2 0 0 0 2 2h4l14 8V10L12 18H8a2 2 0 0 0-2 2Z" />
      <path className="mg-d" d="M12 30l2 9" />
      <path className="mg-wave mg-wave-1" d="M32 19a7 7 0 0 1 0 10" />
      <path className="mg-wave mg-wave-2" d="M36.5 14.5a13 13 0 0 1 0 19" />
      <path className="mg-wave mg-wave-3" d="M41 10a19 19 0 0 1 0 28" />
    </>
  ),
  // Talento: una persona y un destello.
  talento: (
    <>
      <circle className="mg-d" cx="20" cy="16" r="7" />
      <path className="mg-d" d="M6 41c1.5-7.5 7-12 14-12s12.5 4.5 14 12" />
      <path className="mg-spark" d="M38 6v8M34 10h8" />
    </>
  ),
  // Empleo: el maletín se abre y aparece el visto.
  empleos: (
    <>
      <path className="mg-handle" d="M18 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <rect className="mg-d" x="5" y="13" width="38" height="27" rx="4" />
      <path className="mg-d" d="M5 24h38" />
      <path className="mg-check" d="m19 30 4 4 7-7" />
    </>
  ),
  // Herramientas: la llave da media vuelta.
  herramientas: (
    <>
      <path
        className="mg-wrench"
        d="M28.5 12.5a8 8 0 0 0 10.4 10.4l-3.6-3.6 1.4-5.2 5.2-1.4 3.6 3.6M28.5 12.5a8 8 0 0 1 6.8-6.3M28.5 12.5 9 32a4.2 4.2 0 0 0 6 6l19.5-19.5"
      />
      <circle className="mg-d" cx="12" cy="35" r="0.6" />
    </>
  ),
  // Pwn: un escudo con un radar que barre.
  pwn: (
    <>
      <path className="mg-d" d="M24 4 8 10v12c0 10 6.8 18.5 16 22 9.2-3.5 16-12 16-22V10Z" />
      <circle className="mg-d" cx="24" cy="23" r="7" />
      <path className="mg-sweep" d="M24 23V12" />
    </>
  ),
  // Calendario: la hoja del día se da vuelta.
  calendario: (
    <>
      <rect className="mg-d" x="6" y="9" width="36" height="33" rx="4" />
      <path className="mg-d" d="M16 5v8M32 5v8M6 19h36" />
      <g className="mg-page">
        <path d="M17 27h4M27 27h4M17 34h4M27 34h4" />
      </g>
    </>
  ),
};
// creado por pato dev y askforvini
