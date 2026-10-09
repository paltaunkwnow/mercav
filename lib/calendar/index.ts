import { sortEntries } from "./bolivia";
import { lru } from "./cache";
import { countryEntries, dayOffEntries } from "./countries";
import { upcomingFrom, type DateGroup } from "./dates";
import { jewishEntries } from "./jewish";
import { usesJewishCalendar } from "./sources";
import type { CalendarEntry, CalendarPrefs } from "./types";

// Todas las fechas del año para una combinación de país, región, fuentes y lugar (sin aplicar ocultas).
const yearCache = lru<CalendarEntry[]>(256);

function yearEntries(year: number, prefs: CalendarPrefs): CalendarEntry[] {
  const sources = Array.from(new Set(prefs.sources)).sort();
  const key = [year, prefs.country, prefs.region ?? "", prefs.israel ? "il" : "", sources.join(",")].join("|");
  return yearCache.get(key, () => {
    const on = new Set(sources);
    const all: CalendarEntry[] = [];
    if (on.has("FERIADOS_NACIONALES") || on.has("FERIADOS_REGIONALES") || on.has("FECHAS_FESTIVAS")) {
      const country = countryEntries(year, prefs.country, prefs.region);
      if (on.has("FERIADOS_NACIONALES")) all.push(...country.national);
      if (on.has("FERIADOS_REGIONALES")) all.push(...country.regional);
      if (on.has("FECHAS_FESTIVAS")) all.push(...country.festive);
    }
    if (usesJewishCalendar(prefs)) all.push(...jewishEntries(year, { israel: prefs.israel }).filter((e) => on.has(e.source)));
    return sortEntries(all);
  });
}

/**
 * Las fechas del año según las preferencias de la persona. Solo servidor (usa hebcal y date-holidays).
 * Con includeHidden, las ocultas vuelven marcadas con hidden: true para poder restaurarlas.
 */
export function buildCalendar(year: number, prefs: CalendarPrefs, opts: { includeHidden?: boolean } = {}): CalendarEntry[] {
  const hidden = new Set(prefs.hidden);
  const marked = yearEntries(year, prefs).map((e) => (hidden.has(e.key) ? { ...e, hidden: true } : e));
  return opts.includeHidden ? marked : marked.filter((e) => !e.hidden);
}

/** Próximas fechas visibles desde `from` (incluido), mirando también el año siguiente. */
export function upcomingEntries(prefs: CalendarPrefs, from: string, limit = 5): CalendarEntry[] {
  const year = Number(from.slice(0, 4));
  return [...buildCalendar(year, prefs), ...buildCalendar(year + 1, prefs)]
    .filter((e) => e.date >= from)
    .slice(0, limit);
}

/** Como upcomingEntries, pero con los días seguidos de una misma fecha juntos (Pésaj del 2 al 9 de abril). */
export function upcomingGroups(prefs: CalendarPrefs, from: string, limit = 5): DateGroup[] {
  const year = Number(from.slice(0, 4));
  return upcomingFrom([...buildCalendar(year, prefs), ...buildCalendar(year + 1, prefs)], from, limit);
}

/**
 * Días de descanso civiles del año (nacionales y, si la persona sigue su región, los regionales),
 * aunque no los muestre en el calendario. Sirven para contar días hábiles y fines de semana largos.
 */
export function daysOffFor(year: number, prefs: CalendarPrefs): string[] {
  const region = prefs.sources.includes("FERIADOS_REGIONALES") ? prefs.region : null;
  return Array.from(new Set(dayOffEntries(year, prefs.country, region).map((e) => e.date)));
}

export { boliviaHolidays } from "./bolivia";
export { dayOffEntries, latamRegions, regionsFor } from "./countries";
export type { DateGroup } from "./dates";
// creado por pato dev y askforvini
