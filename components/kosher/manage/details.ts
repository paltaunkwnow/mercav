import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { DAY_KEYS, DAY_NAMES, WEEK_ORDER, formatDay, parseHours, type DayKey, type HoursPeriod, type WeeklyHours } from "@/lib/kosher/hours";
import { KOSHER_SERVICES, STATUS_ORDER, isFoodPlace, type KosherServiceKey } from "@/lib/kosher/labels";

/**
 * Datos de la ficha que se cargan al sugerir un lugar o desde Administrar: horario, nivel de kashrut,
 * precio, servicios y fotos. Sin React ni Prisma en runtime: lo usan el cliente y las rutas de la API.
 */

export const MAX_PHOTOS = 8;
/** El navegador achica a este lado mayor antes de subir. */
export const PHOTO_MAX_SIDE = 1600;
export const PHOTO_MIN_SIDE = 200;
/** Peso máximo de lo que llega al servidor (ya achicado). */
export const PHOTO_MAX_BYTES = 700 * 1024;
/** Peso máximo del original que elige la persona. */
export const PHOTO_ORIGINAL_MAX_BYTES = 10 * 1024 * 1024;
export const CAPTION_MAX = 140;
export const MAX_PERIODS = 4;

export type PhotoDTO = { id: string; url: string; width: number; height: number; caption: string | null; position: number };

export const photoUrl = (id: string) => `/api/kosher/photos/${id}`;

/* ── Nivel de kashrut ─────────────────────────────────────────────────────── */

/** Al sugerir un lugar. "certified" no: solo sale de un certificado revisado por moderación. */
const SUGGEST_SET: readonly KosherStatus[] = ["community_report", "supervised", "self_declared", "some_products", "some_dishes", "unknown", "kosher_style"];
/** Quien administra la ficha declara lo que el lugar es. "En disputa" y "Reporte comunitario" los maneja moderación. */
const MANAGER_SET: readonly KosherStatus[] = ["supervised", "self_declared", "some_products", "some_dishes", "kosher_style", "closed"];

export const SUGGEST_STATUSES = STATUS_ORDER.filter((s) => SUGGEST_SET.includes(s));
export const DEFAULT_SUGGEST_STATUS: KosherStatus = "community_report";

/** Niveles que se pueden elegir desde Administrar, en el orden del espectro. Nunca "certified". */
export function editableStatuses(isModerator: boolean): KosherStatus[] {
  return STATUS_ORDER.filter((s) => s !== "certified" && (isModerator || MANAGER_SET.includes(s)));
}

/** Con una disputa abierta, el nivel lo resuelve moderación. */
export const statusLockedFor = (current: KosherStatus, isModerator: boolean) => !isModerator && current === "disputed";

/* ── Precio y servicios ───────────────────────────────────────────────────── */

export const PRICE_HINT: Record<1 | 2 | 3 | 4, string> = { 1: "Económico", 2: "Precio medio", 3: "Caro", 4: "Muy caro" };

/** Fuera de los lugares de comida, solo tienen sentido estos servicios. */
const GENERAL_SERVICES: readonly KosherServiceKey[] = ["shabbat_meals", "wifi", "accessible"];

export function servicesFor(type: KosherPlaceType): KosherServiceKey[] {
  const all = Object.keys(KOSHER_SERVICES) as KosherServiceKey[];
  return isFoodPlace(type) ? all : all.filter((k) => GENERAL_SERVICES.includes(k));
}

/** Limpia y ordena una lista de servicios. Devuelve null si trae alguno que no aplica a ese tipo de lugar. */
export function cleanServices(type: KosherPlaceType, values: readonly string[]): KosherServiceKey[] | null {
  const allowed = servicesFor(type);
  if (values.some((v) => !allowed.includes(v as KosherServiceKey))) return null;
  return allowed.filter((k) => values.includes(k));
}

/* ── Zona horaria ─────────────────────────────────────────────────────────── */

