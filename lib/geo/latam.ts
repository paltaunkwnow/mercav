/** Países de Latinoamérica donde opera Mercav. Sin dependencias: cliente, servidor y tests. */

export type LatamCountry = {
  /** ISO 3166-1 alfa-2. */
  code: string;
  name: string;
  /** ISO 4217 de la moneda de los sueldos. */
  currency: string;
  /** Zona horaria de la capital, para "hoy" cuando la persona no tiene una propia. */
  timezone: string;
  /** Código telefónico internacional, sin "+". */
  dialCode: string;
  /** Largo del número nacional (sin código de país ni 0 inicial): mínimo y máximo. */
  phoneDigits: [number, number];
};

export const LATAM_COUNTRIES: LatamCountry[] = [
  { code: "AR", name: "Argentina", currency: "ARS", timezone: "America/Argentina/Buenos_Aires", dialCode: "54", phoneDigits: [10, 11] },
  { code: "BO", name: "Bolivia", currency: "BOB", timezone: "America/La_Paz", dialCode: "591", phoneDigits: [8, 8] },
  { code: "BR", name: "Brasil", currency: "BRL", timezone: "America/Sao_Paulo", dialCode: "55", phoneDigits: [10, 11] },
  { code: "CL", name: "Chile", currency: "CLP", timezone: "America/Santiago", dialCode: "56", phoneDigits: [9, 9] },
  { code: "CO", name: "Colombia", currency: "COP", timezone: "America/Bogota", dialCode: "57", phoneDigits: [10, 10] },
  { code: "CR", name: "Costa Rica", currency: "CRC", timezone: "America/Costa_Rica", dialCode: "506", phoneDigits: [8, 8] },
  { code: "CU", name: "Cuba", currency: "CUP", timezone: "America/Havana", dialCode: "53", phoneDigits: [8, 8] },
  { code: "EC", name: "Ecuador", currency: "USD", timezone: "America/Guayaquil", dialCode: "593", phoneDigits: [8, 9] },
  { code: "SV", name: "El Salvador", currency: "USD", timezone: "America/El_Salvador", dialCode: "503", phoneDigits: [8, 8] },
  { code: "GT", name: "Guatemala", currency: "GTQ", timezone: "America/Guatemala", dialCode: "502", phoneDigits: [8, 8] },
  { code: "HN", name: "Honduras", currency: "HNL", timezone: "America/Tegucigalpa", dialCode: "504", phoneDigits: [8, 8] },
  { code: "MX", name: "México", currency: "MXN", timezone: "America/Mexico_City", dialCode: "52", phoneDigits: [10, 10] },
  { code: "NI", name: "Nicaragua", currency: "NIO", timezone: "America/Managua", dialCode: "505", phoneDigits: [8, 8] },
  { code: "PA", name: "Panamá", currency: "USD", timezone: "America/Panama", dialCode: "507", phoneDigits: [7, 8] },
  { code: "PY", name: "Paraguay", currency: "PYG", timezone: "America/Asuncion", dialCode: "595", phoneDigits: [7, 9] },
  { code: "PE", name: "Perú", currency: "PEN", timezone: "America/Lima", dialCode: "51", phoneDigits: [8, 9] },
  { code: "PR", name: "Puerto Rico", currency: "USD", timezone: "America/Puerto_Rico", dialCode: "1", phoneDigits: [10, 10] },
  { code: "DO", name: "República Dominicana", currency: "DOP", timezone: "America/Santo_Domingo", dialCode: "1", phoneDigits: [10, 10] },
  { code: "UY", name: "Uruguay", currency: "UYU", timezone: "America/Montevideo", dialCode: "598", phoneDigits: [8, 8] },
  { code: "VE", name: "Venezuela", currency: "VES", timezone: "America/Caracas", dialCode: "58", phoneDigits: [10, 10] },
];

export const LATAM_CODES = LATAM_COUNTRIES.map((c) => c.code);

export const DEFAULT_COUNTRY = "BO";

export function latamCountry(code: string | null | undefined): LatamCountry {
  return LATAM_COUNTRIES.find((c) => c.code === code?.toUpperCase()) ?? LATAM_COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY)!;
}

export function isLatamCountry(code: string | null | undefined): boolean {
  return !!code && LATAM_CODES.includes(code.toUpperCase());
}

/** Zonas horarias de cada país además de la de su capital. */
const EXTRA_ZONES: Record<string, string[]> = {
  AR: ["America/Buenos_Aires", "America/Cordoba", "America/Mendoza", "America/Catamarca", "America/Jujuy"],
  BR: ["America/Fortaleza", "America/Recife", "America/Bahia", "America/Belem", "America/Manaus", "America/Cuiaba", "America/Campo_Grande", "America/Porto_Velho", "America/Boa_Vista", "America/Rio_Branco", "America/Araguaina", "America/Maceio", "America/Santarem", "America/Noronha", "America/Eirunepe"],
  MX: ["America/Cancun", "America/Merida", "America/Monterrey", "America/Matamoros", "America/Chihuahua", "America/Ciudad_Juarez", "America/Ojinaga", "America/Mazatlan", "America/Bahia_Banderas", "America/Hermosillo", "America/Tijuana"],
  CL: ["America/Punta_Arenas", "Pacific/Easter"],
  EC: ["Pacific/Galapagos"],
};

/**
 * País probable por la zona horaria del navegador (America/Argentina/Salta → AR). Sirve de respaldo cuando el hosting
 * no informa el país por IP. No pide permisos ni guarda nada.
 */
export function countryFromTimeZone(tz: string | null | undefined): string | null {
  if (!tz) return null;
  if (tz.startsWith("America/Argentina/")) return "AR";
  const byCapital = LATAM_COUNTRIES.find((c) => c.timezone === tz);
  if (byCapital) return byCapital.code;
  for (const [code, zones] of Object.entries(EXTRA_ZONES)) if (zones.includes(tz)) return code;
  return null;
}

/** Monto en la moneda y el formato del país (Bs 1.234,56 · $ 1.234,56 · R$1.234,56). */
export function formatMoney(value: number | string | null | undefined, country: string, currency?: string) {
  const n = Number(value ?? 0);
  const c = latamCountry(country);
  try {
    return new Intl.NumberFormat(`es-${c.code}`, { style: "currency", currency: currency ?? c.currency }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `${currency ?? c.currency} ${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
  }
}

/** Fecha de hoy (yyyy-mm-dd) en una zona horaria. */
export function todayIn(timeZone: string, now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
// creado por pato dev y askforvini
