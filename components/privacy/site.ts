import type { Metadata } from "next";
import { getPrivacyRates } from "@/lib/privacy/rates";
import { PAYMENT } from "@/lib/privacy/catalog";
import { X_HANDLE, canonicalFor } from "@/lib/seo/site";

/*
 * Utilidades de las páginas de Mercav Privacy (privacy.mercav.lat, servido desde /privacy): rutas, metadatos,
 * precios en USDT y su equivalente aproximado en bolivianos, SOL y XRP.
 */

export const PRIVACY_NAME = "Mercav Privacy";
export const SUPPORT_EMAIL = "soporte@mercav.lat";

/** Ruta de la app de una página ("/celulares" → "/privacy/celulares"). En privacy.mercav.lat, HostLink la acorta. */
export const privacyPath = (path = "/") => (path === "/" ? "/privacy" : `/privacy${path}`);

/** URL pública de una página: canonicalFor sabe en qué host vive /privacy. */
export const privacyUrl = (path = "/") => canonicalFor(privacyPath(path));

export const productPath = (slug: string) => privacyPath(`/producto/${slug}`);

/**
 * Título, descripción y Open Graph de una página. La canónica la pone el layout raíz (x-mercav-path + canonicalFor);
 * acá solo va og:url, porque el openGraph de la página reemplaza entero al del layout.
 */
export function privacyMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  const home = path === "/";
  const full = home ? title : `${title} · ${PRIVACY_NAME}`;
  return {
    title: home ? { absolute: title } : title,
    description,
    openGraph: { type: "website", locale: "es_419", siteName: PRIVACY_NAME, url: privacyUrl(path), title: full, description },
    twitter: { card: "summary_large_image", site: X_HANDLE, title: full, description },
  };
}

/* Precios */

const number = (digits: number) => new Intl.NumberFormat("es-BO", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const two = number(2);
const none = number(0);

/** "189,99" */
export const usdtAmount = (n: number) => two.format(n);
/** "189,99 USDT" */
export const usdt = (n: number) => `${two.format(n)} USDT`;

export type Rates = Awaited<ReturnType<typeof getPrivacyRates>>;

const NO_RATES: Rates = { usdtBob: null, solUsd: null, xrpUsd: null, updatedAt: null, source: "" };

/** La cotización del momento. Si el servicio falla, la página sale igual, sin los montos aproximados. */
export async function loadRates(): Promise<Rates> {
  try {
    return await getPrivacyRates();
  } catch {
    return NO_RATES;
  }
}

const usable = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * Equivalentes aproximados de un precio en USDT: ["≈ Bs 1.322", "≈ 1,12 SOL", "≈ 78 XRP"]. SOL y XRP se cotizan en
 * dólares; el USDT se toma 1 a 1 con el dólar. Falta la cotización de alguno, falta ese monto.
 */
export function approxAmounts(priceUsdt: number, rates: Rates) {
  const out: string[] = [];
  if (usable(rates.usdtBob)) out.push(`≈ Bs ${none.format(priceUsdt * rates.usdtBob)}`);
  if (usable(rates.solUsd)) out.push(`≈ ${two.format(priceUsdt / rates.solUsd)} SOL`);
  if (usable(rates.xrpUsd)) out.push(`≈ ${none.format(priceUsdt / rates.xrpUsd)} XRP`);
  return out;
}

export const hasRates = (rates: Rates) => usable(rates.usdtBob) || usable(rates.solUsd) || usable(rates.xrpUsd);

const LA_PAZ = "America/La_Paz";
const HOUR = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: LA_PAZ });
const DAY = new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "long", timeZone: LA_PAZ });
const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: LA_PAZ });

/** "cotización de las 14:20" (hora de Bolivia), o "cotización del 12 de octubre, 14:20" si no es de hoy. */
export function quoteLabel(rates: Rates, now = new Date()) {
  if (!rates.updatedAt) return null;
  const at = new Date(rates.updatedAt);
  if (Number.isNaN(at.getTime())) return null;
  return DAY_KEY.format(at) === DAY_KEY.format(now) ? `cotización de las ${HOUR.format(at)}` : `cotización del ${DAY.format(at)}, ${HOUR.format(at)}`;
}

/* Pedidos */

/** wa.me con el mensaje ya escrito; null si no hay número configurado. */
export function whatsappHref(message: string) {
  if (!PAYMENT.whatsapp) return null;
  return `https://wa.me/${PAYMENT.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mailtoHref(subject?: string) {
  return subject ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_EMAIL}`;
}
// creado por pato dev y askforvini
