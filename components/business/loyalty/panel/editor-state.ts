import { businessTemplate, defaultDesign, defaultRules } from "@/lib/business/loyalty/templates";
import type { LoyaltyDesign, LoyaltyProgramView, LoyaltyRules, LoyaltyTypeKey } from "@/lib/business/loyalty/types";

/** Estado del editor de programas (asistente y ajustes). Puro: sin React ni servidor. */

export type RewardDraft = { key: string; id?: string; name: string; cost: number; description: string; active: boolean };

export type ProgramDraft = {
  businessType: string;
  name: string;
  type: LoyaltyTypeKey;
  rules: LoyaltyRules;
  design: LoyaltyDesign;
  rewards: RewardDraft[];
};

export const MAX_REWARDS = 12;
export const MAX_TIERS = 5;
export const MAX_BENEFITS = 4;
export const EXPIRY_PRESETS = [30, 60, 90, 180, 365] as const;

let seq = 0;
/** Clave local para las listas (no se guarda). */
export const newKey = () => `k${++seq}`;

/** Borrador a partir de un rubro. Conserva el nombre de la tarjeta y el logo si ya estaban. */
export function draftFromTemplate(key: string, workspaceName: string, prev?: ProgramDraft): ProgramDraft {
  const t = businessTemplate(key);
  const design = defaultDesign(t, prev?.design.displayName || workspaceName);
  return {
    businessType: t.key,
    name: t.programName,
    type: t.type,
    rules: defaultRules(t),
    design: { ...design, logoDataUrl: prev?.design.logoDataUrl ?? null, subtitle: prev?.design.subtitle || design.subtitle, backTitle: prev?.design.backTitle || design.backTitle },
    rewards: [{ key: newKey(), name: t.rewardName, cost: t.goal, description: "", active: true }],
  };
}

export function draftFromProgram(p: LoyaltyProgramView): ProgramDraft {
  return {
    businessType: p.businessType,
    name: p.name,
    type: p.type,
    rules: { ...p.rules, tiers: p.rules.tiers.map((t) => ({ ...t })) },
    design: { ...p.design, benefits: [...p.design.benefits] },
    rewards: p.rewards.map((r) => ({ key: newKey(), id: r.id, name: r.name, cost: r.cost, description: r.description ?? "", active: r.active })),
  };
}

/** Lo que se manda a la API. */
export function draftPayload(d: ProgramDraft) {
  return {
    businessType: d.businessType,
    name: d.name.trim(),
    type: d.type,
    rules: { ...d.rules, tiers: d.rules.tiers.map((t) => ({ name: t.name.trim(), minLifetime: t.minLifetime, perk: t.perk.trim() })) },
    design: {
      ...d.design,
      base: d.design.palette === "custom" ? d.design.base : null,
      accent: d.design.palette === "custom" ? d.design.accent : null,
      displayName: d.design.displayName.trim(),
      subtitle: d.design.subtitle.trim(),
      backTitle: d.design.backTitle.trim(),
    },
    rewards: d.rewards.map((r) => ({ ...(r.id ? { id: r.id } : {}), name: r.name.trim(), cost: r.cost, description: r.description.trim() || null, active: r.active })),
  };
}

/** Cambiar entre sellos y puntos: ajusta topes y el costo del premio principal a algo razonable. */
export function switchType(d: ProgramDraft, type: LoyaltyTypeKey): ProgramDraft {
  if (d.type === type) return d;
  const t = businessTemplate(d.businessType);
  const defaults = defaultRules({ ...t, type, goal: type === "STAMPS" ? d.rules.stampsGoal : 100 });
  const rules: LoyaltyRules = {
    ...d.rules,
    maxPerAction: defaults.maxPerAction,
    maxPerDay: defaults.maxPerDay,
    cooldownMinutes: defaults.cooldownMinutes,
    birthdayBonus: defaults.birthdayBonus,
    referralBonus: defaults.referralBonus,
    welcomeBonus: 0,
    selfService: type === "STAMPS" ? d.rules.selfService : false,
    tiers: [],
  };
  const rewards = d.rewards.map((r, i) => (i === 0 ? { ...r, cost: type === "STAMPS" ? rules.stampsGoal : 100 } : r));
  return { ...d, type, rules, rewards };
}

/** Cambiar la meta de sellos: si el premio principal costaba la meta, lo acompaña. */
export function setStampsGoal(d: ProgramDraft, goal: number): ProgramDraft {
  const linked = d.rewards[0] && d.rewards[0].cost === d.rules.stampsGoal;
  return {
    ...d,
    rules: { ...d.rules, stampsGoal: goal },
    rewards: linked ? d.rewards.map((r, i) => (i === 0 ? { ...r, cost: goal } : r)) : d.rewards,
  };
}

export const STEPS = [
  { key: "rubro", label: "Rubro" },
  { key: "programa", label: "Programa" },
  { key: "diseno", label: "Diseño" },
  { key: "extras", label: "Extras" },
] as const;

/** Qué falta en cada paso (null = listo). */
export function validateStep(step: number, d: ProgramDraft): string | null {
  if (step === 0) return d.businessType ? null : "Elegí un rubro.";
  if (step === 1) {
    if (d.name.trim().length < 2) return "Poné un nombre al programa.";
    if (!d.rewards.length) return "Agregá al menos un premio.";
    if (d.rewards.some((r) => !r.name.trim())) return "Cada premio necesita un nombre.";
    if (d.rewards.some((r) => !Number.isInteger(r.cost) || r.cost < 1)) return "El costo de cada premio tiene que ser 1 o más.";
    if (!d.rewards.some((r) => r.active)) return "Dejá al menos un premio activo.";
    return null;
  }
  if (step === 2) {
    if (!d.design.displayName.trim()) return "Poné el nombre que va en la tarjeta.";
    if (d.design.palette === "custom" && (!d.design.base || !d.design.accent)) return "Elegí los dos colores de tu paleta.";
    if (!d.design.benefits.length) return "Elegí al menos un beneficio.";
    return null;
  }
  if (step === 3) {
    const r = d.rules;
    if (r.maxPerDay < r.maxPerAction) return "El tope por día no puede ser menor que el tope por vez.";
    if (r.tiers.some((t) => !t.name.trim())) return "Cada nivel necesita un nombre.";
    const names = r.tiers.map((t) => t.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return "Hay dos niveles con el mismo nombre.";
    const mins = r.tiers.map((t) => t.minLifetime);
    if (new Set(mins).size !== mins.length) return "Dos niveles no pueden pedir el mismo mínimo.";
    return null;
  }
  return null;
}

export function validateAll(d: ProgramDraft) {
  for (let i = 0; i < STEPS.length; i++) {
    const error = validateStep(i, d);
    if (error) return { step: i, error };
  }
  return null;
}
// creado por pato dev y askforvini
