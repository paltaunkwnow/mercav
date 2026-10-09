import { Check, Gift } from "@/components/icons";
import { BENEFITS } from "@/lib/business/loyalty/templates";
import type { BenefitKey, LoyaltyTypeKey, RewardView } from "@/lib/business/loyalty/types";
import { LoyaltyIcon } from "@/components/business/loyalty/icons";
import { cn } from "@/lib/utils";
import { units } from "./format";

/*
 * Premios y beneficios del club. Sin estado: sirven en la página de alta (servidor) y en la tarjeta en vivo (cliente).
 */

/** Lista de premios. Con `balance`, marca los que ya se pueden canjear y cuánto falta para el resto. */
export function RewardsList({ rewards, type, balance }: { rewards: RewardView[]; type: LoyaltyTypeKey; balance?: number }) {
  const list = rewards.filter((r) => r.active).sort((a, b) => a.cost - b.cost);
  if (!list.length) return null;
  return (
    <ul className="flex flex-col gap-2">
      {list.map((r) => {
        const ready = balance !== undefined && balance >= r.cost;
        const missing = balance !== undefined ? Math.max(0, r.cost - balance) : null;
        return (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3.5 transition-colors",
              ready ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]" : "border-[var(--mv-hairline)] bg-[var(--mv-panel)]",
            )}
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                ready ? "bg-gold text-[var(--mv-on-gold)]" : "bg-[var(--mv-gold-wash)] text-gold",
              )}
              aria-hidden
            >
              {ready ? <Check className="h-5 w-5" strokeWidth={2.4} /> : <Gift className="h-5 w-5" strokeWidth={1.8} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{r.name}</p>
              {r.description ? <p className="line-clamp-2 text-[13px] leading-snug text-[var(--text-secondary)]">{r.description}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              {ready ? (
                <span className="mv-chip mv-chip-gold">¡Listo para canjear!</span>
              ) : missing !== null ? (
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                  {missing === 1 ? "Falta" : "Faltan"} <span className="font-semibold tabular-nums text-[var(--text-primary)]">{units(type, missing)}</span>
                </span>
              ) : (
                <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{units(type, r.cost)}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BenefitChips({ benefits }: { benefits: BenefitKey[] }) {
  if (!benefits.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Beneficios del club">
      {benefits.map((b) => (
        <li key={b} className="mv-chip h-9 gap-2 px-3.5 text-[13px] text-[var(--text-primary)]">
          <LoyaltyIcon name={b} className="h-4 w-4 text-gold" />
          {BENEFITS[b]?.label ?? b}
        </li>
      ))}
    </ul>
  );
}
// creado por pato dev y askforvini
