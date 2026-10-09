"use client";

import { useReducedMotion } from "framer-motion";
import { LoyaltyCard, type LoyaltyCardProps } from "@/components/business/loyalty/LoyaltyCard";
import { cn } from "@/lib/utils";

type Props = Omit<LoyaltyCardProps, "side" | "className"> & {
  /** false = reverso (sellos o puntos), true = frente (logo y nombre). */
  showFront: boolean;
  onToggle: () => void;
  className?: string;
};

const DURATION = 650;

/**
 * Tarjeta que se da vuelta al tocarla y arranca mostrando el reverso (lo que el cliente quiere ver:
 * sus sellos). Compone las dos caras de LoyaltyCard; el cambio de cara se controla desde afuera
 * para poder volver al reverso cuando entra un sello nuevo.
 */
export function CardFlip({ showFront, onToggle, className, ...card }: Props) {
  const reduce = useReducedMotion();
  const swap = reduce ? "none" : `visibility 0s linear ${DURATION / 2}ms`;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={showFront}
      aria-label={showFront ? "Frente de tu tarjeta. Tocá para ver tus sellos." : "Reverso de tu tarjeta. Tocá para ver el frente."}
      className={cn("mv-focus relative mx-auto block w-full max-w-[26rem] rounded-[1.4rem] [perspective:1400px] [-webkit-tap-highlight-color:transparent]", className)}
    >
      <div
        className="grid"
        style={{
          transformStyle: "preserve-3d",
          transform: showFront ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: reduce ? "none" : `transform ${DURATION}ms cubic-bezier(0.23, 1, 0.32, 1)`,
        }}
      >
        <div
          className="[grid-area:1/1]"
          aria-hidden={showFront}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", visibility: showFront ? "hidden" : "visible", transition: swap }}
        >
          <LoyaltyCard {...card} side="back" size="lg" className="mx-auto" />
        </div>
        <div
          className="[grid-area:1/1]"
          aria-hidden={!showFront}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            visibility: showFront ? "visible" : "hidden",
            transition: swap,
          }}
        >
          <LoyaltyCard {...card} side="front" size="lg" className="mx-auto" />
        </div>
      </div>
    </button>
  );
}
// creado por pato dev y askforvini
