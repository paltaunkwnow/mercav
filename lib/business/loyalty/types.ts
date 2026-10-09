/** Tipos de Fidelización. Sin dependencias: cliente, servidor y tests. */

export type LoyaltyTypeKey = "STAMPS" | "POINTS";

export type LoyaltyTier = { name: string; minLifetime: number; perk: string };

export type LoyaltyRules = {
  /** STAMPS: sellos que hacen falta para el premio principal. */
  stampsGoal: number;
  /** Tope de sellos o puntos que el cajero puede sumar de una vez. */
  maxPerAction: number;
  /** Tope de sellos o puntos por tarjeta por día. */
  maxPerDay: number;
  /** Minutos mínimos entre dos sumas a la misma tarjeta (0 = sin espera). */
  cooldownMinutes: number;
  /** POINTS: puntos que da cada `unitAmount` de compra. */
  pointsPerUnit: number;
  /** POINTS: monto de compra (en la moneda de la empresa) que da `pointsPerUnit` puntos. */
  unitAmount: number;
  /** El saldo vence después de N días sin visitas (null = no vence). */
  expiresDays: number | null;
  welcomeBonus: number;
  birthdayBonus: number;
  /** Para quien refiere, cuando el referido suma por primera vez. */
  referralBonus: number;
  /** QR rotativo en el mostrador para que el cliente sume solo. */
  selfService: boolean;
  /** Tope de sellos por autoservicio por tarjeta por día. */
  selfServiceMaxPerDay: number;
  /** Niveles por puntos o sellos acumulados en total (de menor a mayor). */
  tiers: LoyaltyTier[];
};

export type PaletteKey = "noche" | "espresso" | "bosque" | "oceano" | "vino" | "perla" | "custom";

export type BenefitKey =
  | "descuentos"
  | "promociones"
  | "recompensas"
  | "experiencias"
  | "eventos"
  | "regalos"
  | "cumpleanos"
  | "prioridad"
  | "envios"
  | "clases";

/** Íconos disponibles para el rubro y los sellos (se mapean a componentes en el cliente). */
export type LoyaltyIconKey =
  | "coffee"
  | "croissant"
  | "utensils"
  | "icecream"
  | "beer"
  | "scissors"
  | "sparkles"
  | "dumbbell"
  | "car"
  | "shirt"
  | "pill"
  | "bag"
  | "book"
  | "paw"
  | "star-of-david"
  | "pizza"
  | "flower"
  | "store";

export type LoyaltyDesign = {
  palette: PaletteKey;
  /** Solo con palette "custom". Hex #rrggbb. */
  base: string | null;
  accent: string | null;
  /** Logo del negocio como data URL (PNG o WebP, hasta ~200 KB). */
  logoDataUrl: string | null;
  /** Nombre en la tarjeta. */
  displayName: string;
  subtitle: string;
  backTitle: string;
  benefits: BenefitKey[];
  icon: LoyaltyIconKey;
};

export type ResolvedPalette = { base: string; baseSoft: string; accent: string; text: string; muted: string; light: boolean };

export type RewardView = { id: string; name: string; description: string | null; cost: number; active: boolean };

export type ProgressView = {
  goal: number;
  current: number;
  remaining: number;
  percent: number;
  nextReward: { name: string; cost: number } | null;
  available: { id: string; name: string; cost: number }[];
  label: string;
};

export type TierView = { current: LoyaltyTier | null; next: LoyaltyTier | null; toNext: number | null };

/** Lo que se muestra de una tarjeta (al cliente o al cajero). */
export type LoyaltyCardView = {
  id: string;
  serial: string;
  customerName: string;
  balance: number;
  lifetime: number;
  visits: number;
  lastVisitAt: string | null;
  expiresOn: string | null;
  status: "ACTIVE" | "BLOCKED";
  referralCode: string;
  progress: ProgressView;
  tier: TierView;
  createdAt: string;
  /** Número de cliente dentro del programa. */
  customerNo: number;
  /** Titular: sin cuenta, vinculada esperando validación, o validada con documento en el negocio. */
  holderStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
};

/** Programa como lo ven las pantallas (sin secretos). */
export type LoyaltyProgramView = {
  id: string;
  slug: string;
  name: string;
  type: LoyaltyTypeKey;
  businessType: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  rules: LoyaltyRules;
  design: LoyaltyDesign;
  rewards: RewardView[];
  workspace: { name: string; slug: string; country: string; currency: string };
};

export type LoyaltyEventView = {
  id: string;
  type: "JOIN" | "WELCOME" | "STAMP" | "POINTS" | "REDEEM" | "ADJUST" | "EXPIRE" | "BIRTHDAY" | "REFERRAL";
  amount: number;
  balanceAfter: number;
  rewardName: string | null;
  source: "STAFF" | "SELF_SERVICE" | "SYSTEM";
  note: string | null;
  createdAt: string;
};
// creado por pato dev y askforvini
