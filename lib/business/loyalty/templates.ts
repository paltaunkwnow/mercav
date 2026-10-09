import type { BenefitKey, LoyaltyDesign, LoyaltyIconKey, LoyaltyRules, LoyaltyTypeKey, PaletteKey, ResolvedPalette } from "./types";

/** Rubros: cada uno sugiere ícono, premio, regla y diseño. El negocio puede cambiar todo. */
export type BusinessTypeTemplate = {
  key: string;
  label: string;
  icon: LoyaltyIconKey;
  type: LoyaltyTypeKey;
  /** STAMPS: sellos para el premio. POINTS: puntos para el premio. */
  goal: number;
  rewardName: string;
  /** POINTS: 1 punto cada `unitAmount` de compra. */
  unitAmount?: number;
  benefits: BenefitKey[];
  palette: PaletteKey;
  programName: string;
};

export const BUSINESS_TYPES: BusinessTypeTemplate[] = [
  { key: "CAFE", label: "Cafetería", icon: "coffee", type: "STAMPS", goal: 10, rewardName: "Café gratis", benefits: ["descuentos", "promociones", "recompensas", "experiencias"], palette: "noche", programName: "Club del café" },
  { key: "PANADERIA", label: "Panadería o pastelería", icon: "croissant", type: "STAMPS", goal: 10, rewardName: "Pan dulce de regalo", benefits: ["descuentos", "promociones", "recompensas", "cumpleanos"], palette: "espresso", programName: "Club de la panadería" },
  { key: "RESTAURANTE", label: "Restaurante", icon: "utensils", type: "POINTS", goal: 100, unitAmount: 10, rewardName: "Postre gratis", benefits: ["descuentos", "promociones", "recompensas", "eventos"], palette: "vino", programName: "Club de clientes" },
  { key: "PIZZERIA", label: "Pizzería o comida rápida", icon: "pizza", type: "STAMPS", goal: 8, rewardName: "Pizza mediana gratis", benefits: ["descuentos", "promociones", "recompensas", "envios"], palette: "noche", programName: "Club de la pizza" },
  { key: "HELADERIA", label: "Heladería", icon: "icecream", type: "STAMPS", goal: 8, rewardName: "Helado gratis", benefits: ["descuentos", "promociones", "recompensas", "cumpleanos"], palette: "oceano", programName: "Club del helado" },
  { key: "BAR", label: "Bar o cervecería", icon: "beer", type: "STAMPS", goal: 10, rewardName: "Trago de la casa", benefits: ["descuentos", "promociones", "recompensas", "eventos"], palette: "noche", programName: "Club de la barra" },
  { key: "PELUQUERIA", label: "Peluquería", icon: "scissors", type: "STAMPS", goal: 6, rewardName: "Corte gratis", benefits: ["descuentos", "promociones", "recompensas", "prioridad"], palette: "perla", programName: "Club de belleza" },
  { key: "BARBERIA", label: "Barbería", icon: "scissors", type: "STAMPS", goal: 6, rewardName: "Corte gratis", benefits: ["descuentos", "promociones", "recompensas", "prioridad"], palette: "noche", programName: "Club de la barbería" },
  { key: "ESTETICA", label: "Estética o spa", icon: "sparkles", type: "POINTS", goal: 150, unitAmount: 10, rewardName: "Tratamiento de regalo", benefits: ["descuentos", "promociones", "recompensas", "experiencias"], palette: "vino", programName: "Club de bienestar" },
  { key: "GIMNASIO", label: "Gimnasio o estudio", icon: "dumbbell", type: "STAMPS", goal: 8, rewardName: "Clase gratis", benefits: ["clases", "promociones", "recompensas", "eventos"], palette: "noche", programName: "Club de entrenamiento" },
  { key: "LAVADERO", label: "Lavadero de autos", icon: "car", type: "STAMPS", goal: 5, rewardName: "Lavado gratis", benefits: ["descuentos", "promociones", "recompensas", "prioridad"], palette: "oceano", programName: "Club del lavado" },
  { key: "LAVANDERIA", label: "Lavandería", icon: "shirt", type: "STAMPS", goal: 8, rewardName: "Lavado de regalo", benefits: ["descuentos", "promociones", "recompensas", "envios"], palette: "oceano", programName: "Club de la lavandería" },
  { key: "FARMACIA", label: "Farmacia", icon: "pill", type: "POINTS", goal: 100, unitAmount: 10, rewardName: "10 % de descuento", benefits: ["descuentos", "promociones", "recompensas", "envios"], palette: "bosque", programName: "Club de salud" },
  { key: "FLORERIA", label: "Florería", icon: "flower", type: "STAMPS", goal: 6, rewardName: "Ramo de regalo", benefits: ["descuentos", "promociones", "regalos", "envios"], palette: "perla", programName: "Club de las flores" },
  { key: "TIENDA", label: "Tienda o comercio", icon: "bag", type: "POINTS", goal: 100, unitAmount: 10, rewardName: "Regalo sorpresa", benefits: ["descuentos", "promociones", "recompensas", "experiencias"], palette: "noche", programName: "Club de clientes" },
  { key: "LIBRERIA", label: "Librería o papelería", icon: "book", type: "STAMPS", goal: 10, rewardName: "Cuaderno de regalo", benefits: ["descuentos", "promociones", "recompensas", "eventos"], palette: "bosque", programName: "Club de lectores" },
  { key: "MASCOTAS", label: "Veterinaria o tienda de mascotas", icon: "paw", type: "STAMPS", goal: 6, rewardName: "Baño gratis", benefits: ["descuentos", "promociones", "recompensas", "cumpleanos"], palette: "bosque", programName: "Club de mascotas" },
  { key: "KOSHER", label: "Comercio kosher", icon: "star-of-david", type: "POINTS", goal: 100, unitAmount: 10, rewardName: "Producto de regalo", benefits: ["descuentos", "promociones", "recompensas", "eventos"], palette: "oceano", programName: "Club kosher" },
  { key: "OTRO", label: "Otro rubro", icon: "store", type: "STAMPS", goal: 10, rewardName: "Premio", benefits: ["descuentos", "promociones", "recompensas", "experiencias"], palette: "noche", programName: "Club de clientes" },
];

