import type { LoyaltyRules } from "./types";
import { tierFor } from "./engine";

/** A quién va un mensaje del negocio. Se evalúa al enviar (para contar) y al mostrar la tarjeta. */
export type CampaignAudience =
  | { kind: "all" }
  | { kind: "atRisk"; days: number }
  | { kind: "rewardReady" }
  | { kind: "tier"; tier: string }
  | { kind: "birthdayMonth" };

export type AudienceCard = { balance: number; lifetime: number; lastVisitAt: Date | null; createdAt: Date; birthday: string | null; marketingConsent: boolean };

export function normalizeAudience(raw: unknown): CampaignAudience {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  switch (a.kind) {
    case "atRisk":
      return { kind: "atRisk", days: Math.min(365, Math.max(7, Math.round(Number(a.days) || 30))) };
    case "rewardReady":
      return { kind: "rewardReady" };
    case "tier":
      return typeof a.tier === "string" && a.tier ? { kind: "tier", tier: a.tier.slice(0, 30) } : { kind: "all" };
    case "birthdayMonth":
      return { kind: "birthdayMonth" };
    default:
      return { kind: "all" };
  }
}

/** Los mensajes solo llegan a quien aceptó recibirlos. */
export function matchesAudience(audience: CampaignAudience, card: AudienceCard, ctx: { rules: LoyaltyRules; minRewardCost: number | null; now: Date }) {
  if (!card.marketingConsent) return false;
  switch (audience.kind) {
    case "all":
      return true;
    case "atRisk": {
      const last = card.lastVisitAt ?? card.createdAt;
      return ctx.now.getTime() - last.getTime() >= audience.days * 86_400_000;
    }
    case "rewardReady":
      return ctx.minRewardCost !== null && card.balance >= ctx.minRewardCost;
    case "tier":
      return tierFor(card.lifetime, ctx.rules.tiers).current?.name === audience.tier;
    case "birthdayMonth":
      return !!card.birthday && card.birthday.slice(0, 2) === String(ctx.now.getUTCMonth() + 1).padStart(2, "0");
  }
}

export const AUDIENCE_LABELS: Record<CampaignAudience["kind"], string> = {
  all: "Todos los clientes",
  atRisk: "Clientes que no vienen hace un tiempo",
  rewardReady: "Clientes con un premio para canjear",
  tier: "Un nivel",
  birthdayMonth: "Cumpleañeros del mes",
};
// creado por pato dev y askforvini
