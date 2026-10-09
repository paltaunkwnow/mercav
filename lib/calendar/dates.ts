import { addDays, isoDate, weekday } from "./bolivia";
import type { CalendarEntry, CalendarSourceKey } from "./types";

/**
 * Fechas legibles, fechas relativas, rangos y días hábiles. Sin dependencias de servidor:
 * lo usan el calendario (cliente), /inicio y la API.
 */

export const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const WEEKDAYS_SHORT_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Cuántos años para atrás y para adelante se puede navegar (la API acepta lo mismo). */
export const YEAR_SPAN = 5;

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Días de `a` a `b` (b − a), con fechas yyyy-mm-dd. */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

let rtf: Intl.RelativeTimeFormat | null = null;

/** "Hoy", "Mañana", "Pasado mañana", "Dentro de 3 días", "La próxima semana", "Dentro de 4 meses"… */
export function relativeDay(date: string, today: string) {
  const days = daysBetween(today, date);
  rtf ??= new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const abs = Math.abs(days);
  const text =
    abs < 14
      ? rtf.format(days, "day")
      : abs < 60
        ? rtf.format(Math.round(days / 7), "week")
        : abs < 365
          ? rtf.format(Math.round(days / 30), "month")
          : rtf.format(Math.round(days / 365), "year");
  return capitalize(text);
}

/** Como relativeDay, pero para un rango: si ya empezó y no terminó, "En curso". */
export function relativeRange(start: string, end: string, today: string) {
  if (start < today && end >= today) return "En curso";
  return relativeDay(start, today);
}

/** "Jueves 9 de octubre". */
export function dayLabel(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return capitalize(`${WEEKDAYS_ES[weekday(date)]} ${d} de ${MONTHS_ES[m - 1]}`);
}

/** "jue 9". */
export function shortDayLabel(date: string) {
  return `${WEEKDAYS_SHORT_ES[weekday(date)]} ${Number(date.slice(8))}`;
}

/** "Del 4 al 12 de diciembre", "Del 30 de marzo al 3 de abril". Un solo día: como dayLabel. */
export function rangeLabel(start: string, end: string) {
  if (start === end) return dayLabel(start);
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);
  if (y1 !== y2) return `Del ${d1} de ${MONTHS_ES[m1 - 1]} de ${y1} al ${d2} de ${MONTHS_ES[m2 - 1]} de ${y2}`;
  if (m1 !== m2) return `Del ${d1} de ${MONTHS_ES[m1 - 1]} al ${d2} de ${MONTHS_ES[m2 - 1]}`;
  return `Del ${d1} al ${d2} de ${MONTHS_ES[m1 - 1]}`;
}

/** Fecha de un link (?fecha=yyyy-mm-dd). null si no es válida o queda fuera de los años navegables. */
export function parseDateParam(raw: string | null | undefined, today: string): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map(Number);
  // Descarta fechas que no existen (2026-02-30).
  if (isoDate(y, m, d) !== addDays(isoDate(y, m, 1), d - 1)) return null;
  const year = Number(today.slice(0, 4));
  return Math.abs(y - year) <= YEAR_SPAN ? raw : null;
}

export type DateGroup = {
  /** `${key}@${primer día}`. */
  id: string;
  key: string;
  title: string;
  source: CalendarSourceKey;
  /** Primer día. */
  date: string;
  /** Último día (igual a date si es uno solo). */
  end: string;
  dayOff: boolean;
  days: number;
};

/** "Pésaj (1.er día)" → "Pésaj", "Janucá: 3.ª vela" → "Janucá", "Sucot · Jol Hamoed" → "Sucot". */
function baseTitle(title: string) {
  return title.replace(/\s*\(.*\)$/, "").replace(/\s*[·:].*$/, "") || title;
}

/**
 * Junta en una sola tarjeta los días seguidos de una misma fecha (Pésaj, Sucot, Janucá, Carnaval).
 * En los feriados civiles solo se juntan días con el mismo descanso: un domingo que se trasladó al
 * lunes queda como dos fechas.
 */
export function groupConsecutive(entries: CalendarEntry[]): DateGroup[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const open = new Map<string, { group: DateGroup; first: CalendarEntry }>();
  const out: { group: DateGroup; first: CalendarEntry }[] = [];
  for (const e of sorted) {
    const current = open.get(e.key);
    const g = current?.group;
    const touches = g && (e.date === g.end || e.date === addDays(g.end, 1));
    const sameRest = e.key.startsWith("JUDIO:") || (g && g.dayOff === e.dayOff);
    if (current && g && touches && sameRest) {
      if (e.date > g.end) {
        g.end = e.date;
        g.days += 1;
      }
      g.dayOff ||= e.dayOff;
      continue;
    }
    const item = { group: { id: `${e.key}@${e.date}`, key: e.key, title: e.title, source: e.source, date: e.date, end: e.date, dayOff: e.dayOff, days: 1 }, first: e };
    open.set(e.key, item);
    out.push(item);
  }
  return out.map(({ group, first }) => (group.days > 1 ? { ...group, title: baseTitle(first.title) } : group));
}

/** Próximas fechas (agrupadas) que terminan hoy o después. */
export function upcomingFrom(entries: CalendarEntry[], from: string, limit: number): DateGroup[] {
  return groupConsecutive(entries)
    .filter((g) => g.end >= from)
    .slice(0, limit);
}

/** Días hábiles del mes (lunes a viernes) menos los feriados con descanso. `month0` va de 0 a 11. */
export function workingDays(year: number, month0: number, daysOff: Set<string>) {
  const total = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  let count = 0;
  for (let d = 1; d <= total; d++) {
    const date = isoDate(year, month0 + 1, d);
    const wd = weekday(date);
    if (wd !== 0 && wd !== 6 && !daysOff.has(date)) count++;
  }
  return count;
}

export type LongWeekend =
  /** Feriado pegado al fin de semana: tres días o más seguidos sin trabajar. */
  | { kind: "largo"; start: string; end: string }
  /** Feriado martes o jueves suelto: con el lunes o el viernes se arma un fin de semana de cuatro días. */
  | { kind: "puente"; holiday: string; bridge: string };

/** Fines de semana largos y puentes posibles por los feriados con descanso del mes. */
export function longWeekends(year: number, month0: number, daysOff: Set<string>): LongWeekend[] {
  const prefix = `${year}-${String(month0 + 1).padStart(2, "0")}`;
  const isOff = (date: string) => {
    const wd = weekday(date);
    return wd === 0 || wd === 6 || daysOff.has(date);
  };
  const out: LongWeekend[] = [];
  const seen = new Set<string>();
  for (const holiday of Array.from(daysOff).filter((d) => d.startsWith(prefix)).sort()) {
    const wd = weekday(holiday);
    if (wd === 0 || wd === 6) continue;
    let start = holiday;
    let end = holiday;
    // Tope de dos semanas por las dudas.
    for (let i = 0; i < 14 && isOff(addDays(start, -1)); i++) start = addDays(start, -1);
    for (let i = 0; i < 14 && isOff(addDays(end, 1)); i++) end = addDays(end, 1);
    const id = `${start}/${end}`;
    if (seen.has(id)) continue;
    seen.add(id);
    if (daysBetween(start, end) >= 2) out.push({ kind: "largo", start, end });
    else if (wd === 2 || wd === 4) out.push({ kind: "puente", holiday, bridge: addDays(holiday, wd === 2 ? -1 : 1) });
  }
  return out;
}
// creado por pato dev y askforvini
