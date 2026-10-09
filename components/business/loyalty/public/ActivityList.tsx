import { Cake, Gift, Hourglass, PartyPopper, Plus, Settings2, Sparkles, UserPlus } from "@/components/icons";
import type { LoyaltyEventView, LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { cn } from "@/lib/utils";
import { eventText, whenText } from "./format";

const ICONS: Record<LoyaltyEventView["type"], typeof Plus> = {
  JOIN: PartyPopper,
  WELCOME: Sparkles,
  STAMP: Plus,
  POINTS: Plus,
  REDEEM: Gift,
  ADJUST: Settings2,
  EXPIRE: Hourglass,
  BIRTHDAY: Cake,
  REFERRAL: UserPlus,
};

/** Últimos movimientos de una tarjeta, en palabras. Sin estado (sirve en servidor y en cliente). */
export function ActivityList({
  events,
  type,
  timeZone,
  voice = "customer",
  now,
  compact = false,
}: {
  events: LoyaltyEventView[];
  type: LoyaltyTypeKey;
  timeZone: string;
  voice?: "customer" | "staff";
  now?: Date;
  compact?: boolean;
}) {
  if (!events.length) return <p className="text-sm text-[var(--text-secondary)]">Todavía no hay movimientos.</p>;
  const at = now ?? new Date();
  return (
    <ol className="flex flex-col divide-y divide-[var(--mv-hairline)]">
      {events.map((e) => {
        const text = eventText(e, type, voice);
        const Icon = ICONS[e.type] ?? Plus;
        return (
          <li key={e.id} className={cn("flex items-center gap-3", compact ? "py-2" : "py-3")}>
            <span
              className={cn(
                "grid shrink-0 place-items-center rounded-full",
                compact ? "h-8 w-8" : "h-9 w-9",
                text.tone === "plus" ? "bg-[var(--mv-gold-wash)] text-gold" : "bg-[var(--mv-panel-hover)] text-[var(--text-secondary)]",
              )}
              aria-hidden
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{text.title}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                <time dateTime={e.createdAt}>{whenText(e.createdAt, timeZone, at)}</time>
                {text.delta && (e.type === "STAMP" || e.type === "POINTS") ? ` · ${text.delta}` : null}
              </p>
            </div>
            {text.delta && e.type !== "STAMP" && e.type !== "POINTS" ? (
              <span className={cn("shrink-0 text-sm font-semibold tabular-nums", text.tone === "minus" ? "text-[var(--text-secondary)]" : "text-gold")}>{text.delta}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
// creado por pato dev y askforvini
