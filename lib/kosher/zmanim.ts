import { flags, HebrewCalendar, HDate, Location, Zmanim, type Event } from "@hebcal/core";
import { dayKey } from "@/lib/kosher/time";
import { hebrewMonthEs, spanishHebrewName } from "@/lib/calendar/hebrew-names";

export type ZmanimCity = { city: string; countryCode: string; lat: number; lng: number; timezone: string };

export type CalendarKind = "candles" | "havdalah" | "parasha" | "chag" | "fast" | "rosh_chodesh" | "holiday";

export type CalendarItem = {
  day: string;
  kind: CalendarKind;
  title: string;
  hebrew: string;
  time: string | null;
  /** Descripción original de hebcal («Pesach I», «Erev Yom Kippur»): sirve para enlazar la festividad. */
  desc: string;
};

const CANDLE_MINS = 18;
const HAVDALAH_MINS = 42;

// Prefijos de hebcal que no son parte del nombre de la fecha.
const PREFIXES: [RegExp, string][] = [
  [/^Erev /, "Víspera de "],
  [/^Parashat /, "Parashá "],
  [/^Shabbat /, "Shabat "],
];

/** Nombre en español. Fiestas, ayunos y meses salen de la tabla compartida con el calendario (lib/calendar/hebrew-names.ts). */
export function spanishName(desc: string) {
  if (desc === "Candle lighting") return "Encendido de velas";
  if (desc === "Havdalah") return "Havdalá";
  const prefix = PREFIXES.find(([re]) => re.test(desc));
  const rest = prefix ? desc.replace(prefix[0], "") : desc;
  // Las parashiot y los shabatot especiales quedan con su nombre.
  const name = prefix && prefix[1] !== "Víspera de " ? rest : spanishHebrewName(rest);
  return `${prefix?.[1] ?? ""}${name}`.replace(/''/g, "’");
}

export function cityLocation(c: ZmanimCity) {
  return new Location(c.lat, c.lng, false, c.timezone, c.city, c.countryCode);
}

function kindOf(e: Event): CalendarKind | null {
  const mask = e.getFlags();
  const desc = e.getDesc();
  if (desc === "Candle lighting") return "candles";
  if (desc === "Havdalah") return "havdalah";
  if (mask & flags.PARSHA_HASHAVUA) return "parasha";
  if (mask & flags.ROSH_CHODESH) return "rosh_chodesh";
  if (mask & (flags.MAJOR_FAST | flags.MINOR_FAST)) return "fast";
  if (mask & flags.CHAG) return "chag";
  if (mask & (flags.MINOR_HOLIDAY | flags.MODERN_HOLIDAY | flags.CHOL_HAMOED | flags.SPECIAL_SHABBAT | flags.EREV)) return "holiday";
  return null;
}

/** yyyy-mm-dd con los getters locales: hebcal arma sus fechas a medianoche local del servidor. */
function localDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function calendarFor(c: ZmanimCity, days = 70, start = new Date()): CalendarItem[] {
  // Desde el día civil de la ciudad, no el del servidor (mismo arreglo que dayZmanim, ver cityCivilDate).
  const from = cityCivilDate(start, c.timezone);
  const end = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days, 12);
  const events = HebrewCalendar.calendar({
    start: from,
    end,
    location: cityLocation(c),
    candlelighting: true,
    candleLightingMins: CANDLE_MINS,
    havdalahMins: HAVDALAH_MINS,
    sedrot: true,
    il: false,
  });
  const items: CalendarItem[] = [];
  for (const e of events) {
    const kind = kindOf(e);
    if (!kind) continue;
    const timed = (e as Event & { eventTime?: Date }).eventTime;
    items.push({
      day: timed ? dayKey(timed, c.timezone) : localDayKey(e.getDate().greg()),
      kind,
      title: spanishName(e.getDesc()),
      hebrew: e.render("he-x-nonikud").replace(/:.*$/, ""),
      time: timed ? timed.toISOString() : null,
      desc: e.getDesc(),
    });
  }
  return items;
}

/** Next candle lighting, parashá and havdalá from now. */
export function nextShabbat(c: ZmanimCity, now = new Date()) {
  const items = calendarFor(c, 9, new Date(now.getTime() - 86_400_000));
  const candles = items.find((i) => i.kind === "candles" && i.time && new Date(i.time).getTime() > now.getTime() - 26 * 3_600_000);
  const havdalah = items.find((i) => i.kind === "havdalah" && i.time && candles?.time && i.time > candles.time);
  const inWindow = (i: CalendarItem) => !!candles && !!havdalah && i.day >= candles.day && i.day <= havdalah.day;
  const parasha = items.find((i) => i.kind === "parasha" && inWindow(i));
  const chagim = items.filter((i) => i.kind === "chag" && inWindow(i));
  return {
    candles: candles?.time ?? null,
    havdalah: havdalah?.time ?? null,
    parasha: parasha?.title ?? null,
    parashaHe: parasha?.hebrew ?? null,
    chag: chagim.length ? chagim.map((c) => c.title).join(" y ") : null,
    chagHe: chagim.length ? chagim.map((c) => c.hebrew).join(" · ") : null,
  };
}

/**
 * Fecha civil de `date` vista en `timeZone`, como Date con componentes locales del servidor
 * (mediodía para esquivar DST). @hebcal/core usa getFullYear/getMonth/getDate locales,
 * así que sin esto un servidor en UTC calculaba los zmanim del día siguiente a la noche en América.
 */
export function cityCivilDate(date: Date, timeZone: string) {
  const [y, m, d] = dayKey(date, timeZone).split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function isShabbatOrYomTov(c: ZmanimCity, now = new Date()) {
  // 5 días hacia atrás: un iom tov de 2 días pegado a Shabat dura ~73 h entre velas y Havdalá;
  // con 3 días la vela inicial podía quedar fuera de la ventana y el modo Shabat se liberaba antes.
  const items = calendarFor(c, 7, new Date(now.getTime() - 5 * 86_400_000))
    .filter((i) => i.time)
    .sort((a, b) => a.time!.localeCompare(b.time!));
  let active = false;
  for (const i of items) {
    if (new Date(i.time!).getTime() > now.getTime()) break;
    if (i.kind === "candles") active = true;
    if (i.kind === "havdalah") active = false;
  }
  return active;
}

export function hebrewDate(date = new Date()) {
  const hd = new HDate(date);
  return `${hd.getDate()} de ${hebrewMonthEs(hd.getMonthName())} de ${hd.getFullYear()}`;
}

export function dayZmanim(c: ZmanimCity, instant = new Date()) {
  // Día civil de la ciudad, no del servidor.
  const date = cityCivilDate(instant, c.timezone);
  const z = new Zmanim(cityLocation(c), date, false);
  const rows: [string, Date][] = [
    ["Alot hashajar", z.alotHaShachar()],
    ["Salida del sol", z.sunrise()],
    ["Sof zman Shemá (Gra)", z.sofZmanShma()],
    ["Sof zman tefilá (Gra)", z.sofZmanTfilla()],
    ["Jatzot", z.chatzot()],
    ["Minjá guedolá", z.minchaGedola()],
    ["Plag haminjá", z.plagHaMincha()],
    ["Puesta del sol", z.sunset()],
    ["Tzet hakojavim", z.tzeit(8.5)],
  ];
  return {
    hebrewDate: hebrewDate(date),
    hebrewDateHe: new HDate(date).renderGematriya(true),
    rows: rows.filter(([, d]) => !Number.isNaN(d.getTime())).map(([label, d]) => ({ label, time: d.toISOString() })),
  };
}
// creado por pato dev y askforvini
