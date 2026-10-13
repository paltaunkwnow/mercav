// STUB: solo para que las páginas de Mercav Privacy compilen en esta rama. El archivo real lo escribe el agente de
// cotizaciones (lib/privacy/rates.ts + app/api/privacy/rates); al integrar, este stub se descarta a favor de ese.

export type PrivacyRates = {
  /** Bolivianos por 1 USDT. */
  usdtBob: number | null;
  /** Dólares por 1 SOL. */
  solUsd: number | null;
  /** Dólares por 1 XRP. */
  xrpUsd: number | null;
  /** ISO 8601 de la cotización. */
  updatedAt: string | null;
  source: string;
};

export async function getPrivacyRates(): Promise<PrivacyRates> {
  return { usdtBob: null, solUsd: null, xrpUsd: null, updatedAt: null, source: "stub" };
}
// creado por pato dev y askforvini
