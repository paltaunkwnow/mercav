import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_RATES,
  formatBob,
  formatNumberEs,
  formatSol,
  formatXrp,
  isPrivacyRates,
  quoteLine,
  quoteNote,
  quoteParts,
  quoteSpeech,
  toBob,
  toSol,
  toXrp,
  type PrivacyRates,
} from "../quote";
import {
  combineRates,
  fetchCryptoUsd,
  fetchUsdtBob,
  median,
  p2pReference,
  parseBinanceAds,
  parseCoinGecko,
  parseCriptoYa,
  parseKraken,
  parseManualRate,
  type Fetcher,
} from "../rate-sources";

const S = " ";
const RATES: PrivacyRates = {
  usdtBob: 11.86,
  solUsd: 106.5,
  xrpUsd: 1.3625,
  updatedAt: "2026-10-13T18:30:00.000Z",
  source: "Binance P2P · Kraken",
};

test("conversión de USDT, sin romperse con cotizaciones nulas o raras", () => {
  assert.equal(toBob(100, RATES), 1186);
  assert.ok(Math.abs((toSol(106.5, RATES) ?? 0) - 1) < 1e-12);
  assert.ok(Math.abs((toXrp(1362.5, RATES) ?? 0) - 1000) < 1e-9);
  assert.equal(toBob(100, { usdtBob: null }), null);
  assert.equal(toSol(100, { solUsd: 0 }), null);
  assert.equal(toXrp(100, { xrpUsd: Number.NaN }), null);
  assert.equal(toBob(Number.NaN, RATES), null);
  assert.equal(toBob(-5, RATES), null);
  assert.equal(toBob(0, RATES), 0);
});

test("números al estilo es-BO, iguales en cualquier entorno", () => {
  assert.equal(formatNumberEs(2185, 0), "2.185");
  assert.equal(formatNumberEs(1234567.891, 2), "1.234.567,89");
  assert.equal(formatNumberEs(999, 0), "999");
  assert.equal(formatNumberEs(0.5, 3), "0,500");
  assert.equal(formatNumberEs(-1234.5, 1), "-1.234,5");
});

test("redondeo: bolivianos enteros, SOL con 2 o 3 decimales, XRP entero o con 1 decimal", () => {
  assert.equal(formatBob(2185.4), `Bs${S}2.185`);
  assert.equal(formatBob(2185.5), `Bs${S}2.186`);
  assert.equal(formatBob(999.49), `Bs${S}999`);
  assert.equal(formatBob(null), null);
  assert.equal(formatSol(1.1234), `1,12${S}SOL`);
  assert.equal(formatSol(14.0849), `14,08${S}SOL`);
  assert.equal(formatSol(0.84567), `0,846${S}SOL`);
  assert.equal(formatSol(null), null);
  assert.equal(formatXrp(78.4), `78${S}XRP`);
  assert.equal(formatXrp(1103.6), `1.104${S}XRP`);
  assert.equal(formatXrp(7.26), `7,3${S}XRP`);
  assert.equal(formatXrp(undefined as unknown as null), null);
});

test("la línea de cotización con los precios del catálogo", () => {
  // Trezor Safe 3: 89,99 USDT.
  assert.equal(quoteLine(89.99, RATES), `≈${S}Bs${S}1.067 · ≈${S}0,845${S}SOL · ≈${S}66${S}XRP`);
  // Pixel 10 Pro: 1.499,99 USDT.
  assert.equal(quoteLine(1499.99, RATES), `≈${S}Bs${S}17.790 · ≈${S}14,08${S}SOL · ≈${S}1.101${S}XRP`);
  assert.deepEqual(
    quoteParts(1499.99, RATES).map((p) => p.unit),
    ["BOB", "SOL", "XRP"],
  );
});

test("lo que no tiene cotización no aparece", () => {
  assert.equal(quoteLine(100, { ...RATES, solUsd: null }), `≈${S}Bs${S}1.186 · ≈${S}73${S}XRP`);
  assert.equal(quoteLine(100, { ...RATES, usdtBob: null, xrpUsd: null }), `≈${S}0,939${S}SOL`);
  assert.equal(quoteLine(100, EMPTY_RATES), "");
  assert.deepEqual(quoteParts(100, EMPTY_RATES), []);
  assert.equal(quoteSpeech(100, EMPTY_RATES), "");
});

test("texto para lectores de pantalla", () => {
  assert.equal(quoteSpeech(100, RATES), `Aproximadamente Bs${S}1.186, 0,939${S}SOL o 73${S}XRP.`);
  assert.equal(quoteSpeech(100, { ...RATES, solUsd: null, xrpUsd: null }), `Aproximadamente Bs${S}1.186.`);
});

