import type {
  KosherKashrutPreference,
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
  supervised: "Con supervisión",
  self_declared: "Kosher autodeclarado",
  some_products: "Algunos productos kosher",
  some_dishes: "Algunos platos kosher",
  community_report: "Reporte comunitario",
  unknown: "Sin verificar",
  kosher_style: "Estilo judío, sin kashrut",
  disputed: "En disputa",
  closed: "Cerrado",
};

export const STATUS_HINT: Record<KosherStatus, string> = {
  certified: "Certificación de una agencia registrada en la ficha.",
  supervised: "Se informa supervisión rabínica, pero la ficha no tiene el certificado. Preguntá quién supervisa y qué cubre.",
  self_declared: "El lugar dice ser kosher. No hay certificación ni supervisión registrada.",
  some_products: "El local no es kosher: vende algunos productos kosher. Mirá el sello de cada producto.",
  some_dishes: "No es un lugar kosher: tiene algunos platos kosher hechos en una cocina que también hace comida que no lo es.",
  community_report: "Nota de un miembro. No equivale a un hechsher.",
  unknown: "Todavía nadie confirmó el estado de kashrut.",
  kosher_style: "Cocina judía o israelí sin supervisión de kashrut. No es un lugar kosher.",
  disputed: "Hay reportes que se contradicen. La revisión sigue abierta.",
  closed: "Reportado como cerrado.",
};

/** El espectro de confianza, de más a menos, para listas y para la página de kashrut. */
export const STATUS_ORDER: readonly KosherStatus[] = [
  "certified",
  "supervised",
  "self_declared",
  "community_report",
  "some_products",
  "some_dishes",
  "unknown",
  "kosher_style",
  "disputed",
  "closed",
];

export const KASHRUT_PREFERENCE: Record<KosherKashrutPreference, { label: string; hint: string }> = {
  certified: { label: "Solo certificados", hint: "Para comer y comprar, solo lugares con certificación registrada." },
  supervised: { label: "Con supervisión me alcanza", hint: "Lugares con certificación o con supervisión rabínica informada." },
  all: { label: "Mostrame todo", hint: "Todos los niveles, también los que solo tienen algunos productos o platos kosher." },
};

/**
 * ¿Se muestra este lugar con la preferencia de la persona? Solo filtra lugares de comida: una sinagoga o una
 * escuela no tienen nivel de kashrut. Sin preferencia, se muestra todo.
 */
export function matchesKashrutPreference(type: KosherPlaceType, status: KosherStatus, preference: KosherKashrutPreference | null | undefined) {
  if (!preference || preference === "all" || !isFoodPlace(type)) return true;
  if (preference === "certified") return status === "certified";
  return status === "certified" || status === "supervised";
}

/** Servicios de un lugar (KosherPlace.services). */
export const KOSHER_SERVICES = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  takeaway: "Para llevar",
  delivery: "Delivery",
  reservations: "Reservas",
  catering: "Catering",
  shabbat_meals: "Comidas de Shabat",
  wifi: "Wi-Fi",
  accessible: "Accesible",
} as const;

export type KosherServiceKey = keyof typeof KOSHER_SERVICES;

export const isKosherService = (value: string): value is KosherServiceKey => value in KOSHER_SERVICES;

/** La dirección, salvo que sea solo el nombre de la ciudad (pasa con lugares importados sin calle): así no se repite. */
export function streetAddress(place: { address?: string | null; city: string }) {
  const address = place.address?.trim();
  return address && address.toLowerCase() !== place.city.trim().toLowerCase() ? address : null;
}

/** "$$" para priceLevel 2. */
export const priceLabel = (level: number | null | undefined) => (level && level >= 1 && level <= 4 ? "$".repeat(level) : null);

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
  if (status === "supervised" || status === "community_report" || status === "self_declared") return "reported";
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
