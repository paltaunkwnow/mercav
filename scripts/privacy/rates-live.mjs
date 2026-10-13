// Chequeo en vivo de la cotización de Mercav Privacy: consulta cada fuente y muestra lo que daría la tienda.
// No es parte de los tests (sale a internet). Uso:
//   node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//     --import ./scripts/pwn-test-register.mjs scripts/privacy/rates-live.mjs
import {
  SOURCE_URLS,
  combineRates,
  fetchBinanceP2P,
  fetchCriptoYaP2P,
  fetchCryptoUsd,
  getJson,
  p2pReference,
  parseBinanceAds,
  parseCoinGecko,
  parseCriptoYa,
  parseKraken,
  parseManualRate,
} from "../../lib/privacy/rate-sources.ts";
import { quoteLine, quoteNote } from "../../lib/privacy/quote.ts";
import { PRODUCTS, INSTALL_SERVICE } from "../../lib/privacy/catalog.ts";

const ms = (start) => `${Date.now() - start} ms`;

let t = Date.now();
const ads = parseBinanceAds(await getJson(SOURCE_URLS.binanceP2P, fetch, "Binance P2P"));
console.log(`Binance P2P (${ms(t)}): ${ads.length} anuncios útiles; mejores: ${ads.slice(0, 15).join(", ")}`);
console.log(`  referencia (mediana sin atípicos): ${p2pReference(ads)}`);

t = Date.now();
const cy = parseCriptoYa(await getJson(SOURCE_URLS.criptoYa, fetch, "CriptoYa"), Date.now());
console.log(`CriptoYa P2P (${ms(t)}): ${cy.join(", ")} → ${p2pReference(cy, { minOffers: 2 })}`);

t = Date.now();
const kraken = parseKraken(await getJson(SOURCE_URLS.kraken, fetch, "Kraken"));
console.log(`Kraken (${ms(t)}):`, kraken);
t = Date.now();
const gecko = parseCoinGecko(await getJson(SOURCE_URLS.coinGecko, fetch, "CoinGecko"));
console.log(`CoinGecko (${ms(t)}):`, gecko);

const [bob, crypto] = await Promise.all([
  fetchBinanceP2P().then((b) => b ?? fetchCriptoYaP2P()),
  fetchCryptoUsd(),
]);
const rates = combineRates(bob, crypto, { manualBob: parseManualRate(process.env.PRIVACY_USDT_BOB_RATE) });
console.log("\ngetPrivacyRates() daría:", rates);
console.log(quoteNote(rates));

console.log("");
for (const p of [...PRODUCTS, { name: "Instalación del sistema reforzado", priceUsdt: INSTALL_SERVICE.priceUsdt }]) {
  console.log(`${p.name.padEnd(36)} ${String(p.priceUsdt).padStart(8)} USDT  ${quoteLine(p.priceUsdt, rates).replaceAll(" ", " ")}`);
}
// creado por pato dev y askforvini
