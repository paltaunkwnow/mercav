import { DEFAULT_COUNTRY, isLatamCountry } from "../geo/latam";
import type { BoliviaDepartment, CalendarPrefs, CalendarSourceKey } from "./types";

/**
 * Fuentes que cada persona puede activar en su calendario.
 *
 * Claves de fechas puntuales (para ocultar): `<país>:<slug>` para los feriados (BO:independencia,
 * BO:dep-santa-cruz, AR:dia-de-la-independencia) y `JUDIO:<slug del nombre base de hebcal>` para el
 * calendario hebreo (JUDIO:pesach, JUDIO:yom-kippur, JUDIO:rosh-chodesh-kislev). Son las mismas todos
 * los años: ocultar Iom Kipur lo oculta siempre.
 */
export type CalendarSource = {
  key: CalendarSourceKey;
  group: "pais" | "judio";
  label: string;
  desc: string;
  /**
   * Clases Tailwind del punto y del chip de la fuente. En modo claro el texto del chip usa el tono -700
   * donde el -600 no llega a 4,5:1 sobre el fondo teñido (ámbar, rosa, celeste, verde azulado).
   */
  dot: string;
  chip: string;
};

export const CALENDAR_SOURCES: CalendarSource[] = [
  {
    key: "FERIADOS_NACIONALES",
    group: "pais",
    label: "Feriados nacionales",
    desc: "Los días de descanso de tu país, con traslados y feriados extra del año",
    dot: "bg-gold",
    chip: "bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]",
  },
  {
    key: "FERIADOS_REGIONALES",
    group: "pais",
    label: "Feriados de tu región",
    desc: "Departamento, provincia o estado",
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    key: "FECHAS_FESTIVAS",
    group: "pais",
    label: "Fechas festivas y cívicas",
    desc: "Día del Padre, de la Madre, del Niño… y días no laborables optativos",
    dot: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  {
    key: "JUDIO_FIESTAS",
    group: "judio",
    label: "Fiestas mayores",
    desc: "Rosh Hashaná, Iom Kipur, Sucot, Pésaj, Shavuot",
    dot: "bg-techelet",
    chip: "bg-techelet/10 text-techelet",
  },
  {
    key: "JUDIO_MENORES",
    group: "judio",
    label: "Fiestas menores",
    desc: "Janucá, Purim, Tu Bishvat, Lag Baomer, Tu Beav",
    dot: "bg-sky-400",
    chip: "bg-sky-400/10 text-sky-700 dark:text-sky-300",
  },
  {
    key: "JUDIO_AYUNOS",
    group: "judio",
    label: "Ayunos",
    desc: "Tishá BeAv, Guedalia, 10 de Tevet, Ester, 17 de Tamuz",
    dot: "bg-violet-500",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  {
    key: "JUDIO_ROSH_JODESH",
    group: "judio",
    label: "Rosh Jodesh",
    desc: "El comienzo de cada mes hebreo",
    dot: "bg-teal-500",
    chip: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  {
    key: "JUDIO_MODERNOS",
    group: "judio",
    label: "Fechas de Israel",
    desc: "Iom Hashoá, Iom Hazikarón, Iom Haatzmaut, Iom Ierushalaim",
    dot: "bg-indigo-500",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  },
];

export const SOURCE_KEYS = CALENDAR_SOURCES.map((s) => s.key);

export function calendarSource(key: CalendarSourceKey): CalendarSource {
  return CALENDAR_SOURCES.find((s) => s.key === key) ?? CALENDAR_SOURCES[0];
}

/** Departamentos de Bolivia (las regiones de Bolivia en el calendario y en Business). */
export const DEPARTMENTS: { key: BoliviaDepartment; label: string }[] = [
  { key: "SANTA_CRUZ", label: "Santa Cruz" },
  { key: "LA_PAZ", label: "La Paz" },
  { key: "COCHABAMBA", label: "Cochabamba" },
  { key: "CHUQUISACA", label: "Chuquisaca" },
  { key: "POTOSI", label: "Potosí" },
  { key: "ORURO", label: "Oruro" },
  { key: "TARIJA", label: "Tarija" },
  { key: "BENI", label: "Beni" },
  { key: "PANDO", label: "Pando" },
];

export const DEPARTMENT_KEYS = DEPARTMENTS.map((d) => d.key);

export function defaultPrefs(country?: string | null): CalendarPrefs {
  return {
    country: isLatamCountry(country) ? country!.toUpperCase() : DEFAULT_COUNTRY,
    region: null,
    sources: ["FERIADOS_NACIONALES", "JUDIO_FIESTAS"],
    israel: false,
    hidden: [],
  };
}

/**
 * Limpia lo que venga de la base o del cliente: claves desconocidas afuera, sin duplicados.
 * `fallbackCountry` es el país de la cuenta, para quien todavía no eligió.
 */
export function normalizePrefs(
  raw: Partial<{ country: unknown; region: unknown; sources: unknown; israel: unknown; hidden: unknown }> | null | undefined,
  fallbackCountry?: string | null,
): CalendarPrefs {
  const base = defaultPrefs(fallbackCountry);
  if (!raw) return base;
  const country = typeof raw.country === "string" && isLatamCountry(raw.country) ? raw.country.toUpperCase() : base.country;
  const sources = Array.isArray(raw.sources)
    ? Array.from(new Set(raw.sources.filter((s): s is CalendarSourceKey => SOURCE_KEYS.includes(s as CalendarSourceKey))))
    : base.sources;
  const region = typeof raw.region === "string" && /^[A-Za-z0-9_-]{1,24}$/.test(raw.region) ? raw.region : null;
  const hidden = Array.isArray(raw.hidden)
    ? Array.from(new Set(raw.hidden.filter((h): h is string => typeof h === "string" && h.length > 0 && h.length <= 80))).slice(0, 300)
    : [];
  return { country, region, sources, israel: raw.israel === true, hidden };
}

export function usesJewishCalendar(prefs: CalendarPrefs) {
  return prefs.sources.some((s) => s.startsWith("JUDIO_"));
}

/**
 * Huella de lo que cambia las fechas que devuelve la API: país, región, fuentes y lugar (las ocultas no,
 * porque vuelven todas y se filtran en el cliente). Va en la URL para que el caché del navegador no mezcle.
 */
export function prefsVersion(prefs: CalendarPrefs) {
  return [prefs.country, prefs.region ?? "", prefs.israel ? "il" : "", [...prefs.sources].sort().join(".")].join("_");
}
// creado por pato dev y askforvini