test("la nota con la hora de Bolivia y la fuente", () => {
  const sameDay = new Date("2026-10-13T20:00:00.000Z");
  assert.equal(quoteNote(RATES, { now: sameDay }), "cotización aprox. de las 14:30 (Binance P2P · Kraken)");
  const nextDay = new Date("2026-10-14T13:00:00.000Z");
  assert.equal(quoteNote(RATES, { now: nextDay }), "cotización aprox. del 13/10 a las 14:30 (Binance P2P · Kraken)");
  // 02:00 UTC del 14 sigue siendo el 13 a las 22:00 en La Paz.
  const lateNight = { ...RATES, updatedAt: "2026-10-14T02:00:00.000Z" };
  assert.equal(quoteNote(lateNight, { now: new Date("2026-10-14T03:59:00.000Z") }), "cotización aprox. de las 22:00 (Binance P2P · Kraken)");
  assert.equal(quoteNote({ ...EMPTY_RATES, usdtBob: 11.9, source: "tipo manual" }), "cotización aprox. (tipo manual)");
  assert.equal(quoteNote(EMPTY_RATES), null);
  assert.equal(quoteNote({ ...RATES, updatedAt: "no es fecha", source: "" }), null);
});

test("mediana", () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test("P2P: los anuncios carnada o mal cargados no mueven la referencia", () => {
  const book = [9.5, 11.86, 11.86, 11.86, 11.86, 11.87, 11.87, 11.88, 11.9, 15];
  assert.equal(p2pReference(book), 11.865);
  // Sin el filtro, el 15 y el 9,5 quedarían en la cuenta; con él, la mediana es la de los anuncios normales.
  assert.equal(p2pReference([11.8, 11.82, 11.84, 30, 31]), 11.82);
  // Solo toma los mejores `take`.
  assert.equal(p2pReference([11.8, 11.8, 11.8, 12.5, 12.5, 12.5, 12.5], { take: 3 }), 11.8);
  // Con menos de tres anuncios utilizables no hay referencia.
  assert.equal(p2pReference([11.86, 11.87]), null);
  assert.equal(p2pReference([11.86, 0, -1, Number.NaN]), null);
  assert.equal(p2pReference([11.86, 20, 30]), null);
  assert.equal(p2pReference([11.86, 11.9], { minOffers: 2 }), 11.88);
});

test("Binance P2P: precios ordenados, sin anuncios que no llegan a Bs 1.000", () => {
  const json = {
    code: "000000",
    data: {
      items: [
        { price: 11.88, maxTransAmount: 207000 },
        { price: "11.86", maxTransAmount: 17502.95 },
        { price: 11.5, maxTransAmount: 200 },
        { price: 11.87 },
        { price: null, maxTransAmount: 5000 },
      ],
    },
  };
  assert.deepEqual(parseBinanceAds(json), [11.86, 11.87, 11.88]);
  assert.deepEqual(parseBinanceAds({ code: "000000", data: null }), []);
  assert.deepEqual(parseBinanceAds(null), []);
});

test("CriptoYa: solo los P2P y solo cotizaciones de la última hora", () => {
  const now = Date.parse("2026-10-13T12:40:00Z");
  const fresh = now / 1000 - 60;
  const json = {
    binancep2p: { ask: 11.86, totalAsk: 11.86, time: fresh },
    bybitp2p: { ask: 11.85, totalAsk: 11.85, time: fresh },
    eldoradop2p: { ask: 11.979, totalAsk: 12.0976, time: fresh },
    mexcp2p: { ask: 11.92, totalAsk: 11.92, time: now / 1000 - 7200 },
    vitawallet: { ask: 11.9645, totalAsk: 11.9645, time: fresh },
  };
  assert.deepEqual(parseCriptoYa(json, now), [11.85, 11.86, 12.0976]);
  assert.deepEqual(parseCriptoYa("error", now), []);
});

test("Kraken: pares con nombres propios, medio de compra y venta", () => {
  const json = {
    error: [],
    result: {
      SOLUSD: { a: ["106.52000", "100", "100.000"], b: ["106.50000", "95", "95.000"], c: ["106.47000", "4.3"] },
      XXRPZUSD: { a: ["1.40000", "1", "1"], b: ["1.20000", "1", "1"], c: ["1.36224", "155"] },
    },
  };
  const { solUsd, xrpUsd } = parseKraken(json);
  assert.equal(solUsd, 106.51);
  // Spread raro (más de 1 %): usa el último operado.
  assert.equal(xrpUsd, 1.36224);
  assert.deepEqual(parseKraken({ error: ["EGeneral:Too many requests"] }), { solUsd: null, xrpUsd: null });
  assert.deepEqual(parseKraken({ result: { "SOL/USD": { c: ["100"] } } }), { solUsd: 100, xrpUsd: null });
});

test("CoinGecko y el tipo manual", () => {
  assert.deepEqual(parseCoinGecko({ solana: { usd: 106.36 }, ripple: { usd: 1.36 } }), { solUsd: 106.36, xrpUsd: 1.36 });
  assert.deepEqual(parseCoinGecko({ status: { error_code: 429 } }), { solUsd: null, xrpUsd: null });
  assert.equal(parseManualRate("11,9"), 11.9);
  assert.equal(parseManualRate(" 12.05 "), 12.05);
  assert.equal(parseManualRate(""), null);
  assert.equal(parseManualRate(undefined), null);
  assert.equal(parseManualRate("abc"), null);
  assert.equal(parseManualRate("-3"), null);
});

test("combinar: la hora es la más vieja, lo muy viejo no se usa y el tipo manual es el último recurso", () => {
  const now = Date.parse("2026-10-13T18:40:00Z");
  const bob = { usdtBob: 11.865, source: "Binance P2P", at: "2026-10-13T18:30:00.000Z" };
  const crypto = { solUsd: 106.5, xrpUsd: 1.36, source: "Kraken", at: "2026-10-13T18:35:00.000Z" };
  assert.deepEqual(combineRates(bob, crypto, { now }), {
    usdtBob: 11.865,
    solUsd: 106.5,
    xrpUsd: 1.36,
    updatedAt: "2026-10-13T18:30:00.000Z",
    source: "Binance P2P · Kraken",
  });
  // Sin USDT/BOB en vivo: tipo manual.
  assert.deepEqual(combineRates(null, crypto, { now, manualBob: 11.9 }), {
    usdtBob: 11.9,
    solUsd: 106.5,
    xrpUsd: 1.36,
    updatedAt: "2026-10-13T18:35:00.000Z",
    source: "tipo manual · Kraken",
  });
  // El en vivo gana al manual.
  assert.equal(combineRates(bob, null, { now, manualBob: 11.9 }).usdtBob, 11.865);
  // SOL y XRP de hace más de 6 horas ya no se muestran; USDT/BOB aguanta 72.
  const later = Date.parse("2026-10-14T06:00:00Z");
  assert.deepEqual(combineRates(bob, crypto, { now: later }), {
    usdtBob: 11.865,
    solUsd: null,
    xrpUsd: null,
    updatedAt: "2026-10-13T18:30:00.000Z",
    source: "Binance P2P",
  });
  assert.deepEqual(combineRates(null, null, { now }), EMPTY_RATES);
});

function fakeFetch(routes: Record<string, () => Response | Promise<Response>>): Fetcher {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const hit = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!hit) throw new TypeError("fetch failed");
    return routes[hit]();
  }) as Fetcher;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test("USDT/BOB: si Binance no responde, CriptoYa", async (t) => {
  t.mock.method(console, "warn", () => {});
  const now = Date.now() / 1000;
  const fetcher = fakeFetch({
    "https://www.binance.com/": () => json({ code: "0", msg: "restricted" }, 451),
    "https://criptoya.com/": () =>
      json({ binancep2p: { totalAsk: 11.86, time: now }, bybitp2p: { totalAsk: 11.85, time: now }, bitgetp2p: { totalAsk: 11.87, time: now } }),
  });
  const bob = await fetchUsdtBob(fetcher);
  assert.equal(bob?.usdtBob, 11.86);
  assert.equal(bob?.source, "CriptoYa P2P");

  const binance = fakeFetch({
    "https://www.binance.com/": () =>
      json({ data: { items: [11.86, 11.86, 11.87, 11.87, 11.88].map((price) => ({ price, maxTransAmount: 5000 })) } }),
  });
  const direct = await fetchUsdtBob(binance);
  assert.equal(direct?.usdtBob, 11.87);
  assert.equal(direct?.source, "Binance P2P");

  assert.equal(await fetchUsdtBob(fakeFetch({})), null);
});

