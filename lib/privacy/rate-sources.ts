/**
 * Fuentes de la cotización de Mercav Privacy. Puro (fetch de Node, sin imports de Next): lo usan lib/privacy/rates.ts,
 * los tests y scripts/privacy/rates-live.mjs. Ninguna función tira: la fuente que falla devuelve null.
 *
 * - USDT/BOB: Binance P2P, API pública sin clave (MGS C2C Agent API, documentada por Binance en binance-skills-hub).
 *   Mediana de los mejores anuncios donde se compra USDT con bolivianos, sin los que se alejan de la mediana.
 *   Respaldo: CriptoYa, API pública para apps (120 pedidos/min), mediana de los P2P que cubre en BOB.
 * - SOL/USD y XRP/USD: Kraken (ticker público, anda desde EE. UU.). Respaldo: CoinGecko (simple price, sin clave).
 */
import type { PrivacyRates } from "./quote";

export const FETCH_TIMEOUT_MS = 4_000;
/** Pasado este tiempo, una cotización guardada ya no se muestra. */
export const MAX_AGE_MS = { bob: 72 * 3_600_000, crypto: 6 * 3_600_000 };

export const SOURCE_URLS = {
  // tradeType=BUY: anuncios donde se compra USDT pagando en bolivianos (lo que cuesta reponer el USDT).
  binanceP2P: "https://www.binance.com/bapi/c2c/v1/public/c2c/agent/ad-list?fiat=BOB&asset=USDT&tradeType=BUY&limit=20",
  criptoYa: "https://criptoya.com/api/USDT/BOB/100",
  kraken: "https://api.kraken.com/0/public/Ticker?pair=SOLUSD,XRPUSD",
  coinGecko: "https://api.coingecko.com/api/v3/simple/price?ids=solana,ripple&vs_currencies=usd",
};

/** Un anuncio que no llega a este monto en bolivianos no sirve para el producto más barato: no cuenta. */
const MIN_TICKET_BOB = 1_000;

export type BobQuote = { usdtBob: number; source: string; at: string };
export type CryptoQuote = { solUsd: number | null; xrpUsd: number | null; source: string; at: string };
export type Fetcher = typeof fetch;

const positive = (n: unknown): number | null => {
  const v = typeof n === "string" ? Number(n) : n;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
};
const round = (n: number, decimals: number) => Math.round(n * 10 ** decimals) / 10 ** decimals;

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Precio de referencia de un libro P2P: toma los `take` mejores precios (ya ordenados), saca los que se alejan más de
 * `maxDeviation` de la mediana (anuncios carnada o mal cargados) y devuelve la mediana del resto.
 */
export function p2pReference(
  prices: number[],
  { take = 15, maxDeviation = 0.03, minOffers = 3 }: { take?: number; maxDeviation?: number; minOffers?: number } = {},
): number | null {
  const top = prices.filter((p) => positive(p) !== null).slice(0, take);
  if (top.length < minOffers) return null;
  const first = median(top);
  if (first === null) return null;
  const kept = top.filter((p) => Math.abs(p - first) / first <= maxDeviation);
  if (kept.length < minOffers) return null;
  const ref = median(kept);
  return ref === null ? null : round(ref, 4);
}

/** Precios de los anuncios de Binance P2P (compra de USDT), del mejor al peor, sin los que no llegan a MIN_TICKET_BOB. */
export function parseBinanceAds(json: unknown): number[] {
  const items = (json as { data?: { items?: unknown } } | null)?.data?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((ad) => {
      const max = positive((ad as { maxTransAmount?: unknown })?.maxTransAmount);
      return max === null || max >= MIN_TICKET_BOB;
    })
    .map((ad) => positive((ad as { price?: unknown })?.price))
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);
}

/** Precio de compra de USDT (con comisiones) de cada P2P que CriptoYa cubre en BOB, si es de la última hora. */
export function parseCriptoYa(json: unknown, nowMs: number): number[] {
  if (!json || typeof json !== "object") return [];
  return Object.entries(json as Record<string, unknown>)
    .filter(([exchange]) => exchange.endsWith("p2p"))
    .map(([, q]) => {
      const quote = q as { totalAsk?: unknown; ask?: unknown; time?: unknown } | null;
      const time = positive(quote?.time);
      if (time !== null && nowMs - time * 1000 > 3_600_000) return null;
      return positive(quote?.totalAsk) ?? positive(quote?.ask);
    })
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);
}

/** Medio entre la mejor compra y la mejor venta; si falta alguna o el spread es raro, el último precio operado. */
function krakenPrice(ticker: unknown): number | null {
  const t = ticker as { a?: unknown[]; b?: unknown[]; c?: unknown[] } | null;
  const ask = positive(t?.a?.[0]);
  const bid = positive(t?.b?.[0]);
  if (ask !== null && bid !== null && ask >= bid && (ask - bid) / bid < 0.01) return round((ask + bid) / 2, 6);
  return positive(t?.c?.[0]);
}

