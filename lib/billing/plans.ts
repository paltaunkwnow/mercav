/** Server-side plan prices. The checkout URL amount is ignored. */
export const PLAN_MONTHLY_USD: Record<string, number> = {
  PROFESSIONAL: 9.99,
  EMPRESA: 29,
  ELITE: 79,
};

export function planChargeUsd(plan: string | undefined, interval: string | undefined): number | null {
  const monthly = PLAN_MONTHLY_USD[(plan || "").toUpperCase()];
  if (!monthly) return null;
  if (interval === "annual") return Math.round(monthly * 0.8 * 100) / 100;
  return monthly;
}
/**
 * Plan vigente: un plan pago con planExpiresAt vencido vale como FREE.
 * (Nada degradaba el plan al vencer, así que los planes pagos no expiraban nunca.)
 * planExpiresAt null = sin vencimiento (p. ej. cortesía de admin sin duración).
 */
export function effectivePlan<P extends string>(plan: P, planExpiresAt: Date | null | undefined, now = new Date()): P | "FREE" {
  if (plan !== "FREE" && planExpiresAt && planExpiresAt.getTime() < now.getTime()) return "FREE";
  return plan;
}
// creado por pato dev y askforvini
