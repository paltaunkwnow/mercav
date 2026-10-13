import "server-only";
import { getPrivacyRates } from "@/lib/privacy/rates";
import { NO_RATES, type Rates } from "./site";

/** La cotización del momento, para las páginas (servidor). Si el servicio falla, la página sale igual. */
export async function loadRates(): Promise<Rates> {
  try {
    return await getPrivacyRates();
  } catch {
    return NO_RATES;
  }
}
// creado por pato dev y askforvini
