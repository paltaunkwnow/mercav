import { BENEFIT_KEYS, ICON_KEYS, PALETTES, businessTemplate, defaultDesign, defaultRules } from "./templates";
import type { LoyaltyDesign, LoyaltyRules, LoyaltyTier, LoyaltyTypeKey, ProgressView, RewardView, TierView } from "./types";

/*
 * Motor de Fidelización. Funciones puras: reciben el estado y devuelven qué hacer.
 * La escritura en la base (con bloqueo de la tarjeta) vive en service.ts.
 */

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

/** Reglas válidas a partir de lo que venga de la base o del formulario. */
export function normalizeRules(raw: unknown, businessType: string): LoyaltyRules {
  const base = defaultRules(businessTemplate(businessType));
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof LoyaltyRules, unknown>>;
  const tiers: LoyaltyTier[] = Array.isArray(r.tiers)
    ? (r.tiers as unknown[])
        .map((t) => (t && typeof t === "object" ? (t as Record<string, unknown>) : null))
        .filter((t): t is Record<string, unknown> => !!t && typeof t.name === "string" && t.name.trim().length > 0)
        .slice(0, 5)
        .map((t) => ({ name: String(t.name).trim().slice(0, 30), minLifetime: clampInt(t.minLifetime, 1, 1_000_000, 1), perk: String(t.perk ?? "").trim().slice(0, 80) }))
        .sort((a, b) => a.minLifetime - b.minLifetime)
    : base.tiers;
  const expires = r.expiresDays === null || r.expiresDays === "" ? null : r.expiresDays === undefined ? base.expiresDays : clampInt(r.expiresDays, 7, 3650, 365);
  return {
    stampsGoal: clampInt(r.stampsGoal, 2, 30, base.stampsGoal),
    maxPerAction: clampInt(r.maxPerAction, 1, 100_000, base.maxPerAction),
    maxPerDay: clampInt(r.maxPerDay, 1, 1_000_000, base.maxPerDay),
    cooldownMinutes: clampInt(r.cooldownMinutes, 0, 24 * 60, base.cooldownMinutes),
    pointsPerUnit: clampInt(r.pointsPerUnit, 1, 1000, base.pointsPerUnit),
    unitAmount: clampInt(r.unitAmount, 1, 1_000_000, base.unitAmount),
    expiresDays: expires,
    welcomeBonus: clampInt(r.welcomeBonus, 0, 10_000, base.welcomeBonus),
    birthdayBonus: clampInt(r.birthdayBonus, 0, 10_000, base.birthdayBonus),
    referralBonus: clampInt(r.referralBonus, 0, 10_000, base.referralBonus),
    selfService: typeof r.selfService === "boolean" ? r.selfService : base.selfService,
    selfServiceMaxPerDay: clampInt(r.selfServiceMaxPerDay, 1, 10, base.selfServiceMaxPerDay),
    tiers,
  };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const DATA_URL = /^data:image\/(png|webp|jpeg|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
export const MAX_LOGO_BYTES = 200_000;

/** Diseño válido. El logo solo se acepta como data URL de imagen chica. */
export function normalizeDesign(raw: unknown, businessType: string, fallbackName: string): LoyaltyDesign {
  const base = defaultDesign(businessTemplate(businessType), fallbackName);
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof LoyaltyDesign, unknown>>;
  const palette = typeof d.palette === "string" && (d.palette === "custom" || d.palette in PALETTES) ? (d.palette as LoyaltyDesign["palette"]) : base.palette;
  const text = (v: unknown, max: number, fallback: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback);
  const logo = typeof d.logoDataUrl === "string" && DATA_URL.test(d.logoDataUrl) && d.logoDataUrl.length <= MAX_LOGO_BYTES * 1.37 ? d.logoDataUrl : null;
  const benefits = Array.isArray(d.benefits)
    ? Array.from(new Set((d.benefits as unknown[]).filter((b): b is LoyaltyDesign["benefits"][number] => BENEFIT_KEYS.includes(b as never)))).slice(0, 4)
    : base.benefits;
  return {
    palette,
    base: palette === "custom" && typeof d.base === "string" && HEX.test(d.base) ? d.base : null,
    accent: palette === "custom" && typeof d.accent === "string" && HEX.test(d.accent) ? d.accent : null,
    logoDataUrl: logo,
    displayName: text(d.displayName, 40, base.displayName),
    subtitle: text(d.subtitle, 40, base.subtitle),
    backTitle: text(d.backTitle, 40, base.backTitle),
    benefits: benefits.length ? benefits : base.benefits,
    icon: typeof d.icon === "string" && ICON_KEYS.includes(d.icon as never) ? (d.icon as LoyaltyDesign["icon"]) : base.icon,
  };
}

/** Puntos que da una compra: `pointsPerUnit` por cada `unitAmount` completo. */
export function pointsForPurchase(amount: number, rules: LoyaltyRules) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / rules.unitAmount) * rules.pointsPerUnit;
}

