export const KOSHER_STOCK_CATEGORIES = [
  { id: "meat", label: "Carne" },
  { id: "wine", label: "Vino" },
  { id: "matzah", label: "Matzá" },
  { id: "cheese", label: "Queso" },
  { id: "frozen", label: "Congelados" },
  { id: "bakery", label: "Panificados" },
] as const;

interface StockLike {
  stock: number | string;
  trackStock?: boolean;
  minStock?: number | string | null;
}

/** Tracked and at or below its own minimum. Products without a minimum never count as low. */
export function isLowStock(p: StockLike) {
  if (p.trackStock === false || p.minStock === null || p.minStock === undefined || p.minStock === "") return false;
  const stock = Number(p.stock);
  return stock > 0 && stock <= Number(p.minStock);
}

/** Timestamps of the last two keystrokes, shared by the scanner listener and the shortcuts. */
export const keyTiming = { last: 0, previous: 0 };
// creado por pato dev y askforvini