test("SOL y XRP: Kraken y, para lo que falte, CoinGecko", async (t) => {
  t.mock.method(console, "warn", () => {});
  const both = await fetchCryptoUsd(
    fakeFetch({
      "https://api.kraken.com/": () => json({ error: [], result: { SOLUSD: { c: ["106.5"] }, XXRPZUSD: { c: ["1.36"] } } }),
      "https://api.coingecko.com/": () => {
        throw new Error("no debería llamarse");
      },
    }),
  );
  assert.equal(both?.solUsd, 106.5);
  assert.equal(both?.xrpUsd, 1.36);
  assert.equal(both?.source, "Kraken");

  const filled = await fetchCryptoUsd(
    fakeFetch({
      "https://api.kraken.com/": () => json({ error: [], result: { SOLUSD: { c: ["106.5"] } } }),
      "https://api.coingecko.com/": () => json({ solana: { usd: 999 }, ripple: { usd: 1.35 } }),
    }),
  );
  assert.equal(filled?.solUsd, 106.5);
  assert.equal(filled?.xrpUsd, 1.35);
  assert.equal(filled?.source, "Kraken · CoinGecko");

  const gecko = await fetchCryptoUsd(fakeFetch({ "https://api.coingecko.com/": () => json({ solana: { usd: 106 }, ripple: { usd: 1.3 } }) }));
  assert.equal(gecko?.source, "CoinGecko");
  assert.equal(await fetchCryptoUsd(fakeFetch({})), null);
});

test("lo que llega de la API se valida antes de usarlo", () => {
  assert.ok(isPrivacyRates(RATES));
  assert.ok(isPrivacyRates(EMPTY_RATES));
  assert.ok(!isPrivacyRates(null));
  assert.ok(!isPrivacyRates({ ...RATES, usdtBob: "11.86" }));
  assert.ok(!isPrivacyRates({ ...RATES, solUsd: -1 }));
  assert.ok(!isPrivacyRates({ ...RATES, source: undefined }));
});
// creado por pato dev y askforvini