export type EarnRequest = { kind: "stamps"; qty: number } | { kind: "purchase"; amount: number };

export type EarnContext = {
  type: LoyaltyTypeKey;
  rules: LoyaltyRules;
  /** Sellos o puntos ya sumados hoy a esta tarjeta (según el origen que se esté controlando). */
  earnedToday: number;
  /** Cuántos sellos por autoservicio se sumaron hoy. */
  selfServiceToday: number;
  lastEarnAt: Date | null;
  source: "STAFF" | "SELF_SERVICE";
  now: Date;
};

export type EarnPlan = { ok: true; amount: number } | { ok: false; code: string; message: string };

/** Valida una suma de sellos o puntos contra las reglas y los topes. */
export function planEarn(request: EarnRequest, ctx: EarnContext): EarnPlan {
  const { rules } = ctx;
  let amount: number;
  if (ctx.type === "STAMPS") {
    if (request.kind !== "stamps") return { ok: false, code: "WRONG_KIND", message: "Este programa suma sellos." };
    amount = Math.round(request.qty);
    if (!Number.isFinite(amount) || amount < 1) return { ok: false, code: "INVALID", message: "Elegí cuántos sellos sumar." };
  } else {
    if (request.kind === "purchase") {
      amount = pointsForPurchase(request.amount, rules);
      if (amount < 1) return { ok: false, code: "TOO_SMALL", message: `La compra no alcanza para sumar puntos (mínimo ${rules.unitAmount}).` };
    } else {
      amount = Math.round(request.qty);
      if (!Number.isFinite(amount) || amount < 1) return { ok: false, code: "INVALID", message: "Elegí cuántos puntos sumar." };
    }
  }
  if (ctx.source === "SELF_SERVICE") {
    if (!rules.selfService) return { ok: false, code: "SELF_SERVICE_OFF", message: "Este negocio no tiene autoservicio." };
    if (ctx.type !== "STAMPS") return { ok: false, code: "SELF_SERVICE_OFF", message: "El autoservicio es solo para sellos." };
    amount = 1;
    if (ctx.selfServiceToday >= rules.selfServiceMaxPerDay) return { ok: false, code: "DAILY_LIMIT", message: "Ya sumaste tu sello de hoy. ¡Volvé mañana!" };
  }
  if (amount > rules.maxPerAction) return { ok: false, code: "ACTION_LIMIT", message: `Se pueden sumar hasta ${rules.maxPerAction} de una vez.` };
  if (ctx.earnedToday + amount > rules.maxPerDay) {
    const left = Math.max(0, rules.maxPerDay - ctx.earnedToday);
    return { ok: false, code: "DAILY_LIMIT", message: left ? `Hoy solo se pueden sumar ${left} más a esta tarjeta.` : "Esta tarjeta llegó al tope de hoy." };
  }
  if (rules.cooldownMinutes > 0 && ctx.lastEarnAt) {
    const wait = rules.cooldownMinutes * 60_000 - (ctx.now.getTime() - ctx.lastEarnAt.getTime());
    if (wait > 0) return { ok: false, code: "COOLDOWN", message: `Esperá ${Math.ceil(wait / 60_000)} min para volver a sumar en esta tarjeta.` };
  }
  return { ok: true, amount };
}

