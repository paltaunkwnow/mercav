/**
 * Catálogo de Mercav Privacy (privacy.mercav.lat). Los precios son en USDT; el equivalente en bolivianos, SOL y XRP
 * se calcula aparte con la cotización del momento (lib/privacy/rates.ts). Todo se vende a pedido.
 */

export type PrivacyCategory = "billeteras-frias" | "celulares" | "instalacion";

export type PrivacyProduct = {
  slug: string;
  category: PrivacyCategory;
  brand: string;
  name: string;
  /** Precio desde, en USDT. */
  priceUsdt: number;
  /** Una línea para la tarjeta del catálogo. */
  tagline: string;
  colors?: string[];
  storage?: string;
  condition: "nuevo" | "reacondicionado";
  /** Nota de estado visible en la ficha (por ejemplo, "Reacondicionado por Amazon (Amazon Renewed)"). */
  conditionNote?: string;
  /** Datos técnicos del equipo. Solo lo que es seguro: lo dudoso no va. */
  specs: string[];
  /** Hasta cuándo Google garantiza actualizaciones de seguridad (celulares). */
  securityUpdatesUntil?: string;
  /** Aviso destacado en la ficha y en la tarjeta. */
  warning?: string;
  /** Para verificar el equipo con la app oficial del fabricante (billeteras). */
  verifyWith?: { app: string; url: string };
};

/** Lo que trae cada celular, y lo que incluye el servicio de instalación (con otra duración de VPN). */
export const PHONE_BUNDLE = {
  vpnMonths: 6,
  items: [
    "Sistema operativo reforzado, basado en GrapheneOS, instalado desde la versión oficial firmada y sin modificaciones.",
    "Dos perfiles configurados: uno con Google Play en sandbox y otro privado, sin servicios de Google, con su propio cifrado.",
    "Mullvad VPN sin registros, ya activada.",
    "Session instalado: mensajería cifrada de extremo a extremo, sin número de teléfono.",
    "PIN de borrado (duress PIN): si lo ingresás en vez de tu PIN, el teléfono se borra por completo.",
  ],
};

export const INSTALL_SERVICE = {
  slug: "instalacion-sistema-reforzado",
  priceUsdt: 99.99,
  vpnMonths: 3,
};

/** Funciones del sistema reforzado, en términos técnicos. Todas son de GrapheneOS. */
export const HARDENED_OS_FEATURES: { title: string; body: string }[] = [
  { title: "Verified boot y atestación", body: "Arranque verificado con la clave del sistema y atestación por hardware: con la app Auditor comprobás que el sistema es el oficial y no fue alterado." },
  { title: "Cifrado con el Titan M2", body: "Almacenamiento cifrado por archivo, con las claves protegidas por el chip de seguridad Titan M2 y limitación de intentos por hardware." },
  { title: "Perfiles aislados", body: "Cada perfil de usuario tiene su propio cifrado y sus propias apps. El perfil privado no comparte nada con el de Google." },
  { title: "Google Play en sandbox", body: "Google Play corre como una app común, sin privilegios especiales del sistema, y solo en el perfil donde lo instales." },
  { title: "Permisos de red y sensores", body: "Le podés sacar a cualquier app el acceso a internet o a los sensores. Storage Scopes y Contact Scopes limitan qué archivos y contactos ve." },
  { title: "PIN de borrado", body: "Un PIN o contraseña de coacción (duress) que, al ingresarse, borra el dispositivo y las eSIM de forma irreversible." },
  { title: "Reinicio automático", body: "Si el teléfono no se desbloquea en el tiempo que elijas, se reinicia solo y los datos vuelven a quedar cifrados en reposo." },
  { title: "Puerto USB-C bloqueado", body: "Con el teléfono bloqueado, el puerto USB-C no transmite datos: corta ataques por cable." },
  { title: "Mitigaciones de exploits", body: "hardened_malloc, endurecimiento del kernel y, en Pixel 8 y posteriores, Memory Tagging Extension (MTE) por hardware." },
  { title: "Red", body: "Dirección MAC aleatoria por conexión y la VPN siempre activa con bloqueo de conexiones sin VPN." },
];

