import type { CSSProperties } from "react";
import { Mervi, type MerviPose } from "@/components/mervi/Mervi";
import { cn } from "@/lib/utils";

/**
 * Piezas animadas de la pantalla de carga. Todo es CSS (estilos en app/cartel.css, sección "Pantalla de carga", y los
 * keyframes de la barra en tailwind.config.ts): sirven en componentes de servidor, en loading.tsx y en fallbacks de
 * Suspense sin esperar a que hidrate React.
 */

/** Índice de turno para el ciclo de poses y mensajes (--i multiplica el retraso). */
const turn = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Mervi en su escenario: aro dorado girando (el "spinner"), halo, sombra en el piso, destellos de píxel y tres poses
 * que se turnan. Con "reducir movimiento" queda la primera pose, quieta.
 */
export function MerviStage({ poses }: { poses: readonly [MerviPose, MerviPose, MerviPose] }) {
  return (
    <div className="c-splash-stage" aria-hidden>
      <span className="c-splash-halo" />
      <span className="c-splash-ring" />
      <span className="c-splash-floor" />
      <span className="absolute inset-0">
        <span className="c-splash-spark" />
        <span className="c-splash-spark" />
        <span className="c-splash-spark" />
        <span className="c-splash-spark" />
      </span>
      <span className="c-splash-mervi">
        {poses.map((pose, i) => (
          // scale 2: 192 px, múltiplo entero del sprite para que los píxeles queden nítidos.
          <span key={pose + i} className="c-splash-pose" style={turn(i)}>
            <Mervi pose={pose} scale={2} />
          </span>
        ))}
      </span>
    </div>
  );
}

/** Mensajes que rotan al ritmo de las poses. Decorativos: el texto para lectores de pantalla va aparte. */
export function CyclingLines({ lines, className }: { lines: readonly [string, string, string]; className?: string }) {
  return (
    <p className={cn("c-splash-lines", className)} aria-hidden>
      {lines.map((line, i) => (
        <span key={line} className="c-splash-line" style={turn(i)}>
          {line}
        </span>
      ))}
    </p>
  );
}

/**
 * Barra de progreso: avanza rápido y se frena cerca del final (no sabemos cuánto falta) con un brillo que la recorre.
 * Con "reducir movimiento" queda fija y respira con la opacidad.
 */
export function SplashProgress({ label }: { label: string }) {
  return (
    <div className="w-full" aria-hidden>
      <div className="mb-2 flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--c-muted)]">
        <span>{label}</span>
        <span className="flex items-center gap-1 text-[var(--c-splash-gold-text)]">
          <span className="c-splash-dot" />
          <span className="c-splash-dot" />
          <span className="c-splash-dot" />
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--c-splash-track)]">
        <div
          className={cn(
            "relative h-full w-[62%] overflow-hidden rounded-full",
            "bg-[linear-gradient(90deg,#b8941e,#d4af37_45%,#f1d77a)]",
            "shadow-[0_0_14px_rgba(212,175,55,0.55)]",
            "animate-splash-fill motion-reduce:animate-pulse",
          )}
        >
          <span className="absolute inset-y-0 left-0 w-1/3 animate-splash-sweep bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)] motion-reduce:hidden" />
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
