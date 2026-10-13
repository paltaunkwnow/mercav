import { NextResponse } from "next/server";
import { getPrivacyRates } from "@/lib/privacy/rates";

// La cotización ya se guarda 10 minutos en lib/privacy/rates.ts; la ruta corre en cada pedido y la CDN la guarda 5.
export const dynamic = "force-dynamic";

/** Cotización pública de Mercav Privacy (USDT/BOB, SOL/USD, XRP/USD), para refrescar PriceQuote en el navegador. */
export async function GET() {
  const rates = await getPrivacyRates();
  return NextResponse.json(rates, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
// creado por pato dev y askforvini
