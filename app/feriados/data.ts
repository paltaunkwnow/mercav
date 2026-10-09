import { countryEntries, regionsFor } from "@/lib/calendar/countries";
import type { CalendarEntry } from "@/lib/calendar/types";
import { LATAM_COUNTRIES, countrySlug, todayIn, type LatamCountry } from "@/lib/geo/latam";

/** Páginas públicas de feriados (mercav.lat/feriados): los mismos datos que el Calendario de la app. */

export type FeriadoCountry = LatamCountry & { slug: string };

export const FERIADO_COUNTRIES: FeriadoCountry[] = LATAM_COUNTRIES.map((c) => ({ ...c, slug: countrySlug(c.name) }));

export function countryBySlug(slug: string) {
  return FERIADO_COUNTRIES.find((c) => c.slug === slug) ?? null;
}

/** Hoy en el país (yyyy-mm-dd) y su año. */
export function todayFor(country: LatamCountry) {
  const today = todayIn(country.timezone);
  return { today, year: Number(today.slice(0, 4)) };
}

/** Años con página propia: el actual y los dos que siguen, más el anterior. */
export function yearsFor(country: LatamCountry) {
  const { year } = todayFor(country);
  return [year - 1, year, year + 1, year + 2];
}

export type RegionHolidays = { code: string; name: string; entries: CalendarEntry[] };

export function holidaysOf(country: LatamCountry, year: number) {
  const { national, festive } = countryEntries(year, country.code);
  const regions: RegionHolidays[] = regionsFor(country.code)
    .map((r) => ({ code: r.code, name: r.name, entries: countryEntries(year, country.code, r.code).regional }))
    .filter((r) => r.entries.length > 0);
  return { national, festive, regions };
}

/** Próximo feriado con descanso desde hoy (mira también el año siguiente). */
export function nextDayOff(country: LatamCountry) {
  const { today, year } = todayFor(country);
  const all = [...countryEntries(year, country.code).national, ...countryEntries(year + 1, country.code).national];
  return all.find((e) => e.dayOff && e.date >= today) ?? null;
}

const WEEKDAY = new Intl.DateTimeFormat("es", { weekday: "long", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("es", { month: "long", timeZone: "UTC" });

const utc = (date: string) => new Date(`${date}T12:00:00Z`);
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const weekdayOf = (date: string) => capital(WEEKDAY.format(utc(date)));
export const longDateOf = (date: string) => capital(LONG.format(utc(date)));
export const shortDateOf = (date: string) => SHORT.format(utc(date));
export const monthOf = (date: string) => capital(MONTH.format(utc(date)));

/** Un feriado con descanso en lunes o viernes arma un fin de semana largo. */
export function makesLongWeekend(entry: CalendarEntry) {
  const day = utc(entry.date).getUTCDay();
  return entry.dayOff && (day === 1 || day === 5);
}

export function daysUntil(from: string, to: string) {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);
}
// creado por pato dev y askforvini
