import type { LoyaltyEventView, LoyaltyTypeKey } from "@/lib/business/loyalty/types";

/** Formatos del panel en el navegador (fechas en la zona del dispositivo). */

const DAY = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });
const DAY_TIME = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export const formatDay = (iso: string | null) => (iso ? DAY.format(new Date(iso)) : "—");
export const formatDayTime = (iso: string) => DAY_TIME.format(new Date(iso));

/** "hoy", "ayer", "hace 5 días" o la fecha. */
export function relativeDay(iso: string | null, now = new Date()) {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return DAY.format(d);
}

/** Cumpleaños guardado como MM-DD. */
export function formatBirthday(mmdd: string | null) {
  if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return "—";
  const month = MONTHS[Number(mmdd.slice(0, 2)) - 1];
  return month ? `${Number(mmdd.slice(3, 5))} de ${month}` : "—";
}

export const unitWord = (type: LoyaltyTypeKey, n: number) => (type === "STAMPS" ? (Math.abs(n) === 1 ? "sello" : "sellos") : Math.abs(n) === 1 ? "punto" : "puntos");

export const EVENT_LABELS: Record<LoyaltyEventView["type"], string> = {
  JOIN: "Se sumó al programa",
  WELCOME: "Regalo de bienvenida",
  STAMP: "Sumó sellos",
  POINTS: "Sumó puntos",
  REDEEM: "Canjeó un premio",
  ADJUST: "Ajuste manual",
  EXPIRE: "Venció el saldo",
  BIRTHDAY: "Regalo de cumpleaños",
  REFERRAL: "Invitó a un amigo",
};

export const SOURCE_LABELS: Record<LoyaltyEventView["source"], string> = {
  STAFF: "Mostrador",
  SELF_SERVICE: "Autoservicio",
  SYSTEM: "Automático",
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
// creado por pato dev y askforvini
