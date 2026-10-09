import type { BoliviaDepartment, CalendarEntry, CalendarSourceKey } from "./types";

/*
 * Feriados de Bolivia, calculados por regla para cualquier año.
 *
 * - Lista nacional: DS 2750 (1 de mayo de 2016), art. 2, incisos a) a j).
 *   https://www.lexivox.org/norms/BO-DS-N2750.html
 * - Traslado al lunes de los feriados que caen en domingo: DS 2750 art. 3.
 *   · DS 5019 (13/09/2023) lo extendió a los feriados departamentales.
 *     https://www.lexivox.org/norms/BO-DS-N5019.xhtml
 *   · DS 5483 (29/10/2025) quitó de las excepciones a Todos los Difuntos. Quedan exceptuados
 *     Carnaval, Viernes Santo y Corpus Christi (incisos c, d y f).
 *     https://www.lexivox.org/norms/BO-DS-N5483.xhtml
 * - Traslados y feriados extra de cada año, por decreto: tabla OVERRIDES más abajo.
 *   2026: DS 5521 https://intranet.mineria.gob.bo/wp-content/uploads/2026/01/DS-5521.pdf
 *
 * Todas las fechas se manejan como texto yyyy-mm-dd y se calculan en UTC para no depender de la
 * zona horaria del servidor.
 */

const DEPARTMENT_MOVE_FROM = "2023-09-13"; // DS 5019
const ALL_SOULS_MOVE_FROM = "2025-10-29"; // DS 5483

type Rule =
  | { kind: "fixed"; month: number; day: number }
  | { kind: "easter"; offset: number };

type HolidayDef = {
  key: string;
  title: string;
  rule: Rule;
  /** Se traslada al lunes si cae en domingo (DS 2750 art. 3 y modificaciones). */
  movesOnSunday: boolean | ((date: string) => boolean);
};

const NATIONAL: HolidayDef[] = [
  { key: "BO:anio-nuevo", title: "Año Nuevo", rule: { kind: "fixed", month: 1, day: 1 }, movesOnSunday: true },
  { key: "BO:estado-plurinacional", title: "Día del Estado Plurinacional", rule: { kind: "fixed", month: 1, day: 22 }, movesOnSunday: true },
  { key: "BO:carnaval", title: "Carnaval", rule: { kind: "easter", offset: -48 }, movesOnSunday: false },
  { key: "BO:carnaval", title: "Carnaval", rule: { kind: "easter", offset: -47 }, movesOnSunday: false },
  { key: "BO:viernes-santo", title: "Viernes Santo", rule: { kind: "easter", offset: -2 }, movesOnSunday: false },
  { key: "BO:dia-del-trabajo", title: "Día del Trabajo", rule: { kind: "fixed", month: 5, day: 1 }, movesOnSunday: true },
  { key: "BO:corpus-christi", title: "Corpus Christi", rule: { kind: "easter", offset: 60 }, movesOnSunday: false },
  {
    key: "BO:anio-nuevo-andino",
    title: "Año Nuevo Andino Amazónico Chaqueño",
    rule: { kind: "fixed", month: 6, day: 21 },
    movesOnSunday: true,
  },
  { key: "BO:independencia", title: "Día de la Independencia", rule: { kind: "fixed", month: 8, day: 6 }, movesOnSunday: true },
  {
    key: "BO:todos-santos",
    title: "Día de Todos los Difuntos",
    rule: { kind: "fixed", month: 11, day: 2 },
    movesOnSunday: (date) => date >= ALL_SOULS_MOVE_FROM,
  },
  { key: "BO:navidad", title: "Navidad", rule: { kind: "fixed", month: 12, day: 25 }, movesOnSunday: true },
];

const DEPARTMENTAL: Record<BoliviaDepartment, { title: string; month: number; day: number }> = {
  ORURO: { title: "Efeméride de Oruro", month: 2, day: 10 },
  TARIJA: { title: "Efeméride de Tarija", month: 4, day: 15 },
  CHUQUISACA: { title: "Efeméride de Chuquisaca", month: 5, day: 25 },
  LA_PAZ: { title: "Efeméride de La Paz", month: 7, day: 16 },
  COCHABAMBA: { title: "Efeméride de Cochabamba", month: 9, day: 14 },
  SANTA_CRUZ: { title: "Efeméride de Santa Cruz", month: 9, day: 24 },
  PANDO: { title: "Efeméride de Pando", month: 9, day: 24 },
  POTOSI: { title: "Efeméride de Potosí", month: 11, day: 10 },
  BENI: { title: "Efeméride del Beni", month: 11, day: 18 },
};

/** Fechas cívicas y festivas sin descanso obligatorio. */
const CIVIC: { key: string; title: string; month: number; day: number; note?: string }[] = [
  { key: "BO:alasita", title: "Alasita", month: 1, day: 24, note: "Feria de La Paz" },
  { key: "BO:dia-del-padre", title: "Día del Padre", month: 3, day: 19 },
  { key: "BO:dia-del-mar", title: "Día del Mar", month: 3, day: 23 },
  { key: "BO:dia-del-nino", title: "Día del Niño", month: 4, day: 12 },
  { key: "BO:dia-de-la-madre", title: "Día de la Madre", month: 5, day: 27 },
  { key: "BO:dia-del-maestro", title: "Día del Maestro", month: 6, day: 6 },
  { key: "BO:dia-de-la-bandera", title: "Día de la Bandera", month: 8, day: 17 },
  { key: "BO:dia-del-estudiante", title: "Día del Estudiante y de la Primavera", month: 9, day: 21 },
  { key: "BO:dia-de-la-mujer-boliviana", title: "Día de la Mujer Boliviana", month: 10, day: 11 },
];

