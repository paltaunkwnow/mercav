import { isProPlan } from "./billing/plans";

/** Qué pide cada herramienta: FREE = cualquier cuenta, PRO = Mercav Pro (cualquier plan pago vigente). */
export type ToolTier = "FREE" | "PRO";

export const TOOL_TIERS: Record<string, ToolTier> = {
  "roi-calculator": "FREE",
  "contract-generator": "PRO",
  "seo-analyzer": "PRO",
  "price-simulator": "PRO",
  "palette-generator": "FREE",
  "prompt-generator": "PRO",
  "holiday-calendar": "FREE",
};

const PAID_PLANS = ["PROFESSIONAL", "EMPRESA", "ELITE"];
const ALL_PLANS = ["FREE", ...PAID_PLANS];

/**
 * Claves del enum Plan que abren cada herramienta, derivadas de TOOL_TIERS. EMPRESA y ELITE ya no se
 * venden pero cuentan como Pro hasta que venzan. Se mantiene para quien compara con `includes(plan)`.
 */
export const TOOL_REQUIREMENTS: Record<string, Array<string>> = Object.fromEntries(
  Object.entries(TOOL_TIERS).map(([id, tier]) => [id, tier === "FREE" ? ALL_PLANS : PAID_PLANS]),
);

/** Herramienta sin entrada en el catálogo: abierta para todos, como antes. */
export function toolTier(toolName: string): ToolTier {
  return TOOL_TIERS[toolName] ?? "FREE";
}

/** `plan` tiene que ser el plan vigente (effectivePlan). */
export function toolAllowedForPlan(toolName: string, plan: string): boolean {
  return toolTier(toolName) === "FREE" || isProPlan(plan);
}

/** Nombre del plan que abre la herramienta: "Gratis" o "Mercav Pro". */
export function toolPlanLabel(toolName: string) {
  return toolTier(toolName) === "FREE" ? "Gratis" : "Mercav Pro";
}
// creado por pato dev y askforvini
