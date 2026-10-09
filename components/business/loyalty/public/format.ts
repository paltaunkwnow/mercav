import { formatMoney, latamCountry } from "@/lib/geo/latam";
import type { LoyaltyCardView, LoyaltyEventView, LoyaltyProgramView, LoyaltyRules, LoyaltyTypeKey, RewardView } from "@/lib/business/loyalty/types";

/*
 * Textos y formatos de Fidelización para la tarjeta del cliente y la caja.
 * Puro: sin servidor ni base, se usa en componentes de cliente y de servidor.
 */

/** Lo que las pantallas públicas necesitan del programa (sin secretos ni datos de la empresa de más). */
export type PublicProgram = Pick<LoyaltyProgramView, "slug" | "name" | "type" | "design" | "rewards"> & {
  rules: Pick<LoyaltyRules, "stampsGoal" | "pointsPerUnit" | "unitAmount" | "referralBonus" | "welcomeBonus" | "birthdayBonus" | "expiresDays">;
  businessName: string;
  country: string;
  currency: string;
};

export function publicProgram(view: LoyaltyProgramView): PublicProgram {
  const { rules } = view;
  return {
    slug: view.slug,
    name: view.name,
    type: view.type,
    design: view.design,
    rewards: view.rewards.filter((r) => r.active),
    rules: {
      stampsGoal: rules.stampsGoal,
      pointsPerUnit: rules.pointsPerUnit,
      unitAmount: rules.unitAmount,
      referralBonus: rules.referralBonus,
      welcomeBonus: rules.welcomeBonus,
      birthdayBonus: rules.birthdayBonus,
      expiresDays: rules.expiresDays,
    },
    businessName: view.design.displayName || view.workspace.name,
    country: view.workspace.country,
    currency: view.workspace.currency,
  };
}

export function unitWord(type: LoyaltyTypeKey, n: number) {
  if (type === "STAMPS") return n === 1 ? "sello" : "sellos";
  return n === 1 ? "punto" : "puntos";
}

/** "3 sellos", "1 punto". */
export function units(type: LoyaltyTypeKey, n: number) {
  return `${n.toLocaleString("es")} ${unitWord(type, n)}`;
}

