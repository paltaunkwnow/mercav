import { flags, HDate, HebrewCalendar, type Event } from "@hebcal/core";
import { addDays, sortEntries } from "./bolivia";
import { lru } from "./cache";
import { hebrewMonthEs, spanishHebrewName } from "./hebrew-names";
import type { CalendarEntry, CalendarSourceKey } from "./types";

/*
 * Calendario hebreo con @hebcal/core. Solo servidor: la librería es GPL-2.0, así que nunca se importa
 * desde un componente "use client". Las páginas calculan acá y le pasan JSON plano al cliente.
 */

const MINOR_HOLIDAYS = new Set(["Chanukah", "Purim", "Shushan Purim", "Tu BiShvat", "Lag BaOmer", "Tu B'Av", "Purim Katan", "Pesach Sheni"]);
const MODERN_HOLIDAYS = new Set(["Yom HaShoah", "Yom HaZikaron", "Yom HaAtzma'ut", "Yom Yerushalayim"]);

/** Nombre en español (la tabla vive en hebrew-names.ts, compartida con Kosher). */
export function spanishJewishName(desc: string) {
  return spanishHebrewName(desc);
}

export function hebrewDateLabel(hd: HDate) {
  return `${hd.getDate()} de ${hebrewMonthEs(hd.getMonthName())} de ${hd.getFullYear()}`;
}

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function baseName(e: Event) {
  const withBase = e as Event & { basename?: () => string };
  return typeof withBase.basename === "function" ? withBase.basename() : e.getDesc();
}

function civilDate(e: Event) {
  const g = e.getDate().greg();
  return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, "0")}-${String(g.getDate()).padStart(2, "0")}`;
}

function classify(e: Event): { source: CalendarSourceKey; dayOff: boolean } | null {
  const mask = e.getFlags();
  const base = baseName(e);
  if (mask & (flags.SPECIAL_SHABBAT | flags.PARSHA_HASHAVUA)) return null;
  // Las vísperas no van como fecha propia (salvo la 1.ª vela de Janucá, que se enciende esa noche).
  if (mask & flags.EREV && !(mask & flags.CHANUKAH_CANDLES)) return null;
  if (mask & flags.CHAG) return { source: "JUDIO_FIESTAS", dayOff: true };
  if (mask & flags.CHOL_HAMOED) return { source: "JUDIO_FIESTAS", dayOff: false };
  if (mask & (flags.MAJOR_FAST | flags.MINOR_FAST)) return { source: "JUDIO_AYUNOS", dayOff: false };
  if (mask & flags.ROSH_CHODESH) return { source: "JUDIO_ROSH_JODESH", dayOff: false };
  if (mask & flags.MODERN_HOLIDAY) return MODERN_HOLIDAYS.has(base) ? { source: "JUDIO_MODERNOS", dayOff: false } : null;
  if (mask & flags.MINOR_HOLIDAY) return MINOR_HOLIDAYS.has(base) ? { source: "JUDIO_MENORES", dayOff: false } : null;
  return null;
}

const yearCache = lru<CalendarEntry[]>(32);

/** Fechas del calendario hebreo en el año civil (1 de enero a 31 de diciembre). Cacheado por año y lugar. */
export function jewishEntries(year: number, opts: { israel?: boolean } = {}): CalendarEntry[] {
  const israel = opts.israel === true;
  return yearCache.get(`${year}:${israel ? "il" : "diaspora"}`, () => computeJewishEntries(year, israel));
}

function computeJewishEntries(year: number, israel: boolean): CalendarEntry[] {
  const events = HebrewCalendar.calendar({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
    il: israel,
    sedrot: false,
    candlelighting: false,
  });

  const out: CalendarEntry[] = [];
  const chagDates = new Set<string>();
  for (const e of events) if (e.getFlags() & flags.CHAG) chagDates.add(civilDate(e));

  for (const e of events) {
    const kind = classify(e);
    if (!kind) continue;
    const mask = e.getFlags();
    const date = civilDate(e);
    const base = baseName(e);
    const key = `JUDIO:${slug(base)}`;

    let note: string | undefined;
    if (mask & flags.CHAG && !chagDates.has(addDays(date, -1))) {
      note = mask & flags.MAJOR_FAST ? "Ayuno. Empieza la víspera al atardecer." : "Empieza la víspera al atardecer.";
    } else if (mask & flags.MAJOR_FAST) {
      note = "Ayuno. Empieza la víspera al atardecer.";
    } else if (mask & flags.MINOR_FAST) {
      note = "Ayuno desde el amanecer hasta la salida de las estrellas.";
    } else if (mask & flags.CHANUKAH_CANDLES) {
      note = "La vela se enciende al anochecer.";
    } else if (kind.source === "JUDIO_FIESTAS" && !kind.dayOff) {
      note = "Días intermedios: se puede trabajar.";
    }

    out.push({
      id: `${key}@${date}`,
      key,
      date,
      title: spanishJewishName(e.getDesc()),
      source: kind.source,
      dayOff: kind.dayOff,
      hebrew: e.render("he-x-nonikud"),
      hebrewDate: hebrewDateLabel(e.getDate()),
      ...(note ? { note } : {}),
    });
  }

  // hebcal repite algunas fechas (Rosh Jodesh de dos días ya viene separado); evitamos duplicados exactos.
  const seen = new Set<string>();
  return sortEntries(out.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true))));
}
// creado por pato dev y askforvini
