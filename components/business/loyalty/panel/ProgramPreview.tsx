"use client";

import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { rewardLine } from "@/lib/business/loyalty/stats-core";
import { cn } from "@/lib/utils";
import type { ProgramDraft } from "./editor-state";

/** Vista previa en vivo de la tarjeta mientras se edita el programa. */
export function ProgramPreview({ draft, className }: { draft: ProgramDraft; className?: string }) {
  const active = draft.rewards.filter((r) => r.active && r.name.trim()).sort((a, b) => a.cost - b.cost);
  const main = draft.rewards[0]?.active && draft.rewards[0].name.trim() ? draft.rewards[0] : active[0] ?? null;
  const pointsGoal = draft.type === "POINTS" ? active[0]?.cost ?? 100 : null;
  const balance = draft.type === "STAMPS" ? Math.max(1, Math.min(3, draft.rules.stampsGoal - 1)) : Math.round((pointsGoal ?? 100) * 0.4);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--text-tertiary)]">Vista previa</p>
        <p className="text-xs text-[var(--text-tertiary)]">Tocá la tarjeta para darla vuelta</p>
      </div>
      <LoyaltyCard
        design={draft.design}
        type={draft.type}
        stampsGoal={draft.rules.stampsGoal}
        rewardName={main?.name ?? null}
        balance={balance}
        pointsGoal={pointsGoal}
        customerName="Tu cliente"
        side="flip"
        size="md"
        className="w-full"
      />
      <p className="text-sm text-[var(--text-secondary)]">{rewardLine(draft.type, draft.rules.stampsGoal, main?.name)}</p>
    </div>
  );
}
// creado por pato dev y askforvini
