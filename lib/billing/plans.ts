/**
 * Precios del lado del servidor. El monto que llega en la URL del checkout se ignora.
 *
 * Hay un solo plan pago: Mercav Pro, que en la base es la clave PROFESSIONAL del enum Plan.
 * EMPRESA y ELITE ya no se venden; quien los tiene conserva acceso Pro hasta su planExpiresAt.
 */
export const PRO_PLAN = "PROFESSIONAL" as const;

export type BillingInterval = "monthly" | "annual";

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Mercav Pro mensual. */
export const PRO_MONTHLY_USD = 9.99;
/** Descuento por pagar el año completo. */
export const ANNUAL_DISCOUNT = 0.2;
/** Lo que equivale por mes pagando anual (7.99). */
export const PRO_ANNUAL_MONTHLY_USD = round2(PRO_MONTHLY_USD * (1 - ANNUAL_DISCOUNT));
/** Lo que se cobra de una vez por el año (95.88 = 7.99 x 12). */
export const PRO_ANNUAL_USD = round2(PRO_ANNUAL_MONTHLY_USD * 12);

/**
 * Precio de lista mensual de cada plan pago. Solo PROFESSIONAL se vende; EMPRESA y ELITE quedan
 * para los reportes de admin de las suscripciones que siguen vigentes.
 */
export const PLAN_MONTHLY_USD: Record<string, number> = {
  PROFESSIONAL: PRO_MONTHLY_USD,
  EMPRESA: 29,
  ELITE: 79,
};

export function billingInterval(value: string | undefined | null): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

/**
 * Monto a cobrar por una compra de plan. Solo Mercav Pro se vende: cualquier otro plan devuelve null
 * (el checkout lo rechaza). Anual cobra el año completo, no el precio por mes.
 */
export function planChargeUsd(plan: string | undefined, interval: string | undefined): number | null {
  if ((plan || "").toUpperCase() !== PRO_PLAN) return null;
  return billingInterval(interval) === "annual" ? PRO_ANNUAL_USD : PRO_MONTHLY_USD;
}

/**
 * Montos que cobraba el checkout antes de Mercav Pro. El "anual" cobraba un solo mes con 20 % de
 * descuento y daba 365 días. Solo sirven para cumplir pagos iniciados antes del cambio (un
 * PaymentIntent puede confirmarse después del deploy); se pueden borrar cuando no queden pendientes.
 */
export const LEGACY_PLAN_CHARGES_USD: Record<string, Record<BillingInterval, number>> = {
  PROFESSIONAL: { monthly: 9.99, annual: 7.99 },
  EMPRESA: { monthly: 29, annual: 23.2 },
  ELITE: { monthly: 79, annual: 63.2 },
};

/**
 * Fin del período pagado: 1 mes o 12 meses de calendario desde `start`. Si el día no existe en el
 * mes de destino (31 de enero + 1 mes), queda el último día de ese mes.
 */
export function planPeriodEnd(start: Date, interval: BillingInterval): Date {
  const months = interval === "annual" ? 12 : 1;
  const end = new Date(start.getTime());
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
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

/** Cualquier plan pago vigente cuenta como Mercav Pro (también EMPRESA y ELITE hasta que venzan). */
export function isProPlan(plan: string | null | undefined): boolean {
  return !!plan && plan !== "FREE";
}

/** Nombre visible del plan: "Gratis" o "Mercav Pro". */
export function planDisplayName(plan: string | null | undefined): string {
  return isProPlan(plan) ? "Mercav Pro" : "Gratis";
}
// creado por pato dev y askforvini