export function parseKraken(json: unknown): { solUsd: number | null; xrpUsd: number | null } {
  const body = json as { error?: unknown[]; result?: Record<string, unknown> } | null;
  const result = body?.result && typeof body.result === "object" ? body.result : {};
  // Kraken nombra los pares a su manera (XRPUSD vuelve como XXRPZUSD).
  const find = (asset: string) => {
    const key = Object.keys(result).find((k) => {
      const n = k.replace("/", "").toUpperCase();
      return n === `${asset}USD` || n === `X${asset}ZUSD`;
    });
    return key ? krakenPrice(result[key]) : null;
  };
  return { solUsd: find("SOL"), xrpUsd: find("XRP") };
}

export function parseCoinGecko(json: unknown): { solUsd: number | null; xrpUsd: number | null } {
  const body = json as { solana?: { usd?: unknown }; ripple?: { usd?: unknown } } | null;
  return { solUsd: positive(body?.solana?.usd), xrpUsd: positive(body?.ripple?.usd) };
}

/** PRIVACY_USDT_BOB_RATE: tipo manual de respaldo ("11,9" o "11.9"). */
export function parseManualRate(raw: string | undefined | null): number | null {
  if (!raw) return null;
  return positive(raw.trim().replace(",", "."));
}

export async function getJson(url: string, fetcher: Fetcher, label: string): Promise<unknown> {
  try {
    const res = await fetcher(url, {
      headers: { Accept: "application/json", "User-Agent": "Mercav/1.0 (+https://mercav.lat)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[privacy-rates] ${label}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.warn(`[privacy-rates] ${label}: ${error instanceof Error ? error.name : "error"}`);
    return null;
  }
}

export async function fetchBinanceP2P(fetcher: Fetcher = fetch): Promise<BobQuote | null> {
  const usdtBob = p2pReference(parseBinanceAds(await getJson(SOURCE_URLS.binanceP2P, fetcher, "Binance P2P")));
  return usdtBob === null ? null : { usdtBob, source: "Binance P2P", at: new Date().toISOString() };
}

export async function fetchCriptoYaP2P(fetcher: Fetcher = fetch): Promise<BobQuote | null> {
  const prices = parseCriptoYa(await getJson(SOURCE_URLS.criptoYa, fetcher, "CriptoYa"), Date.now());
  const usdtBob = p2pReference(prices, { minOffers: 2 });
  return usdtBob === null ? null : { usdtBob, source: "CriptoYa P2P", at: new Date().toISOString() };
}

/** USDT/BOB: Binance P2P y, si no responde, CriptoYa. */
export async function fetchUsdtBob(fetcher: Fetcher = fetch): Promise<BobQuote | null> {
  return (await fetchBinanceP2P(fetcher)) ?? (await fetchCriptoYaP2P(fetcher));
}

/** SOL y XRP en dólares: Kraken y, para lo que falte, CoinGecko. */
export async function fetchCryptoUsd(fetcher: Fetcher = fetch): Promise<CryptoQuote | null> {
  const kraken = parseKraken(await getJson(SOURCE_URLS.kraken, fetcher, "Kraken"));
  let { solUsd, xrpUsd } = kraken;
  const sources = solUsd !== null || xrpUsd !== null ? ["Kraken"] : [];
  if (solUsd === null || xrpUsd === null) {
    const gecko = parseCoinGecko(await getJson(SOURCE_URLS.coinGecko, fetcher, "CoinGecko"));
    if ((solUsd === null && gecko.solUsd !== null) || (xrpUsd === null && gecko.xrpUsd !== null)) sources.push("CoinGecko");
    solUsd ??= gecko.solUsd;
    xrpUsd ??= gecko.xrpUsd;
  }
  if (solUsd === null && xrpUsd === null) return null;
  return {
    solUsd: solUsd === null ? null : round(solUsd, 6),
    xrpUsd: xrpUsd === null ? null : round(xrpUsd, 6),
    source: sources.join(" · "),
    at: new Date().toISOString(),
  };
}

const fresh = (at: string | undefined, maxAgeMs: number, now: number) => {
  const t = at ? Date.parse(at) : NaN;
  return Number.isFinite(t) && now - t <= maxAgeMs;
};

/**
 * Arma el objeto público. Lo guardado que ya es muy viejo no se usa; sin USDT/BOB en vivo va el tipo manual
 * (PRIVACY_USDT_BOB_RATE). updatedAt es la más vieja de las cotizaciones en vivo que se usaron.
 */
export function combineRates(
  bob: BobQuote | null,
  crypto: CryptoQuote | null,
  { manualBob = null, now = Date.now() }: { manualBob?: number | null; now?: number } = {},
): PrivacyRates {
  const liveBob = bob && fresh(bob.at, MAX_AGE_MS.bob, now) ? bob : null;
  const liveCrypto = crypto && fresh(crypto.at, MAX_AGE_MS.crypto, now) ? crypto : null;
  const usdtBob = liveBob?.usdtBob ?? manualBob ?? null;
  const bobSource = liveBob ? liveBob.source : usdtBob !== null ? "tipo manual" : null;
  const times = [liveBob?.at, liveCrypto?.at].filter((t): t is string => !!t).sort();
  return {
    usdtBob,
    solUsd: liveCrypto?.solUsd ?? null,
    xrpUsd: liveCrypto?.xrpUsd ?? null,
    updatedAt: times[0] ?? null,
    source: [bobSource, liveCrypto?.source].filter(Boolean).join(" · "),
  };
}
// creado por pato dev y askforvini