export function isTimeZone(value: string) {
  if (!/^[A-Za-z][A-Za-z0-9_+\-/]{1,63}$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/* ── Horario ──────────────────────────────────────────────────────────────── */

/** Lo que edita el formulario: cada día con sus turnos; lista vacía = cerrado. Las horas van como en <input type="time">. */
export type HoursDraft = Record<DayKey, HoursPeriod[]>;

export const emptyDraft = (): HoursDraft => ({ "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [] });

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const WEEK = 7 * 1440;

/** "24:00" no entra en un <input type="time">: se muestra como 00:00. */
export function hoursToDraft(hours: WeeklyHours | null): HoursDraft {
  const draft = emptyDraft();
  for (const day of DAY_KEYS) {
    draft[day] = (hours?.[day] ?? []).map((p) => ({ open: p.open, close: p.close === "24:00" ? "00:00" : p.close }));
  }
  return draft;
}

/** Cerrar a las 00:00 se guarda como "24:00" (cierra a la medianoche); 00:00 a 00:00 es abierto las 24 horas. */
export function draftToHours(draft: HoursDraft): WeeklyHours | null {
  const out: Record<string, HoursPeriod[]> = {};
  for (const day of DAY_KEYS) {
    out[day] = draft[day].map((p) => ({ open: p.open, close: p.close === "00:00" ? "24:00" : p.close }));
  }
  return parseHours(out);
}

/** ¿El turno pasa la medianoche? (cierra al día siguiente) */
export const crossesMidnight = (p: HoursPeriod) => TIME.test(p.open) && TIME.test(p.close) && p.close !== "00:00" && minutes(p.close) < minutes(p.open);

/** Primer día cuyo turno se pisa con otro (también con el que viene de la noche anterior). */
function overlappingDay(hours: Partial<Record<DayKey, HoursPeriod[]>>): DayKey | null {
  const intervals: { start: number; end: number; day: DayKey }[] = [];
  for (const day of DAY_KEYS) {
    for (const p of hours[day] ?? []) {
      const start = Number(day) * 1440 + minutes(p.open);
      let length = (p.close === "24:00" ? 1440 : minutes(p.close)) - minutes(p.open);
      if (length <= 0) length += 1440;
      intervals.push({ start, end: start + length, day });
    }
  }
  if (intervals.length < 2) return null;
  intervals.sort((a, b) => a.start - b.start);
  let reach = intervals[0].end;
  for (const i of intervals.slice(1)) {
    if (i.start < reach) return i.day;
    reach = Math.max(reach, i.end);
  }
  // El turno del sábado a la noche que sigue el domingo temprano.
  return reach - WEEK > intervals[0].start ? intervals[0].day : null;
}

/** Problemas del borrador por día, para mostrarlos al lado de cada día. */
export function draftProblems(draft: HoursDraft): Partial<Record<DayKey, string>> {
  const out: Partial<Record<DayKey, string>> = {};
  for (const day of DAY_KEYS) {
    for (const p of draft[day]) {
      if (!TIME.test(p.open) || !TIME.test(p.close)) out[day] = "Completá la hora de apertura y la de cierre.";
      else if (p.open === p.close && p.open !== "00:00") out[day] = "Un turno no puede abrir y cerrar a la misma hora.";
    }
  }
  if (Object.keys(out).length) return out;
  const normalized: Partial<Record<DayKey, HoursPeriod[]>> = {};
  for (const day of DAY_KEYS) normalized[day] = draft[day].map((p) => ({ open: p.open, close: p.close === "00:00" ? "24:00" : p.close }));
  const overlap = overlappingDay(normalized);
  if (overlap) out[overlap] = "Los turnos se superponen (mirá también el turno de la noche anterior).";
  return out;
}

/** Valida el horario que llega a la API, antes de normalizarlo con parseHours. null = está bien. */
export function hoursInputProblem(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return "El horario no tiene el formato esperado.";
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((k) => !DAY_KEYS.includes(k as DayKey))) return "El horario no tiene el formato esperado.";
  for (const day of DAY_KEYS) {
    const periods = record[day];
    if (periods === undefined) continue;
    if (!Array.isArray(periods)) return "El horario no tiene el formato esperado.";
    if (periods.length > MAX_PERIODS) return `Hasta ${MAX_PERIODS} turnos por día.`;
    for (const p of periods as unknown[]) {
      const { open, close } = (p ?? {}) as { open?: unknown; close?: unknown };
      if (typeof open !== "string" || typeof close !== "string" || !TIME.test(open) || !(TIME.test(close) || close === "24:00")) {
        return `${DAY_NAMES[day]}: usá horas en formato 24 h, por ejemplo 09:30.`;
      }
      if (open === close) return `${DAY_NAMES[day]}: un turno no puede abrir y cerrar a la misma hora.`;
    }
  }
  const overlap = overlappingDay(record as Partial<Record<DayKey, HoursPeriod[]>>);
  return overlap ? `${DAY_NAMES[overlap]}: los turnos se superponen.` : null;
}

const isAllDay = (periods?: HoursPeriod[]) => periods?.length === 1 && periods[0].open === "00:00" && periods[0].close === "24:00";

/** "Lunes a viernes: 09:00–18:00", "Sábado: Cerrado"… Agrupa días seguidos con el mismo horario. */
export function hoursSummary(hours: WeeklyHours | null): string[] {
  if (!hours) return [];
  const groups: { days: DayKey[]; text: string }[] = [];
  for (const day of WEEK_ORDER) {
    const text = isAllDay(hours[day]) ? "Abierto las 24 horas" : formatDay(hours[day]);
    const last = groups.at(-1);
    if (last && last.text === text) last.days.push(day);
    else groups.push({ days: [day], text });
  }
  return groups.map(({ days, text }) => {
    const first = DAY_NAMES[days[0]];
    const end = DAY_NAMES[days[days.length - 1]].toLowerCase();
    const label = days.length === 1 ? first : days.length === 2 ? `${first} y ${end}` : `${first} a ${end}`;
    return `${label}: ${text}`;
  });
}
// creado por pato dev y askforvini
