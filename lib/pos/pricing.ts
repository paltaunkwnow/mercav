import { roundMoney } from "./money";

export interface PricingLineInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  /** Percentage, e.g. 13 for 13%. */
  taxRate: number;
}

export interface PricingLine extends PricingLineInput {
  gross: number;
  discount: number;
  net: number;
  tax: number;
}

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

export interface PricingInput {
  lines: PricingLineInput[];
  discountType: DiscountType;
  discountValue: number;
  pricesIncludeTax: boolean;
  decimals: number;
}

export interface PricingResult {
  lines: PricingLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function computeSale({ lines, discountType, discountValue, pricesIncludeTax, decimals }: PricingInput): PricingResult {
  const r = (n: number) => roundMoney(n, decimals);
  const grossLines = lines.map((l) => ({ ...l, gross: r(l.unitPrice * l.quantity) }));
  const subtotal = r(grossLines.reduce((s, l) => s + l.gross, 0));

  const value = Math.max(0, Number(discountValue) || 0);
  const requested =
    discountType === "PERCENTAGE" ? (subtotal * Math.min(value, 100)) / 100 : discountType === "FIXED" ? value : 0;
  const discount = r(Math.min(requested, subtotal));

  let allocated = 0;
  const priced = grossLines.map((l, i) => {
    const isLast = i === grossLines.length - 1;
    const share = subtotal > 0 ? (isLast ? discount - allocated : r((discount * l.gross) / subtotal)) : 0;
    allocated += share;
    const net = r(l.gross - share);
    const rate = Math.max(0, l.taxRate) / 100;
    const tax = pricesIncludeTax ? r(net - net / (1 + rate)) : r(net * rate);
    return { ...l, discount: share, net, tax };
  });

  const net = r(priced.reduce((s, l) => s + l.net, 0));
  const tax = r(priced.reduce((s, l) => s + l.tax, 0));
  return { lines: priced, subtotal, discount, tax, total: pricesIncludeTax ? net : r(net + tax) };
}
