/**
 * Cotización aproximada de Mercav Privacy: conversión de USDT a bolivianos, SOL y XRP y su texto.
 * Puro, sin imports de Next: lo usan el servidor (lib/privacy/rates.ts), el componente PriceQuote y los tests.
 */

export type PrivacyRates = {
  /** Bolivianos por 1 USDT (P2P, lado compra de USDT). */
  usdtBob: number | null;
  /** Dólares por 1 SOL. */
  solUsd: number | null;
  /** Dólares por 1 XRP. */
  xrpUsd: number | null;
  /** La cotización más vieja de las que se usaron (ISO). */
  updatedAt: string | null;
  /** Etiqueta corta de las fuentes, por ejemplo "Binance P2P · Kraken". */
  source: string;
};

export const EMPTY_RATES: PrivacyRates = { usdtBob: null, solUsd: null, xrpUsd: null, updatedAt: null, source: "" };

/** Hora de Bolivia: la misma en el servidor y en el navegador, para que el texto no cambie al hidratar. */
export const QUOTE_TIME_ZONE = "America/La_Paz";

const NBSP = " ";

const usable = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const amount = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

export function toBob(usdt: number, rates: Pick<PrivacyRates, "usdtBob">): number | null {
  return amount(usdt) && usable(rates.usdtBob) ? usdt * rates.usdtBob : null;
}

// Los precios de SOL y XRP son en dólares y tomamos 1 USDT ≈ 1 USD: la diferencia suele ser menor al 0,2 %,
// muy por debajo de lo que se mueve SOL o XRP en diez minutos. Es una cotización aproximada.
export function toSol(usdt: number, rates: Pick<PrivacyRates, "solUsd">): number | null {
  return amount(usdt) && usable(rates.solUsd) ? usdt / rates.solUsd : null;
}

export function toXrp(usdt: number, rates: Pick<PrivacyRates, "xrpUsd">): number | null {
  return amount(usdt) && usable(rates.xrpUsd) ? usdt / rates.xrpUsd : null;
}

/** Número al estilo es-BO (miles con punto, decimales con coma), igual en Node y en cualquier navegador. */
export function formatNumberEs(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = value < 0 && Number(fixed) !== 0 ? "-" : "";
  return `${sign}${grouped}${frac ? `,${frac}` : ""}`;
}

/** "Bs 2.185": a bolivianos enteros. */
export function formatBob(bob: number | null): string | null {
  return amount(bob) ? `Bs${NBSP}${formatNumberEs(Math.round(bob), 0)}` : null;
}

/** "1,12 SOL"; por debajo de 1 SOL, tres decimales ("0,845 SOL"). */
export function formatSol(sol: number | null): string | null {
  if (!amount(sol)) return null;
  return `${formatNumberEs(sol, sol < 1 ? 3 : 2)}${NBSP}SOL`;
}

/** "78 XRP"; por debajo de 10 XRP, un decimal. */
export function formatXrp(xrp: number | null): string | null {
  if (!amount(xrp)) return null;
  return `${formatNumberEs(xrp, xrp < 10 ? 1 : 0)}${NBSP}XRP`;
}

export type QuotePart = { unit: "BOB" | "SOL" | "XRP"; amount: number; text: string };

/** Las partes que hay: la que no tiene cotización no aparece. */
export function quoteParts(priceUsdt: number, rates: PrivacyRates): QuotePart[] {
  const all: [QuotePart["unit"], number | null, (n: number | null) => string | null][] = [
    ["BOB", toBob(priceUsdt, rates), formatBob],
    ["SOL", toSol(priceUsdt, rates), formatSol],
    ["XRP", toXrp(priceUsdt, rates), formatXrp],
  ];
  return all.flatMap(([unit, value, format]) => {
    const text = format(value);
    return value !== null && text ? [{ unit, amount: value, text }] : [];
  });
}

/** "≈ Bs 2.185 · ≈ 1,12 SOL · ≈ 78 XRP"; vacío si no hay ninguna cotización. */
export function quoteLine(priceUsdt: number, rates: PrivacyRates): string {
  return quoteParts(priceUsdt, rates)
    .map((p) => `≈${NBSP}${p.text}`)
    .join(" · ");
}

/** Lo mismo para lectores de pantalla: "Aproximadamente Bs 2.185, 1,12 SOL o 78 XRP." */
export function quoteSpeech(priceUsdt: number, rates: PrivacyRates): string {
  const texts = quoteParts(priceUsdt, rates).map((p) => p.text);
  if (!texts.length) return "";
  const list = texts.length === 1 ? texts[0] : `${texts.slice(0, -1).join(", ")} o ${texts[texts.length - 1]}`;
  return `Aproximadamente ${list}.`;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

type TimeOpts = { now?: Date; timeZone?: string };

/** Hora de la cotización en Bolivia ("14:30") y, si no es de hoy, también el día ("12/10"). */
export function quoteTime(updatedAt: string | null, opts: TimeOpts = {}): { time: string; day: string | null } | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  const timeZone = opts.timeZone ?? QUOTE_TIME_ZONE;
  const at = zonedParts(date, timeZone);
  const today = zonedParts(opts.now ?? new Date(), timeZone);
  const sameDay = at.y === today.y && at.m === today.m && at.d === today.d;
  return { time: `${at.hh}:${at.mm}`, day: sameDay ? null : `${at.d}/${at.m}` };
}

/**
 * "cotización aprox. de las 14:30 (Binance P2P · Kraken)", "… del 12/10 a las 14:30 (…)" o, con solo el tipo manual,
 * "cotización aprox. (tipo manual)". null si no hay nada que decir.
 */
export function quoteNote(rates: PrivacyRates, opts: TimeOpts = {}): string | null {
  const t = quoteTime(rates.updatedAt, opts);
  const source = rates.source ? ` (${rates.source})` : "";
  if (!t) return source ? `cotización aprox.${source}` : null;
  const when = t.day ? `del ${t.day} a las ${t.time}` : `de las ${t.time}`;
  return `cotización aprox. ${when}${source}`;
}

/** Valida lo que llega de /api/privacy/rates antes de usarlo en el navegador. */
export function isPrivacyRates(value: unknown): value is PrivacyRates {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const num = (x: unknown) => x === null || usable(x);
  return (
    num(v.usdtBob) &&
    num(v.solUsd) &&
    num(v.xrpUsd) &&
    (v.updatedAt === null || typeof v.updatedAt === "string") &&
    typeof v.source === "string"
  );
}
// creado por pato dev y askforvini
