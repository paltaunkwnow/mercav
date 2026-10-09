import type { CSSProperties, ReactNode } from "react";
import { Mervi, type MerviPose } from "@/components/mervi/Mervi";
import { cn } from "@/lib/utils";

type Ink = "yellow" | "magenta" | "green" | "orange";

/**
 * Páginas de estado (404, 403, 500, mantenimiento, sin conexión) en el mundo del cartel: el código como afiche
 * pegado, Mervi sentado arriba con la pose del caso, el titular en letra de afiche y las acciones.
 * Mervi va fuera del afiche inclinado para que el pixel art quede nítido.
 */
export function StatusPage({
  code,
  label,
  title,
  lead,
  pose,
  ink = "yellow",
  tilt = "-2.5deg",
  actions,
  children,
}: {
  /** Lo que va grande en el afiche ("404"); sin código, la etiqueta. */
  code?: string;
  /** Texto chico del afiche ("Página no encontrada"). */
  label: string;
  title: ReactNode;
  lead: ReactNode;
  pose: MerviPose;
  ink?: Ink;
  tilt?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="status-title"
      className="cartel relative flex min-h-[100svh] w-full items-center overflow-x-clip pb-20 pt-[calc(var(--c-nav-h)+3rem)] md:pt-[calc(var(--c-nav-h)+4rem)]"
    >
      <div className="c-container grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
        {/* Mervi mide 96 px (192 px desde 1024): el afiche arranca 8 px (16 px) antes de sus patas, así queda sentado encima. */}
        <div className="relative order-2 mx-auto w-full max-w-[26rem] pt-[88px] lg:order-2 lg:max-w-none lg:pt-[176px]">
          <Mervi pose={pose} scale={1} scaleLg={2} className="absolute left-1/2 top-0 z-10 -translate-x-1/2" label={`Mervi, la mascota de Mercav`} />
          <div className={cn("c-poster c-band flex flex-col items-center gap-2 px-6 pb-8 pt-10 text-center", `c-ink-${ink}`)} style={{ "--tilt": tilt } as CSSProperties}>
            {code ? <p className="c-display c-num text-[clamp(7rem,5rem+9vw,13rem)] leading-[0.8]">{code}</p> : null}
            <p className={cn("c-label", code ? "text-[1.15rem]" : "c-display text-[clamp(3rem,2rem+4vw,5rem)] leading-[0.9]")}>{label}</p>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-1">
          <h1 id="status-title" className="c-display text-[clamp(3rem,1.8rem+4.6vw,6rem)] [text-wrap:balance]">
            {title}
          </h1>
          <p className="c-lead max-w-[34rem]">{lead}</p>
          {actions ? <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