/** Si el saldo venció por inactividad y hasta cuándo vale. */
export function expiryState(lastVisitAt: Date | null, rules: LoyaltyRules, now: Date) {
  if (!rules.expiresDays || !lastVisitAt) return { expired: false, expiresOn: null as string | null };
  const until = new Date(lastVisitAt.getTime() + rules.expiresDays * 86_400_000);
  return { expired: until.getTime() < now.getTime(), expiresOn: until.toISOString().slice(0, 10) };
}

/**
 * El regalo de cumpleaños se da una vez por año, en los 30 días que siguen al cumpleaños
 * (así no se pierde si la persona no vino justo ese día). `today` es yyyy-mm-dd local.
 */
export function birthdayDue(birthday: string | null, lastBirthdayYear: number | null, rules: LoyaltyRules, today: string) {
  if (!birthday || rules.birthdayBonus <= 0 || !/^\d{2}-\d{2}$/.test(birthday)) return false;
  const year = Number(today.slice(0, 4));
  const candidates = [year, year - 1];
  for (const y of candidates) {
    if (lastBirthdayYear !== null && lastBirthdayYear >= y) continue;
    const start = Date.parse(`${y}-${birthday}T00:00:00Z`);
    if (Number.isNaN(start)) return false;
    const t = Date.parse(`${today}T00:00:00Z`);
    if (t >= start && t < start + 30 * 86_400_000) return y;
  }
  return false;
}

export function tierFor(lifetime: number, tiers: LoyaltyTier[]): TierView {
  let current: LoyaltyTier | null = null;
  let next: LoyaltyTier | null = null;
  for (const t of tiers) {
    if (lifetime >= t.minLifetime) current = t;
    else if (!next) next = t;
  }
  return { current, next, toNext: next ? next.minLifetime - lifetime : null };
}

const unitWord = (type: LoyaltyTypeKey, n: number) => (type === "STAMPS" ? (n === 1 ? "sello" : "sellos") : n === 1 ? "punto" : "puntos");

/** Progreso hacia el próximo premio y lo que ya se puede canjear. */
export function progressFor(type: LoyaltyTypeKey, rules: LoyaltyRules, rewards: RewardView[], balance: number): ProgressView {
  const active = rewards.filter((r) => r.active).sort((a, b) => a.cost - b.cost);
  const available = active.filter((r) => r.cost <= balance).map((r) => ({ id: r.id, name: r.name, cost: r.cost }));
  const upcoming = active.find((r) => r.cost > balance) ?? null;
  const goal = type === "STAMPS" ? rules.stampsGoal : upcoming?.cost ?? active[active.length - 1]?.cost ?? Math.max(balance, 1);
  const target = upcoming ?? (available.length ? null : active[0] ?? null);
  const remaining = target ? Math.max(0, target.cost - balance) : 0;
  const current = type === "STAMPS" ? Math.min(balance, goal) : balance;
  let label: string;
  if (available.length) {
    label = available.length === 1 ? `¡Tenés ${available[0].name} disponible!` : `¡Tenés ${available.length} premios disponibles!`;
  } else if (target) {
    label = `Te ${remaining === 1 ? "falta" : "faltan"} ${remaining} ${unitWord(type, remaining)} para ${target.name}`;
  } else {
    label = type === "STAMPS" ? `Juntá ${goal} sellos` : "Sumá puntos con cada compra";
  }
  return {
    goal,
    current,
    remaining,
    percent: goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0,
    nextReward: target ? { name: target.name, cost: target.cost } : null,
    available,
    label,
  };
}

export type RedeemPlan = { ok: true; cost: number } | { ok: false; message: string };

export function planRedeem(balance: number, reward: Pick<RewardView, "cost" | "active" | "name"> | null): RedeemPlan {
  if (!reward || !reward.active) return { ok: false, message: "Ese premio no está disponible." };
  if (balance < reward.cost) return { ok: false, message: `Faltan ${reward.cost - balance} para canjear ${reward.name}.` };
  return { ok: true, cost: reward.cost };
}
// creado por pato dev y askforvini
