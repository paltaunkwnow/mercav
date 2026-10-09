import { todayIn } from "../../geo/latam";
import { AUDIENCE_LABELS, type CampaignAudience } from "./campaigns";
import type { LoyaltyEventView, LoyaltyTypeKey, RewardView } from "./types";

/*
 * Ayudas puras del panel de Fidelización (estadísticas, filtros de clientes, exportación).
 * Sin base de datos: se usan en el servidor, en el cliente y en los tests.
 */

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
/** Un cliente está "en riesgo" si no viene hace este tiempo. */
export const AT_RISK_DAYS = 30;
export const CUSTOMERS_PAGE_SIZE = 20;

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2 oct" en la zona horaria de la empresa. */
export function shortDay(date: Date, timeZone: string) {
  const iso = todayIn(timeZone, date);
  return `${Number(iso.slice(8, 10))} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`;
}

export type WeeklyRow = { week: number; kind: string; count: number };
export type WeeklyPoint = { label: string; from: string; visits: number; redeems: number };

/**
 * Actividad por semana móvil de 7 días que termina ahora (índice 0 = últimos 7 días).
 * Devuelve de la semana más vieja a la más nueva, con ceros donde no hubo movimiento.
 */
export function weeklySeries(rows: WeeklyRow[], now: Date, timeZone: string, weeks = 8): WeeklyPoint[] {
  const points: WeeklyPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * WEEK_MS + DAY_MS);
    points.push({ label: shortDay(start, timeZone), from: todayIn(timeZone, start), visits: 0, redeems: 0 });
  }
  for (const row of rows) {
    const week = Math.floor(Number(row.week));
    if (!Number.isFinite(week) || week < 0 || week >= weeks) continue;
    const point = points[weeks - 1 - week];
    const count = Number(row.count) || 0;
    if (row.kind === "redeem") point.redeems += count;
    else point.visits += count;
  }
  return points;
}

/** Porcentaje entero (0 si no hay base). */
export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Costo del premio activo más barato (para "tiene un premio para canjear"). */
export function minRewardCost(rewards: Pick<RewardView, "cost" | "active">[]) {
  const costs = rewards.filter((r) => r.active).map((r) => r.cost);
  return costs.length ? Math.min(...costs) : null;
}

export const CARD_FILTERS = ["all", "atRisk", "reward", "blocked"] as const;
export type CardFilter = (typeof CARD_FILTERS)[number];

export const CARD_FILTER_LABELS: Record<CardFilter, string> = {
  all: "Todos",
  atRisk: "En riesgo",
  reward: "Con premio para canjear",
  blocked: "Bloqueados",
};

export function parseCardFilter(raw: string | null | undefined): CardFilter {
  return CARD_FILTERS.includes(raw as CardFilter) ? (raw as CardFilter) : "all";
}

export function parsePage(raw: string | null | undefined) {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10_000) : 1;
}

/** Texto de búsqueda limpio: sin espacios de más y con largo acotado. */
export function cleanQuery(raw: string | null | undefined) {
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

/** Si la búsqueda parece un celular, sus dígitos (al menos 3). */
export function phoneDigits(query: string) {
  if (/[a-zA-Z@]/.test(query)) return null;
  const digits = query.replace(/\D/g, "");
  return digits.length >= 3 ? digits : null;
}

/** Fila de la lista de clientes del panel. */
export type CustomerRow = {
  id: string;
  /** Número de cliente dentro del programa. */
  customerNo: number;
  /** Titular: sin cuenta, vinculada esperando el documento, o validada. */
  holderStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  lifetime: number;
  visits: number;
  lastVisitAt: string | null;
  tier: string | null;
  status: "ACTIVE" | "BLOCKED";
  rewardReady: boolean;
  atRisk: boolean;
  marketingConsent: boolean;
  createdAt: string;
};

/** Ficha de un cliente en el panel (con su historial). */
export type CustomerDetail = CustomerRow & {
  birthday: string | null;
  progressLabel: string;
  nextTier: string | null;
  toNextTier: number | null;
  expiresOn: string | null;
  referrals: number;
  history: (LoyaltyEventView & { actorName: string | null })[];
  /** Cuenta Mercav vinculada (nombre, para compararlo con el documento) y lo que se revisó. */
  holderAccountName: string | null;
  holderVerifiedAt: string | null;
  holderDoc: string | null;
};

export function isAtRisk(lastVisitAt: Date | string | null, createdAt: Date | string, now: Date, days = AT_RISK_DAYS) {
  const last = new Date(lastVisitAt ?? createdAt);
  return now.getTime() - last.getTime() >= days * DAY_MS;
}

export const unitLabel = (type: LoyaltyTypeKey, n = 2) => (type === "STAMPS" ? (n === 1 ? "sello" : "sellos") : n === 1 ? "punto" : "puntos");

/** Filas del Excel de clientes (encabezado incluido). Las fechas van en la zona de la empresa. */
export function customerSheetRows(rows: CustomerRow[], opts: { type: LoyaltyTypeKey; timeZone: string }) {
  const unit = opts.type === "STAMPS" ? "sellos" : "puntos";
  const day = (v: string | null) => (v ? todayIn(opts.timeZone, new Date(v)) : "");
  return [
    ["N.º de cliente", "Nombre", "Celular", "Correo", `Saldo (${unit})`, `Acumulado (${unit})`, "Visitas", "Última visita", "Nivel", "Alta", "Acepta mensajes", "Estado"],
    ...rows.map((r) => [
      r.customerNo,
      r.name,
      r.phone ?? "",
      r.email ?? "",
      r.balance,
      r.lifetime,
      r.visits,
      day(r.lastVisitAt),
      r.tier ?? "",
      day(r.createdAt),
      r.marketingConsent ? "Sí" : "No",
      r.status === "BLOCKED" ? "Bloqueada" : "Activa",
    ]),
  ];
}

/** Campaña enviada, como la ve el panel. */
export type CampaignView = {
  id: string;
  title: string;
  body: string;
  audience: CampaignAudience;
  audienceLabel: string;
  recipients: number;
  createdAt: string;
  expiresAt: string | null;
  createdByName: string | null;
};

/** Cómo se lee la audiencia de una campaña en la lista. */
export function describeAudience(audience: CampaignAudience) {
  switch (audience.kind) {
    case "atRisk":
      return `Clientes que no vienen hace ${audience.days} días o más`;
    case "tier":
      return `Nivel ${audience.tier}`;
    default:
      return AUDIENCE_LABELS[audience.kind];
  }
}

/** Línea del premio principal para el cartel y la vista previa. */
export function rewardLine(type: LoyaltyTypeKey, stampsGoal: number, rewardName: string | null | undefined) {
  const reward = rewardName?.trim() || "un premio";
  return type === "STAMPS" ? `Juntá ${stampsGoal} sellos y llevate ${reward}.` : `Sumá puntos con cada compra y canjealos por ${reward}.`;
}
// creado por pato dev y askforvini
