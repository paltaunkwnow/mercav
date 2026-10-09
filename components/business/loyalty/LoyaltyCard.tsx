"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { Gift } from "@/components/icons";
import { BENEFITS, resolvePalette } from "@/lib/business/loyalty/templates";
import type { LoyaltyDesign, LoyaltyTypeKey, ResolvedPalette } from "@/lib/business/loyalty/types";
import { cn } from "@/lib/utils";
import { LoyaltyIcon } from "./icons";

/*
 * Tarjeta de fidelización con la marca del negocio (frente y reverso), al estilo de una tarjeta
 * metálica negra con brillo dorado. Todo se mide en unidades del contenedor (cqw), así se ve igual
 * de chica en una lista que grande en la tarjeta web.
 */

export type LoyaltyCardProps = {
  design: LoyaltyDesign;
  type: LoyaltyTypeKey;
  stampsGoal: number;
  rewardName?: string | null;
  balance?: number;
  customerName?: string | null;
  /** POINTS: costo del próximo premio, para la barra de progreso. */
  pointsGoal?: number | null;
  side?: "front" | "back" | "flip";
  size?: "sm" | "md" | "lg";
  className?: string;
};

// container-type no tiene ancho propio: el mínimo evita que la tarjeta colapse en contenedores que se ajustan al contenido.
const SIZES = { sm: "max-w-[17rem] min-w-[12rem]", md: "max-w-[24rem] min-w-[15rem]", lg: "max-w-[30rem] min-w-[16rem]" } as const;

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function surface(p: ResolvedPalette): CSSProperties {
  // Brillo dorado en diagonal sobre la base, como en una tarjeta metálica.
  return {
    backgroundColor: p.base,
    backgroundImage: [
      `radial-gradient(120% 150% at 108% -10%, ${hexToRgba(p.accent, p.light ? 0.38 : 0.55)} 0%, ${hexToRgba(p.accent, 0.18)} 32%, transparent 58%)`,
      `linear-gradient(118deg, transparent 38%, ${hexToRgba(p.accent, p.light ? 0.16 : 0.22)} 62%, ${hexToRgba(p.accent, p.light ? 0.06 : 0.1)} 74%, transparent 88%)`,
      `linear-gradient(180deg, ${hexToRgba("#ffffff", p.light ? 0.25 : 0.04)} 0%, transparent 40%)`,
    ].join(", "),
    color: p.text,
  };
}

function nameSize(name: string) {
  if (name.length > 22) return "text-[4.4cqw]";
  if (name.length > 14) return "text-[5.6cqw]";
  return "text-[7.2cqw]";
}

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [title, ""];
  const mid = Math.ceil(words.length / 2) - (words.length > 2 ? 1 : 0);
  return [words.slice(0, Math.max(1, mid)).join(" "), words.slice(Math.max(1, mid)).join(" ")];
}