const LEDGER_VERIFY = { app: "Ledger Wallet (Ledger Live)", url: "https://www.ledger.com/ledger-live" };
const TREZOR_VERIFY = { app: "Trezor Suite", url: "https://trezor.io/trezor-suite" };

export const PRODUCTS: PrivacyProduct[] = [
  // Billeteras frías
  {
    slug: "ledger-nano-x",
    category: "billeteras-frias",
    brand: "Ledger",
    name: "Ledger Nano X",
    priceUsdt: 189.99,
    tagline: "Con Bluetooth: firmás desde el celular sin cables.",
    condition: "nuevo",
    specs: ["Bluetooth y USB-C", "Chip Secure Element", "Batería interna"],
    verifyWith: LEDGER_VERIFY,
  },
  {
    slug: "ledger-nano-s-plus",
    category: "billeteras-frias",
    brand: "Ledger",
    name: "Ledger Nano S Plus",
    priceUsdt: 159.99,
    tagline: "La Ledger por cable, en cinco colores.",
    colors: ["Sapphire", "Neptune", "Emerald Green", "Gold", "Crimson Magenta"],
    condition: "nuevo",
    specs: ["USB-C", "Chip Secure Element"],
    verifyWith: LEDGER_VERIFY,
  },
  {
    slug: "ledger-nano-gen5",
    category: "billeteras-frias",
    brand: "Ledger",
    name: "Ledger Nano Gen5",
    priceUsdt: 239.99,
    tagline: "La generación más nueva de Ledger.",
    condition: "nuevo",
    specs: ["Chip Secure Element"],
    verifyWith: LEDGER_VERIFY,
  },
  {
    slug: "tangem-wallet-pack-2",
    category: "billeteras-frias",
    brand: "Tangem",
    name: "Tangem Wallet (pack de 2)",
    priceUsdt: 99.99,
    tagline: "Dos tarjetas NFC: una para usar y otra de respaldo.",
    condition: "nuevo",
    specs: ["Tarjetas NFC, sin batería", "Chip seguro en cada tarjeta", "La segunda tarjeta es el respaldo de la primera"],
    verifyWith: { app: "Tangem", url: "https://tangem.com" },
  },
  {
    slug: "trezor-safe-3",
    category: "billeteras-frias",
    brand: "Trezor",
    name: "Trezor Safe 3",
    priceUsdt: 89.99,
    tagline: "Firmware de código abierto y chip seguro, al mejor precio.",
    condition: "nuevo",
    specs: ["USB-C", "Chip Secure Element", "Firmware de código abierto", "Respaldo Shamir (SLIP-39)"],
    verifyWith: TREZOR_VERIFY,
  },
  {
    slug: "trezor-safe-5",
    category: "billeteras-frias",
    brand: "Trezor",
    name: "Trezor Safe 5",
    priceUsdt: 189.99,
    tagline: "Pantalla táctil a color y respuesta háptica.",
    condition: "nuevo",
    specs: ["Pantalla táctil a color", "Respuesta háptica", "Chip Secure Element", "Firmware de código abierto"],
    verifyWith: TREZOR_VERIFY,
  },
  {
    slug: "trezor-safe-7",
    category: "billeteras-frias",
    brand: "Trezor",
    name: "Trezor Safe 7",
    priceUsdt: 310.99,
    tagline: "La más nueva de Trezor.",
    condition: "nuevo",
    specs: ["Firmware de código abierto"],
    verifyWith: TREZOR_VERIFY,
  },

  // Celulares con sistema reforzado
  {
    slug: "pixel-10-pro",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 10 Pro",
    priceUsdt: 1499.99,
    tagline: "El más completo, con actualizaciones hasta 2032.",
    storage: "128 GB",
    colors: ["Jade", "Moonstone", "Porcelain", "Obsidian"],
    condition: "nuevo",
    specs: ["Tensor G5", "Chip de seguridad Titan M2", "Memory Tagging Extension (MTE)"],
    securityUpdatesUntil: "agosto de 2032",
  },
  {
    slug: "pixel-10",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 10",
    priceUsdt: 1199.99,
    tagline: "La generación actual, con actualizaciones hasta 2032.",
    storage: "128 GB",
    colors: ["Indigo", "Frost", "Obsidian"],
    condition: "nuevo",
    specs: ["Tensor G5", "Chip de seguridad Titan M2", "Memory Tagging Extension (MTE)"],
    securityUpdatesUntil: "agosto de 2032",
  },
  {
    slug: "pixel-9-pro-xl",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 9 Pro XL",
    priceUsdt: 999.99,
    tagline: "Pantalla grande y 256 GB, reacondicionado.",
    storage: "256 GB",
    colors: ["Obsidian", "Hazel", "Porcelain", "Rose Quartz"],
    condition: "reacondicionado",
    conditionNote: "Reacondicionado por Amazon (Amazon Renewed).",
    specs: ["Tensor G4", "Chip de seguridad Titan M2", "Memory Tagging Extension (MTE)"],
    securityUpdatesUntil: "agosto de 2031",
  },
  {
    slug: "pixel-8",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 8",
    priceUsdt: 899.99,
    tagline: "El primero con MTE, con actualizaciones hasta 2030.",
    storage: "128 GB",
    colors: ["Obsidian"],
    condition: "nuevo",
    specs: ["Tensor G3", "Chip de seguridad Titan M2", "Memory Tagging Extension (MTE)"],
    securityUpdatesUntil: "octubre de 2030",
  },
  {
    slug: "pixel-7-pro",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 7 Pro",
    priceUsdt: 669.99,
    tagline: "Pantalla grande, con actualizaciones hasta octubre de 2027.",
    storage: "128 GB",
    colors: ["Obsidian"],
    condition: "nuevo",
    specs: ["Tensor G2", "Chip de seguridad Titan M2"],
    securityUpdatesUntil: "octubre de 2027",
  },
  {
    slug: "pixel-7",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 7",
    priceUsdt: 599.99,
    tagline: "Compacto, con actualizaciones hasta octubre de 2027.",
    storage: "128 GB",
    colors: ["Obsidian"],
    condition: "nuevo",
    specs: ["Tensor G2", "Chip de seguridad Titan M2"],
    securityUpdatesUntil: "octubre de 2027",
  },
  {
    slug: "pixel-6",
    category: "celulares",
    brand: "Google",
    name: "Google Pixel 6",
    priceUsdt: 499.99,
    tagline: "El de entrada, con soporte extendido.",
    storage: "128 GB",
    colors: ["Sorta Seafoam", "Stormy Black"],
    condition: "nuevo",
    specs: ["Tensor", "Chip de seguridad Titan M2"],
    securityUpdatesUntil: "octubre de 2026",
    warning:
      "Google garantizó sus actualizaciones hasta octubre de 2026. Desde ahí recibe el soporte extendido de GrapheneOS, que sigue parcheando el sistema pero ya no el firmware de Google. Sirve para empezar; para el máximo nivel, elegí un Pixel 8 o posterior.",
  },
];