type YearOverride = {
  /** Feriados que un decreto movió a otra fecha: clave → nueva fecha. */
  move?: Record<string, { to: string; decree: string }>;
  /** Feriados nacionales extra declarados para ese año. */
  extra?: { key: string; date: string; title: string; decree: string }[];
};

const OVERRIDES: Record<number, YearOverride> = {
  2026: {
    move: {
      "BO:estado-plurinacional": { to: "2026-01-23", decree: "DS 5521" },
    },
    extra: [
      { key: "BO:anio-nuevo", date: "2026-01-02", title: "Feriado adicional de Año Nuevo", decree: "DS 5506" },
      { key: "BO:corpus-christi", date: "2026-06-05", title: "Feriado adicional de Corpus Christi", decree: "DS 5521" },
      { key: "BO:independencia", date: "2026-08-07", title: "Feriado adicional por la Independencia", decree: "DS 5521" },
    ],
  },
};

/** Decretos de traslados y feriados extra cargados para el año, para citarlos. Vacío si no hay ninguno. */
export function boliviaDecrees(year: number): string[] {
  const override = OVERRIDES[year];
  if (!override) return [];
  const all = [...Object.values(override.move ?? {}).map((m) => m.decree), ...(override.extra ?? []).map((e) => e.decree)];
  return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function toUtc(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number) {
  const t = new Date(toUtc(date) + days * 86_400_000);
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** 0 = domingo … 6 = sábado. */
export function weekday(date: string) {
  return new Date(toUtc(date)).getUTCDay();
}

export function longDate(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS[weekday(date)]} ${d} de ${MONTHS[m - 1]}`;
}

/** Domingo de Pascua (algoritmo anónimo gregoriano, Meeus/Jones/Butcher). */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDate(year, month, day);
}

function ruleDate(year: number, rule: Rule) {
  return rule.kind === "fixed" ? isoDate(year, rule.month, rule.day) : addDays(easterSunday(year), rule.offset);
}

function entry(source: CalendarSourceKey, key: string, date: string, title: string, dayOff: boolean, note?: string): CalendarEntry {
  return { id: `${key}@${date}`, key, date, title, source, dayOff, ...(note ? { note } : {}) };
}

/**
 * Agrega un feriado aplicando traslados. Si cae en domingo y corresponde, el domingo queda como
 * conmemoración y el lunes es el día de descanso. Si un decreto lo movió, pasa lo mismo.
 */
function pushHoliday(
  out: CalendarEntry[],
  source: CalendarSourceKey,
  key: string,
  title: string,
  date: string,
  moves: boolean,
  decreeMove?: { to: string; decree: string },
) {
  if (decreeMove && decreeMove.to !== date) {
    out.push(entry(source, key, date, title, false, `El descanso pasó al ${longDate(decreeMove.to)} (${decreeMove.decree}).`));
    out.push(entry(source, key, decreeMove.to, title, true, `Feriado trasladado del ${longDate(date)} (${decreeMove.decree}).`));
    return;
  }
  if (moves && weekday(date) === 0) {
    const monday = addDays(date, 1);
    out.push(entry(source, key, date, title, false, `Cae domingo: el descanso pasa al ${longDate(monday)}.`));
    out.push(entry(source, key, monday, title, true, `Feriado trasladado del domingo ${Number(date.slice(8))}.`));
    return;
  }
  out.push(entry(source, key, date, title, true));
}

/** Feriados nacionales del año, con traslados y extras por decreto. */
export function boliviaNational(year: number): CalendarEntry[] {
  const out: CalendarEntry[] = [];
  const override = OVERRIDES[year];
  for (const def of NATIONAL) {
    const date = ruleDate(year, def.rule);
    const moves = typeof def.movesOnSunday === "function" ? def.movesOnSunday(date) : def.movesOnSunday;
    pushHoliday(out, "FERIADOS_NACIONALES", def.key, def.title, date, moves, override?.move?.[def.key]);
  }
  for (const extra of override?.extra ?? []) {
    out.push(entry("FERIADOS_NACIONALES", extra.key, extra.date, extra.title, true, `Declarado por ${extra.decree}.`));
  }
  return sortEntries(out);
}

/** El feriado departamental del año. Desde el DS 5019 también se traslada si cae en domingo. */
export function boliviaDepartmental(year: number, department: BoliviaDepartment): CalendarEntry[] {
  const def = DEPARTMENTAL[department];
  if (!def) return [];
  const out: CalendarEntry[] = [];
  const date = isoDate(year, def.month, def.day);
  const key = `BO:dep-${department.toLowerCase().replace(/_/g, "-")}`;
  pushHoliday(out, "FERIADOS_REGIONALES", key, def.title, date, date >= DEPARTMENT_MOVE_FROM, OVERRIDES[year]?.move?.[key]);
  return out;
}

export function boliviaCivicDays(year: number): CalendarEntry[] {
  return CIVIC.map((c) => entry("FECHAS_FESTIVAS", c.key, isoDate(year, c.month, c.day), c.title, false, c.note));
}

/**
 * Días de descanso obligatorio del año (nacionales y, si se indica, el departamental).
 * Pensado para Business: planillas, horas en feriado y turnos.
 */
export function boliviaHolidays(year: number, department?: BoliviaDepartment | null): CalendarEntry[] {
  const all = [...boliviaNational(year), ...(department ? boliviaDepartmental(year, department) : [])];
  return sortEntries(all.filter((e) => e.dayOff));
}

export function sortEntries(entries: CalendarEntry[]) {
  return entries.sort((a, b) => a.date.localeCompare(b.date) || Number(b.dayOff) - Number(a.dayOff) || a.title.localeCompare(b.title));
}
// creado por pato dev y askforvini
