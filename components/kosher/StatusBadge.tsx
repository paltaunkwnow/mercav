import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { BadgeCheck, CircleHelp, CircleSlash, MessageCircleWarning, Scale, ShieldCheck } from "lucide-react";
import { STATUS, isFoodPlace, placeTone } from "@/lib/kosher/labels";
import { cn } from "@/lib/utils";

const ICONS = {
  certified: BadgeCheck,
  community_report: MessageCircleWarning,
  unknown: CircleHelp,
  disputed: Scale,
  closed: CircleSlash,
} as const;

const TONE_CLASS = {
  seal: "bg-[var(--mv-gold-wash)] text-gold ring-gold/30",
  reported: "bg-techelet-dim text-techelet ring-techelet/30",
  danger: "bg-red-500/10 text-red-500 ring-red-500/25 [.light_&]:text-red-700",
  muted: "bg-[var(--mv-panel)] text-[var(--text-secondary)] ring-[var(--mv-hairline-strong)]",
} as const;

/** Status always pairs an icon with a word, never color alone. */
export function StatusBadge({
  status,
  type,
  verified = false,
  className,
}: {
  status: KosherStatus;
  type: KosherPlaceType;
  verified?: boolean;
  className?: string;
}) {
  const institution = !isFoodPlace(type) && status !== "closed" && status !== "disputed";
  const Icon = institution ? (verified ? ShieldCheck : CircleHelp) : ICONS[status];
  const label = institution ? (verified ? "Fuente verificada" : "Sin fuente") : STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
        TONE_CLASS[institution && !verified ? "muted" : placeTone(type, status)],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const full = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} aria-hidden>
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.8z"
            className="text-gold"
            fill={full >= i ? "currentColor" : full >= i - 0.5 ? `url(#half-${i})` : "transparent"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}
