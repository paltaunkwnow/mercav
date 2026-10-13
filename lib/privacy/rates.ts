/**
 * Cotización de Mercav Privacy para mostrar precios aproximados en bolivianos, SOL y XRP. Solo servidor.
 * Se guarda 10 minutos en la caché de datos de Next (compartida entre pedidos e instancias). Nunca tira: la fuente
 * que falla queda en null, salvo que haya una cotización buena anterior, que se sigue usando.
 * Las conversiones y los textos están en ./quote (puro, también para el navegador).
 */
import "server-only";
import { unstable_cache } from "next/cache";
import type { PrivacyRates } from "./quote";
import { combineRates, fetchCryptoUsd, fetchUsdtBob, parseManualRate, type BobQuote, type CryptoQuote } from "./rate-sources";

export type { PrivacyRates, QuotePart } from "./quote";
export {
  formatBob,
  formatSol,
  formatXrp,
  quoteLine,
  quoteNote,
  quoteParts,
  quoteSpeech,
  quoteTime,
  toBob,
  toSol,
  toXrp,
} from "./quote";

const REVALIDATE_SECONDS = 600;
/** Tras un fallo sin cotización anterior, esta instancia no vuelve a llamar a la fuente por un minuto. */
const RETRY_AFTER_MS = 60_000;

type Key = "bob" | "crypto";
type Quotes = { bob: BobQuote | null; crypto: CryptoQuote | null };

// Última cotización buena que vio esta instancia (de la fuente o de la caché compartida).
const last: Quotes = { bob: null, crypto: null };
const failedAt: Record<Key, number> = { bob: 0, crypto: 0 };

/**
 * Si la fuente falla, se vuelve a guardar la última buena (con su hora de entonces, así la nota y MAX_AGE_MS la tratan
 * como vieja) y se reintenta en 10 minutos. Sin ninguna anterior, tira: unstable_cache no guarda nada.
 */
function liveOrLast<K extends Key>(key: K, load: () => Promise<Quotes[K]>) {
  return async (): Promise<NonNullable<Quotes[K]>> => {
    const tryLive = Date.now() - failedAt[key] >= RETRY_AFTER_MS;
    const value = tryLive ? await load() : null;
    if (value) return value as NonNullable<Quotes[K]>;
    if (tryLive) failedAt[key] = Date.now();
    const prev = last[key];
    if (prev) return prev as NonNullable<Quotes[K]>;
    throw new Error(`privacy-rates ${key}: sin cotización`);
  };
}

const cachedBob = unstable_cache(liveOrLast("bob", fetchUsdtBob), ["privacy-rates", "usdt-bob", "v1"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["privacy-rates"],
});

const cachedCrypto = unstable_cache(liveOrLast("crypto", fetchCryptoUsd), ["privacy-rates", "crypto-usd", "v1"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["privacy-rates"],
});

async function settle<K extends Key>(key: K, cached: () => Promise<NonNullable<Quotes[K]>>): Promise<Quotes[K]> {
  try {
    const value = await cached();
    const prev = last[key];
    // La más nueva entre la de la caché y la que vio esta instancia.
    if (!prev || value.at >= prev.at) last[key] = value;
    return last[key];
  } catch (error) {
    // Los errores de control de Next (dynamic usage, redirect…) traen digest y tienen que seguir de largo.
    if (error && typeof error === "object" && "digest" in error) throw error;
    return last[key];
  }
}

export async function getPrivacyRates(): Promise<PrivacyRates> {
  const [bob, crypto] = await Promise.all([settle("bob", cachedBob), settle("crypto", cachedCrypto)]);
  return combineRates(bob, crypto, { manualBob: parseManualRate(process.env.PRIVACY_USDT_BOB_RATE) });
}
// creado por pato dev y askforvini
