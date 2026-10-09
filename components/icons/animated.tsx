import { createElement, forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

/**
 * Movimiento de cada ícono. Lo dispara el control que lo contiene (hover, foco con teclado o toque):
 * nudge/back/up/down/diagonal se desplazan hacia donde apunta la flecha, spin gira, turn rota 90°,
 * ring suena como campana, pop late, wiggle se sacude, scan barre, beat palpita, blink parpadea,
 * tilt se inclina, key gira como una llave, bars crece desde la base, flip da vuelta la hoja, lift se eleva.
 */
export type IconMotion =
  | "nudge"
  | "back"
  | "up"
  | "down"
  | "diagonal"
  | "spin"
  | "spin-back"
  | "turn"
  | "ring"
  | "pop"
  | "wiggle"
  | "scan"
  | "beat"
  | "blink"
  | "tilt"
  | "key"
  | "bars"
  | "flip"
  | "lift";

/** Envuelve un ícono de lucide con su movimiento. Mantiene la API (size, strokeWidth, className, ref…). */
export function animated(Icon: LucideIcon, motion: IconMotion): LucideIcon {
  const motionClass = `mv-icon mv-i-${motion}`;
  const Animated = forwardRef<SVGSVGElement, LucideProps>(function AnimatedIcon({ className, ...props }, ref) {
    return createElement(Icon, { ref, ...props, className: className ? `${motionClass} ${className}` : motionClass });
  });
  Animated.displayName = Icon.displayName;
  return Animated as LucideIcon;
}
// creado por pato dev y askforvini
