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
// creado por Patodev y Invertilo
