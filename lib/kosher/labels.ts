import type {
  KosherChesedKind,
  KosherDenomination,
  KosherEventKind,
  KosherPrayer,
  KosherFood,
  KosherNusach,
  KosherPlaceType,
  KosherStatus,
  KosherStockCategory,
  KosherStream,
} from "@prisma/client";

export const PLACE_TYPES: Record<KosherPlaceType, string> = {
  restaurant: "Restaurante",
  bakery: "Panadería",
  butcher: "Carnicería",
  grocery_branch: "Sucursal de supermercado",
  judaica: "Judaica",
  synagogue: "Sinagoga",
  mikvah: "Mikvé",
  school: "Escuela",
  hotel: "Hotel",
  community: "Centro comunitario",
  museum: "Museo",
};

export const STATUS: Record<KosherStatus, string> = {
  certified: "Certificado",
  community_report: "Reporte comunitario",
  unknown: "Sin verificar",
  disputed: "En disputa",
  closed: "Cerrado",
};

export const STATUS_HINT: Record<KosherStatus, string> = {
  certified: "Certificación de una agencia registrada en la ficha.",
  community_report: "Nota de un miembro. No equivale a un hechsher.",
  unknown: "Todavía nadie confirmó el estado de kashrut.",
  disputed: "Hay reportes que se contradicen. La revisión sigue abierta.",
  closed: "Reportado como cerrado.",
};

export const FOOD: Record<KosherFood, string> = {
  meat: "Carne (basari)",
  dairy: "Lácteo (jalavi)",
  parve: "Parve",
};

export const STOCK: Record<KosherStockCategory, string> = {
  meat: "Carne",
  wine: "Vino",
  matzah: "Matzá",
  cheese: "Queso",
  frozen: "Congelados",
  bakery: "Panificados",
};

export const NUSACH: Record<KosherNusach, string> = {
  ashkenaz: "Ashkenaz",
  sefarad: "Sefarad",
  edot_hamizrach: "Edot HaMizraj",
  spanish_portuguese: "Español-portugués",
  yemenite: "Teimani",
  chabad: "Jabad",
  other: "Otro",
};

export const DENOMINATION: Record<KosherDenomination, string> = {
  orthodox: "Ortodoxa",
  conservative: "Conservadora / Masortí",
  other: "Otra",
};

export const STREAM: Record<KosherStream, string> = {
  modern: "Ortodoxia moderna",
  yeshivish: "Yeshivish",
  chabad: "Jabad",
  hasidic: "Jasídica",
  sephardi: "Sefaradí",
  other: "Otra",
};

export const SCOPES = {
  eat: { label: "Comer", types: ["restaurant", "bakery", "butcher", "hotel"] },
  shop: { label: "Comprar", types: ["grocery_branch", "judaica"] },
  kehilla: { label: "Kehilá", types: ["community", "school", "mikvah", "museum"] },
  tefilla: { label: "Tefilá", types: ["synagogue"] },
} as const satisfies Record<string, { label: string; types: KosherPlaceType[] }>;

export type ScopeKey = keyof typeof SCOPES;

export const FOOD_TYPES: readonly KosherPlaceType[] = ["restaurant", "bakery", "butcher", "hotel", "grocery_branch"];

/** Kashrut status only means something where food is served or sold. */
export const isFoodPlace = (type: KosherPlaceType) => FOOD_TYPES.includes(type);

export type StatusTone = "seal" | "reported" | "danger" | "muted";

export function placeTone(type: KosherPlaceType, status: KosherStatus): StatusTone {
  if (status === "closed" || status === "disputed" || isFoodPlace(type)) return statusTone(status);
  return "reported";
}

export function statusTone(status: KosherStatus): StatusTone {
  if (status === "certified") return "seal";
  if (status === "community_report") return "reported";
  if (status === "disputed") return "danger";
  return "muted";
}

/** Hex values for map layers, which can't read CSS variables. */
export const TONE_HEX: Record<StatusTone, string> = {
  seal: "#D4AF37",
  reported: "#6FA8DC",
  danger: "#E0625A",
  muted: "#8A857C",
};

export const STOCK_STALE_DAYS = 14;

export const EVENT_KIND: Record<KosherEventKind, string> = {
  shiur: "Shiur",
  tefila: "Tefilá",
  jag: "Jag",
  comunidad: "Comunidad",
  juventud: "Juventud",
  otro: "Otro",
};

export const PRAYER: Record<KosherPrayer, string> = {
  shacharit: "Shajarit",
  mincha: "Minjá",
  maariv: "Arvit",
};

export const CHESED_KIND: Record<KosherChesedKind, string> = {
  volunteer: "Voluntariado",
  bikur_cholim: "Bikur jolim",
  donation: "Donación",
  need: "Pedido de ayuda",
};

export const MEALS = {
  friday_dinner: "Cena de viernes",
  shabbat_lunch: "Almuerzo de Shabat",
  seuda_shlishit: "Seudá shlishit",
} as const;

export const MINYAN_SIZE = 10;
