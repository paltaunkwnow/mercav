import { LATAM_COUNTRIES } from "@/lib/geo/latam";

/**
 * Horario semanal de un lugar (KosherPlace.hours), en hora local del lugar.
 * Claves "0" a "6" (0 = domingo). Un turno que cierra antes de abrir pasa la medianoche: { open: "21:00", close: "01:00" }.
 * "24:00" cierra a la medianoche. Un día sin clave (o con lista vacía) está cerrado.
 */
export type HoursPeriod = { open: string; close: string };
export type WeeklyHours = Partial<Record<DayKey, HoursPeriod[]>>;
export type DayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export const DAY_KEYS: readonly DayKey[] = ["0", "1", "2", "3", "4", "5", "6"];
/** Lunes primero, como se lee un horario en español. */
export const WEEK_ORDER: readonly DayKey[] = ["1", "2", "3", "4", "5", "6", "0"];
export const DAY_NAMES: Record<DayKey, string> = { "0": "Domingo", "1": "Lunes", "2": "Martes", "3": "Miércoles", "4": "Jueves", "5": "Viernes", "6": "Sábado" };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const MAX_PERIODS_PER_DAY = 4;

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Valida y limpia lo que venga de la base o de un formulario. Devuelve null si no hay ningún turno válido. */
export function parseHours(value: unknown): WeeklyHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: WeeklyHours = {};
  let any = false;
  for (const day of DAY_KEYS) {
    const raw = (value as Record<string, unknown>)[day];
    if (!Array.isArray(raw)) continue;
    const periods = raw
      .filter((p): p is HoursPeriod => !!p && typeof p === "object" && typeof (p as HoursPeriod).open === "string" && typeof (p as HoursPeriod).close === "string")
      .map((p) => ({ open: p.open.trim(), close: p.close.trim() }))
      .filter((p) => TIME.test(p.open) && TIME.test(p.close) && p.open !== "24:00" && p.open !== p.close)
      .sort((a, b) => minutesOf(a.open) - minutesOf(b.open))
      .slice(0, MAX_PERIODS_PER_DAY);
    if (periods.length) {
      out[day] = periods;
      any = true;
    }
  }
  return any ? out : null;
}

/** Zona horaria del lugar: la propia o la del país (capital). */
export function placeTimezone(place: { timezone?: string | null; countryCode?: string | null }) {
  if (place.timezone) return place.timezone;
  return LATAM_COUNTRIES.find((c) => c.code === place.countryCode)?.timezone ?? "UTC";
}

/** Día de la semana y minuto del día en la zona del lugar. */
function localNow(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day: weekday, minute: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Turnos como intervalos en minutos desde el domingo 00:00; los que pasan la medianoche siguen en el día de después. */
function weekIntervals(hours: WeeklyHours) {
  const out: { start: number; end: number; day: DayKey; period: HoursPeriod }[] = [];
  for (const day of DAY_KEYS) {
    for (const period of hours[day] ?? []) {
      const start = Number(day) * 1440 + minutesOf(period.open);
      let length = minutesOf(period.close) - minutesOf(period.open);
      if (length <= 0) length += 1440;
      out.push({ start, end: start + length, day, period });
    }
  }
  return out;
}

const WEEK = 7 * 1440;

export type OpenState =
  | { kind: "unknown" }
  | { kind: "open"; closesAt: string; minutesLeft: number; closesDay: DayKey }
  | { kind: "closed"; opensAt: string; minutesUntil: number; opensDay: DayKey }
  | { kind: "closed_week" };

/** ¿Está abierto ahora? Con cuánto falta para cerrar o para abrir. */
export function openState(hours: WeeklyHours | null, timezone: string, now = new Date()): OpenState {
  if (!hours) return { kind: "unknown" };
  const intervals = weekIntervals(hours);
  if (!intervals.length) return { kind: "closed_week" };
  const { day, minute } = localNow(timezone, now);
  const t = day * 1440 + minute;

  // El turno del sábado a la noche que pasa la medianoche sigue abierto el domingo temprano: se mira también una semana atrás.
  for (const shift of [0, -WEEK]) {
    const current = intervals.find((i) => t >= i.start + shift && t < i.end + shift);
    if (current) {
      const endMinute = (current.end + shift) % WEEK;
      const closesDay = String(Math.floor(((endMinute + WEEK) % WEEK) / 1440)) as DayKey;
      return { kind: "open", closesAt: current.period.close, minutesLeft: current.end + shift - t, closesDay };
    }
  }

  let best: { start: number; day: DayKey; period: HoursPeriod } | null = null;
  for (const i of intervals) {
    const start = i.start > t ? i.start : i.start + WEEK;
    if (!best || start < best.start) best = { start, day: i.day, period: i.period };
  }
  return best ? { kind: "closed", opensAt: best.period.open, minutesUntil: best.start - t, opensDay: best.day } : { kind: "closed_week" };
}

/** Texto corto del estado: "Abierto · cierra 23:00", "Cierra en 24 min", "Cerrado · abre el miércoles 12:00". */
export function openLabel(state: OpenState, today?: DayKey): { open: boolean | null; text: string } {
  if (state.kind === "unknown") return { open: null, text: "Sin horario cargado" };
  if (state.kind === "closed_week") return { open: false, text: "Cerrado" };
  if (state.kind === "open") {
    if (state.minutesLeft <= 60) return { open: true, text: `Cierra en ${state.minutesLeft} min` };
    return { open: true, text: `Abierto · cierra ${formatTime(state.closesAt)}` };
  }
  if (state.minutesUntil <= 60) return { open: false, text: `Abre en ${state.minutesUntil} min` };
  const when = state.minutesUntil < 1440 && state.opensDay === today ? "" : state.minutesUntil < 2 * 1440 && isTomorrow(today, state.opensDay) ? "mañana " : `el ${DAY_NAMES[state.opensDay].toLowerCase()} `;
  return { open: false, text: `Cerrado · abre ${when}${formatTime(state.opensAt)}` };
}

function isTomorrow(today: DayKey | undefined, day: DayKey) {
  return today !== undefined && (Number(today) + 1) % 7 === Number(day);
}

/** "24:00" se lee "00:00". */
export function formatTime(time: string) {
  return time === "24:00" ? "00:00" : time;
}

/** "12:00–15:00 · 20:00–00:00" o "Cerrado". */
export function formatDay(periods: HoursPeriod[] | undefined) {
  if (!periods?.length) return "Cerrado";
  return periods.map((p) => `${formatTime(p.open)}–${formatTime(p.close)}`).join(" · ");
}

/** Día de hoy en la zona del lugar, para resaltarlo en la tabla. */
export function todayKey(timezone: string, now = new Date()): DayKey {
  return String(localNow(timezone, now).day) as DayKey;
}

/**
 * Horario del viernes y del sábado, para la pregunta "¿Abre en Shabat?". No se deduce si abre durante Shabat:
 * la hora en que termina cambia en el año. Se muestra el horario cargado y que lo confirme la persona.
 */
export function shabbatHours(hours: WeeklyHours | null) {
  if (!hours) return null;
  return { friday: formatDay(hours["5"]), saturday: formatDay(hours["6"]) };
}
// creado por pato dev y askforvini
