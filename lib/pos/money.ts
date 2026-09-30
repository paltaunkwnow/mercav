const ZERO_DECIMAL = new Set(["CLP", "PYG"]);

export function currencyDecimals(currency: string | null | undefined) {
  return ZERO_DECIMAL.has(currency ?? "") ? 0 : 2;
}

export function roundMoney(value: number, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function formatMoney(value: number | string | null | undefined, currency: string | null | undefined) {
  const d = currencyDecimals(currency);
  const text = Number(value ?? 0).toLocaleString("es-419", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
  return `${currency ?? ""} ${text}`.trim();
}

const DENOMINATIONS: Record<string, number[]> = {
  ARS: [1000, 2000, 10000, 20000],
  BOB: [20, 50, 100, 200],
  CLP: [2000, 5000, 10000, 20000],
  COP: [10000, 20000, 50000, 100000],
  CRC: [2000, 5000, 10000, 20000],
  DOP: [200, 500, 1000, 2000],
  GTQ: [20, 50, 100, 200],
  HNL: [50, 100, 200, 500],
  MXN: [50, 100, 200, 500],
  NIO: [50, 100, 200, 500],
  PEN: [20, 50, 100, 200],
  PYG: [20000, 50000, 100000],
  UYU: [200, 500, 1000, 2000],
  USD: [5, 10, 20, 50, 100],
};

export function cashDenominations(currency: string | null | undefined) {
  return DENOMINATIONS[currency ?? ""] ?? [10, 20, 50, 100];
}