function Face({ children, palette, back, flipped }: { children: ReactNode; palette: ResolvedPalette; back?: boolean; flipped?: boolean }) {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden rounded-[5cqw] ring-1", palette.light ? "ring-black/10" : "ring-white/10")}
      style={{
        ...surface(palette),
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
      aria-hidden={flipped === undefined ? undefined : back ? !flipped : flipped}
    >
      {children}
    </div>
  );
}

function Front({ design, palette, customerName }: { design: LoyaltyDesign; palette: ResolvedPalette; customerName?: string | null }) {
  return (
    <div className="flex h-full flex-col px-[7.5cqw] pb-[6.5cqw] pt-[8cqw]">
      <div className="h-[17cqw]" style={{ color: palette.accent }}>
        {design.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.logoDataUrl} alt="" className="h-full max-w-[42cqw] object-contain object-left" />
        ) : (
          <LoyaltyIcon name={design.icon} className="h-full w-auto" strokeWidth={1.4} />
        )}
      </div>
      <div className="mt-[4cqw] min-w-0">
        <p className={cn("truncate font-display font-medium uppercase leading-none tracking-[0.28em]", nameSize(design.displayName))} style={{ color: palette.accent }}>
          {design.displayName}
        </p>
        <p className="mt-[2.6cqw] truncate text-[2.7cqw] uppercase tracking-[0.42em]" style={{ color: palette.text }}>
          {design.subtitle}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-[3cqw]">
        <div className="flex items-stretch gap-[2.2cqw]">
          <span className="w-[0.35cqw] rounded-full" style={{ backgroundColor: palette.text, opacity: 0.7 }} />
          <div className="leading-none">
            <p className="text-[2cqw] uppercase tracking-[0.34em]" style={{ color: palette.muted }}>
              Powered by
            </p>
            <p className="mt-[1.2cqw] text-[2.9cqw] font-semibold uppercase tracking-[0.3em]" style={{ color: palette.accent }}>
              mercav.lat
            </p>
          </div>
        </div>
        {customerName ? (
          <p className="max-w-[40cqw] truncate text-[2.6cqw] uppercase tracking-[0.24em]" style={{ color: palette.text }}>
            {customerName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Stamps({ goal, balance, design, palette, celebrate }: { goal: number; balance: number; design: LoyaltyDesign; palette: ResolvedPalette; celebrate: boolean }) {
  const rows = Math.ceil(goal / 8);
  const perRow = Math.ceil(goal / rows);
  // Con más filas, círculos más chicos para que no toquen los beneficios.
  const cell = rows === 1 ? 13.5 : rows === 2 ? 10 : 7.6;
  return (
    <div
      className={cn("grid w-full", rows === 1 ? "gap-x-[2.4cqw]" : "gap-x-[1.8cqw] gap-y-[1.4cqw]")}
      style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`, maxWidth: `${perRow * cell}cqw` }}
    >
      {Array.from({ length: goal }, (_, i) => {
        const isReward = i === goal - 1;
        const filled = i < balance;
        const rewardReady = isReward && balance >= goal;
        return (
          <span
            key={i}
            className={cn(
              "relative grid aspect-square place-items-center rounded-full",
              rewardReady && celebrate && "motion-safe:animate-pulse",
            )}
            style={{
              backgroundColor: isReward || filled ? palette.accent : "transparent",
              border: `0.42cqw solid ${palette.accent}`,
              color: palette.base,
              opacity: isReward && !rewardReady ? 0.92 : 1,
              boxShadow: rewardReady ? `0 0 0 0.9cqw ${hexToRgba(palette.accent, 0.25)}` : undefined,
            }}
          >
            {isReward ? (
              <Gift className="h-[48%] w-[48%]" strokeWidth={1.7} aria-hidden />
            ) : filled ? (
              <LoyaltyIcon name={design.icon} className="h-[46%] w-[46%]" strokeWidth={1.8} />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function Points({ balance, goal, rewardName, palette }: { balance: number; goal: number | null; rewardName: string | null; palette: ResolvedPalette }) {
  const percent = goal ? Math.min(100, Math.round((balance / goal) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex items-baseline gap-[2cqw]">
        <span className="font-display text-[10cqw] font-semibold leading-none tabular-nums" style={{ color: palette.accent }}>
          {balance.toLocaleString("es")}
        </span>
        <span className="text-[2.6cqw] uppercase tracking-[0.34em]" style={{ color: palette.text }}>
          {balance === 1 ? "punto" : "puntos"}
        </span>
      </div>
      {goal ? (
        <>
          <div className="mt-[2.4cqw] h-[1.4cqw] w-full overflow-hidden rounded-full" style={{ backgroundColor: hexToRgba(palette.accent, 0.18) }}>
            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: palette.accent }} />
          </div>
          {rewardName ? (
            <p className="mt-[1.8cqw] truncate text-[2.4cqw] uppercase tracking-[0.24em]" style={{ color: palette.muted }}>
              {balance >= goal ? `${rewardName} disponible` : `${goal - balance} para ${rewardName}`}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Back(props: { design: LoyaltyDesign; palette: ResolvedPalette; type: LoyaltyTypeKey; stampsGoal: number; balance: number; rewardName: string | null; pointsGoal: number | null; celebrate: boolean }) {
  const { design, palette } = props;
  const [l1, l2] = splitTitle(design.backTitle);
  return (
    <div className="flex h-full flex-col px-[6.5cqw] pb-[5.5cqw] pt-[7cqw]">
      <div className="flex items-start justify-between gap-[4cqw]">
        <p className="text-[3.1cqw] font-medium uppercase leading-[1.55] tracking-[0.38em]" style={{ color: palette.text }}>
          {l1}
          {l2 ? <br /> : null}
          {l2}
        </p>
        <div className="flex shrink-0 flex-col items-end gap-[1.6cqw] pt-[0.4cqw]">
          <span className="h-[0.3cqw] w-[7cqw] rounded-full" style={{ backgroundColor: palette.text, opacity: 0.8 }} />
          <span className="text-[2.2cqw] uppercase tracking-[0.3em]" style={{ color: palette.text }}>
            mercav.lat
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-center">
        {props.type === "STAMPS" ? (
          <Stamps goal={props.stampsGoal} balance={props.balance} design={design} palette={palette} celebrate={props.celebrate} />
        ) : (
          <Points balance={props.balance} goal={props.pointsGoal} rewardName={props.rewardName} palette={palette} />
        )}
      </div>
      <ul className="grid grid-cols-4">
        {design.benefits.slice(0, 4).map((b, i) => (
          <li
            key={b}
            className="flex flex-col items-center gap-[1.6cqw]"
            style={i > 0 ? { borderLeft: `0.2cqw solid ${hexToRgba(palette.text, 0.22)}` } : undefined}
          >
            <span style={{ color: palette.accent }}>
              <LoyaltyIcon name={b} className="h-[4.6cqw] w-[4.6cqw]" strokeWidth={1.5} />
            </span>
            <span className="max-w-full truncate px-[0.6cqw] text-[1.85cqw] uppercase tracking-[0.2em]" style={{ color: palette.text }}>
              {BENEFITS[b].label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LoyaltyCard({
  design,
  type,
  stampsGoal,
  rewardName = null,
  balance = 0,
  customerName = null,
  pointsGoal = null,
  side = "flip",
  size = "md",
  className,
}: LoyaltyCardProps) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(side === "back");
  const palette = resolvePalette(design);
  const goal = Math.max(2, Math.min(30, stampsGoal));
  const shown = Math.max(0, balance);

  const summary =
    type === "STAMPS"
      ? `Tarjeta de ${design.displayName}: ${Math.min(shown, goal)} de ${goal} sellos${rewardName ? ` para ${rewardName}` : ""}.`
      : `Tarjeta de ${design.displayName}: ${shown} puntos${rewardName && pointsGoal ? `, ${Math.max(0, pointsGoal - shown)} para ${rewardName}` : ""}.`;

  const backProps = { design, palette, type, stampsGoal: goal, balance: shown, rewardName, pointsGoal, celebrate: !reduce };

  const frame = cn("relative w-full", SIZES[size], className);
  const shadow = palette.light ? "drop-shadow-[0_18px_30px_rgba(26,23,20,0.18)]" : "drop-shadow-[0_22px_40px_rgba(0,0,0,0.55)]";

  if (side !== "flip") {
    return (
      <div className={frame} style={{ containerType: "inline-size" }} role="img" aria-label={summary}>
        <div className={cn("relative aspect-[1.586] w-full", shadow)}>
          <Face palette={palette}>
            {side === "front" ? <Front design={design} palette={palette} customerName={customerName} /> : <Back {...backProps} />}
          </Face>
        </div>
      </div>
    );
  }

  return (
    <div className={frame} style={{ containerType: "inline-size" }}>
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={`${summary} Tocá para ver el ${flipped ? "frente" : "reverso"}.`}
        className={cn("mv-focus relative block aspect-[1.586] w-full rounded-[5cqw] [perspective:1400px]", shadow)}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: reduce ? "none" : "transform 650ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <Face palette={palette} flipped={flipped}>
            <Front design={design} palette={palette} customerName={customerName} />
          </Face>
          <Face palette={palette} back flipped={flipped}>
            <Back {...backProps} />
          </Face>
        </div>
      </button>
    </div>
  );
}
// creado por pato dev y askforvini