/** "+2 sellos", "−10 puntos" (con signo menos tipográfico). */
export function signedUnits(type: LoyaltyTypeKey, n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${units(type, Math.abs(n))}`;
}

/** Monto sin decimales cuando es redondo: "Bs 10", "$ 1.500", "R$ 12,50". */
export function moneyRound(value: number, country: string, currency?: string) {
  const c = latamCountry(country);
  const whole = Number.isInteger(value);
  try {
    return new Intl.NumberFormat(`es-${c.code}`, {
      style: "currency",
      currency: currency ?? c.currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(value);
  } catch {
    return formatMoney(value, country, currency);
  }
}

/** Premio principal: el que cuesta la meta de sellos (o el más barato en puntos). */
export function mainReward(type: LoyaltyTypeKey, rules: Pick<LoyaltyRules, "stampsGoal">, rewards: RewardView[]): RewardView | null {
  const active = rewards.filter((r) => r.active).sort((a, b) => a.cost - b.cost);
  if (!active.length) return null;
  if (type === "STAMPS") {
    return active.find((r) => r.cost === rules.stampsGoal) ?? [...active].reverse().find((r) => r.cost <= rules.stampsGoal) ?? active[0];
  }
  return active[0];
}

/** La propuesta en una línea: "Juntá 10 sellos y llevate Café gratis". */
export function dealLine(p: Pick<PublicProgram, "type" | "rules" | "rewards" | "country" | "currency">) {
  const reward = mainReward(p.type, p.rules, p.rewards);
  if (p.type === "STAMPS") {
    const goal = p.rules.stampsGoal;
    return reward ? `Juntá ${reward.cost} sellos y llevate ${reward.name}` : `Juntá ${goal} sellos y llevate un premio`;
  }
  const per = `Sumá ${units("POINTS", p.rules.pointsPerUnit)} cada ${moneyRound(p.rules.unitAmount, p.country, p.currency)} de compra`;
  return reward ? `${per} y canjeá ${reward.name} con ${units("POINTS", reward.cost)}` : `${per} y canjealos por premios`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

/** Serial en grupos de 4 para dictarlo: "ABCD EFGH IJKL …". */
export function groupSerial(serial: string) {
  return serial.match(/.{1,4}/g)?.join(" ") ?? serial;
}

/** "yyyy-mm-dd" → "dd/mm" (con año si no es este año). */
export function shortDay(isoDay: string, now = new Date()) {
  const [y, m, d] = isoDay.slice(0, 10).split("-");
  if (!y || !m || !d) return isoDay;
  return String(now.getUTCFullYear()) === y ? `${d}/${m}` : `${d}/${m}/${y}`;
}

function dayKey(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** "Hoy, 14:30" · "Ayer, 09:05" · "12/09". En la zona horaria del negocio. */
export function whenText(iso: string, timeZone: string, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  let time = "";
  try {
    time = new Intl.DateTimeFormat("es", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  } catch {
    time = date.toISOString().slice(11, 16);
  }
  const day = dayKey(date, timeZone);
  if (day === dayKey(now, timeZone)) return `Hoy, ${time}`;
  if (day === dayKey(new Date(now.getTime() - 86_400_000), timeZone)) return `Ayer, ${time}`;
  return shortDay(day, now);
}

export function timeZoneFor(country: string) {
  return latamCountry(country).timezone;
}

/** Texto de un movimiento. `voice` cambia la persona: el cliente lee "Canjeaste", la caja lee "Canjeó". */
export function eventText(e: Pick<LoyaltyEventView, "type" | "amount" | "rewardName" | "source" | "note">, type: LoyaltyTypeKey, voice: "customer" | "staff" = "customer") {
  const you = voice === "customer";
  switch (e.type) {
    case "JOIN":
      return { title: you ? "Te sumaste al club" : "Se sumó al club", delta: null as string | null, tone: "neutral" as const };
    case "WELCOME":
      return { title: "Regalo de bienvenida", delta: signedUnits(type, e.amount), tone: "plus" as const };
    case "STAMP":
    case "POINTS":
      return { title: signedUnits(type, e.amount), delta: e.source === "SELF_SERVICE" ? "Autoservicio" : null, tone: "plus" as const };
    case "REDEEM":
      return { title: `${you ? "Canjeaste" : "Canjeó"} ${e.rewardName ?? "un premio"}`, delta: signedUnits(type, e.amount), tone: "minus" as const };
    case "ADJUST":
      return { title: "Ajuste del negocio", delta: signedUnits(type, e.amount), tone: e.amount >= 0 ? ("plus" as const) : ("minus" as const) };
    case "EXPIRE":
      return { title: "Venció el saldo", delta: signedUnits(type, e.amount), tone: "minus" as const };
    case "BIRTHDAY":
      return { title: "Regalo de cumpleaños", delta: signedUnits(type, e.amount), tone: "plus" as const };
    case "REFERRAL":
      return {
        title: e.note ? (you ? e.note : e.note.replace(/^Invitaste/, "Invitó")) : you ? "Invitaste a un amigo" : "Invitó a un amigo",
        delta: signedUnits(type, e.amount),
        tone: "plus" as const,
      };
    default:
      return { title: "Movimiento", delta: e.amount ? signedUnits(type, e.amount) : null, tone: "neutral" as const };
  }
}

/** Props de la tarjeta visual a partir del estado de una tarjeta. */
export function cardVisualProps(program: Pick<PublicProgram, "type" | "rules" | "rewards" | "design">, card: Pick<LoyaltyCardView, "balance" | "progress" | "customerName">) {
  const reward = program.type === "STAMPS" ? mainReward(program.type, program.rules, program.rewards) : null;
  return {
    design: program.design,
    type: program.type,
    stampsGoal: program.rules.stampsGoal,
    balance: card.balance,
    customerName: card.customerName,
    rewardName: program.type === "STAMPS" ? reward?.name ?? null : card.progress.nextReward?.name ?? card.progress.available[0]?.name ?? null,
    pointsGoal: program.type === "POINTS" ? card.progress.nextReward?.cost ?? card.progress.goal : null,
  };
}

/** Si cambió algo que el cliente tiene que ver. */
export function cardChanged(a: Pick<LoyaltyCardView, "balance" | "lifetime" | "visits" | "status">, b: Pick<LoyaltyCardView, "balance" | "lifetime" | "visits" | "status">) {
  return a.balance !== b.balance || a.lifetime !== b.lifetime || a.visits !== b.visits || a.status !== b.status;
}

export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Días válidos de un mes (febrero acepta 29). */
export function daysInMonth(month: number) {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

export function validBirthday(mmdd: string) {
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(month);
}
// creado por pato dev y askforvini
