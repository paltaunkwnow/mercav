export type OrderTypeId = "COUNTER" | "TABLE" | "TOGO" | "DELIVERY" | "EMPLOYEE" | "IN_STORE" | "AT_HOME";

export const ORDER_TYPE_LABELS: Record<OrderTypeId, string> = {
  COUNTER: "Mostrador",
  TABLE: "Para la mesa",
  TOGO: "Para llevar",
  DELIVERY: "Envío",
  EMPLOYEE: "Consumo empleado",
  IN_STORE: "En el local",
  AT_HOME: "A domicilio",
};

export const ORDER_TYPES_WITH_CHANNEL: OrderTypeId[] = ["TOGO", "DELIVERY"];

export function orderTypeLabel(id: string | null | undefined) {
  return ORDER_TYPE_LABELS[id as OrderTypeId] ?? id ?? "";
}

export type BusinessTypeId = "GENERAL" | "GASTRONOMY" | "RETAIL" | "GROCERY" | "PHARMACY" | "HARDWARE" | "SERVICES";

export interface BusinessType {
  id: BusinessTypeId;
  name: string;
  description: string;
  orderTypes: OrderTypeId[];
  channels: string[];
  dietary: boolean;
  weighted: boolean;
  tracksStockByDefault: boolean;
  categoryPresets: string[];
}

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "GENERAL",
    name: "Comercio general",
    description: "Cualquier negocio que vende productos en mostrador.",
    orderTypes: ["COUNTER", "DELIVERY"],
    channels: ["WhatsApp", "Instagram", "Tienda web", "MercadoLibre", "Propio"],
    dietary: false,
    weighted: true,
    tracksStockByDefault: true,
    categoryPresets: ["General", "Destacados", "Ofertas", "Temporada"],
  },
  {
    id: "GASTRONOMY",
    name: "Gastronomía",
    description: "Restaurante, cafetería, bar o comida para llevar.",
    orderTypes: ["TABLE", "TOGO", "DELIVERY", "EMPLOYEE"],
    channels: ["PedidosYa", "Rappi", "Yango", "Glovo", "iFood", "Propio"],
    dietary: true,
    weighted: false,
    tracksStockByDefault: true,
    categoryPresets: ["Entradas", "Platos fuertes", "Bebidas", "Postres", "Cafetería"],
  },
  {
    id: "RETAIL",
    name: "Tienda y moda",
    description: "Ropa, calzado, accesorios, electrónica o regalos.",
    orderTypes: ["COUNTER", "DELIVERY"],
    channels: ["WhatsApp", "Instagram", "Tienda web", "MercadoLibre", "Propio"],
    dietary: false,
    weighted: false,
    tracksStockByDefault: true,
    categoryPresets: ["Hombre", "Mujer", "Niños", "Accesorios", "Calzado"],
  },
  {
    id: "GROCERY",
    name: "Almacén y supermercado",
    description: "Almacén, verdulería, carnicería o minimercado. Vende por peso.",
    orderTypes: ["COUNTER", "DELIVERY"],
    channels: ["WhatsApp", "PedidosYa", "Rappi", "Propio"],
    dietary: true,
    weighted: true,
    tracksStockByDefault: true,
    categoryPresets: ["Almacén", "Frutas y verduras", "Carnes", "Lácteos", "Bebidas", "Limpieza"],
  },
  {
    id: "PHARMACY",
    name: "Farmacia y belleza",
    description: "Farmacia, perfumería o cosmética.",
    orderTypes: ["COUNTER", "DELIVERY"],
    channels: ["WhatsApp", "PedidosYa", "Rappi", "Propio"],
    dietary: false,
    weighted: false,
    tracksStockByDefault: true,
    categoryPresets: ["Medicamentos", "Cuidado personal", "Cuidado facial", "Perfumería", "Bebés"],
  },
  {
    id: "HARDWARE",
    name: "Ferretería y materiales",
    description: "Ferretería, corralón o pinturería. Vende por metro y por kilo.",
    orderTypes: ["COUNTER", "DELIVERY"],
    channels: ["WhatsApp", "MercadoLibre", "Propio"],
    dietary: false,
    weighted: true,
    tracksStockByDefault: true,
    categoryPresets: ["Herramientas", "Pinturas", "Electricidad", "Plomería", "Tornillería"],
  },
  {
    id: "SERVICES",
    name: "Servicios",
    description: "Peluquería, taller, consultorio o estudio. Vende tiempo y trabajos.",
    orderTypes: ["IN_STORE", "AT_HOME"],
    channels: [],
    dietary: false,
    weighted: false,
    tracksStockByDefault: false,
    categoryPresets: ["Servicios", "Productos", "Paquetes"],
  },
];

export function getBusinessType(id: string | null | undefined): BusinessType {
  return BUSINESS_TYPES.find((b) => b.id === id) ?? BUSINESS_TYPES[0];
}

export type UnitId = "UNIT" | "KG" | "G" | "L" | "M";

export const UNITS: { id: UnitId; name: string; short: string; step: number }[] = [
  { id: "UNIT", name: "Unidad", short: "u", step: 1 },
  { id: "KG", name: "Kilo", short: "kg", step: 0.001 },
  { id: "G", name: "Gramo", short: "g", step: 1 },
  { id: "L", name: "Litro", short: "L", step: 0.001 },
  { id: "M", name: "Metro", short: "m", step: 0.01 },
];

export function getUnit(id: string | null | undefined) {
  return UNITS.find((u) => u.id === id) ?? UNITS[0];
}

export function isFractionalUnit(id: string | null | undefined) {
  return getUnit(id).step < 1;
}

export function formatQuantity(quantity: number | string, unit: string | null | undefined) {
  const u = getUnit(unit);
  const n = Number(quantity);
  const text = Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return u.id === "UNIT" ? text : `${text} ${u.short}`;
}

export type PaymentMethodId = "CASH" | "CARD" | "TRANSFER" | "QR" | "OTHER";

export const PAYMENT_METHODS: { id: PaymentMethodId; name: string }[] = [
  { id: "CASH", name: "Efectivo" },
  { id: "CARD", name: "Tarjeta" },
  { id: "TRANSFER", name: "Transferencia" },
  { id: "QR", name: "QR o billetera" },
  { id: "OTHER", name: "Otro" },
];

export function paymentMethodLabel(id: string) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.name ?? id;
}

// Sistema Mercav POS