export const CATEGORIES: Record<PrivacyCategory, { title: string; lead: string }> = {
  "billeteras-frias": {
    title: "Billeteras frías",
    lead: "Tus claves fuera de internet, en un chip seguro. Selladas de fábrica, nunca abiertas ni inicializadas.",
  },
  celulares: {
    title: "Celulares con sistema reforzado",
    lead: "Pixel con un sistema basado en GrapheneOS, Mullvad VPN y Session, listos para usar.",
  },
  instalacion: {
    title: "Instalación en tu Pixel",
    lead: "Le instalamos el sistema reforzado a tu propio Pixel compatible.",
  },
};

/** Pagos: en SOL o XRP; con QR en bolivianos, coordinando por WhatsApp. */
export const PAYMENT = {
  cryptos: ["SOL", "XRP"] as const,
  qrByWhatsApp: true,
  /** wa.me/<número>; sin número configurado, el botón de WhatsApp no se muestra. */
  whatsapp: process.env.NEXT_PUBLIC_PRIVACY_WHATSAPP?.replace(/\D/g, "") || null,
};

export const DELIVERY = {
  /** Todo es a pedido. */
  weeks: [2, 6] as const,
  coverage: "Envíos a toda Bolivia. Pronto, también internacionales.",
};

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug) ?? null;
export const productsIn = (category: PrivacyCategory) => PRODUCTS.filter((p) => p.category === category);
// creado por pato dev y askforvini