export function businessTemplate(key: string | null | undefined): BusinessTypeTemplate {
  return BUSINESS_TYPES.find((t) => t.key === key) ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}

export const BENEFITS: Record<BenefitKey, { label: string }> = {
  descuentos: { label: "Descuentos" },
  promociones: { label: "Promociones" },
  recompensas: { label: "Recompensas" },
  experiencias: { label: "Experiencias" },
  eventos: { label: "Eventos" },
  regalos: { label: "Regalos" },
  cumpleanos: { label: "Cumpleaños" },
  prioridad: { label: "Prioridad" },
  envios: { label: "Envíos" },
  clases: { label: "Clases" },
};

export const BENEFIT_KEYS = Object.keys(BENEFITS) as BenefitKey[];

export const ICON_KEYS: LoyaltyIconKey[] = [
  "coffee", "croissant", "utensils", "pizza", "icecream", "beer", "scissors", "sparkles", "dumbbell", "car", "shirt", "pill", "flower", "bag", "book", "paw", "star-of-david", "store",
];

export const PALETTES: Record<Exclude<PaletteKey, "custom">, ResolvedPalette & { label: string }> = {
  noche: { label: "Negro y oro", base: "#0b0b0c", baseSoft: "#1a1814", accent: "#d4af37", text: "#f5f1e6", muted: "#a59f90", light: false },
  espresso: { label: "Espresso", base: "#21140d", baseSoft: "#33221a", accent: "#e2c08d", text: "#f6ecdc", muted: "#b9a48b", light: false },
  bosque: { label: "Bosque", base: "#0e231a", baseSoft: "#173528", accent: "#cdb67a", text: "#eef1e8", muted: "#9fb1a3", light: false },
  oceano: { label: "Océano", base: "#0a1a2d", baseSoft: "#122a45", accent: "#a9c8e8", text: "#eef4fb", muted: "#93a8bf", light: false },
  vino: { label: "Vino", base: "#290b13", baseSoft: "#3d1420", accent: "#e3b3a2", text: "#f8ece8", muted: "#bf9a93", light: false },
  perla: { label: "Perla", base: "#f3eee5", baseSoft: "#e7dfd1", accent: "#9a7414", text: "#1a1714", muted: "#6b6253", light: true },
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function mix(hex: string, other: string, amount: number) {
  const c = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const out = [1, 3, 5].map((i) => Math.round(c(hex, i) * (1 - amount) + c(other, i) * amount).toString(16).padStart(2, "0"));
  return `#${out.join("")}`;
}

/** Colores finales de la tarjeta. Con paleta propia, el texto se elige por contraste. */
export function resolvePalette(design: Pick<LoyaltyDesign, "palette" | "base" | "accent">): ResolvedPalette {
  if (design.palette !== "custom") return PALETTES[design.palette] ?? PALETTES.noche;
  const base = design.base && HEX.test(design.base) ? design.base : PALETTES.noche.base;
  const accent = design.accent && HEX.test(design.accent) ? design.accent : PALETTES.noche.accent;
  const light = luminance(base) > 0.4;
  const text = light ? "#1a1714" : "#f5f1e6";
  return { base, baseSoft: mix(base, light ? "#000000" : "#ffffff", 0.08), accent, text, muted: mix(text, base, 0.4), light };
}

export function defaultDesign(template: BusinessTypeTemplate, displayName: string): LoyaltyDesign {
  return {
    palette: template.palette,
    base: null,
    accent: null,
    logoDataUrl: null,
    displayName,
    subtitle: "Tarjeta de fidelización",
    backTitle: "Acumulá más beneficios",
    benefits: template.benefits.slice(0, 4),
    icon: template.icon,
  };
}

export function defaultRules(template: BusinessTypeTemplate): LoyaltyRules {
  const stamps = template.type === "STAMPS";
  return {
    stampsGoal: stamps ? template.goal : 10,
    maxPerAction: stamps ? 3 : 1000,
    maxPerDay: stamps ? 3 : 2000,
    cooldownMinutes: stamps ? 2 : 0,
    pointsPerUnit: 1,
    unitAmount: template.unitAmount ?? 10,
    expiresDays: null,
    welcomeBonus: 0,
    birthdayBonus: stamps ? 1 : 20,
    referralBonus: stamps ? 1 : 20,
    selfService: false,
    selfServiceMaxPerDay: 1,
    tiers: [],
  };
}
// creado por pato dev y askforvini
