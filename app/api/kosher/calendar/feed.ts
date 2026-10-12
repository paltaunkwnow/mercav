import { foldLine } from "@/lib/calendar/ics";
import { festivalSlugForDesc } from "@/lib/kosher/festivals";
import type { CalendarItem } from "@/lib/kosher/zmanim";
import { KOSHER_URL } from "@/lib/seo/site";

/**
 * iCalendar (RFC 5545) de una ciudad: velas y Havdalá con su hora, y parashá, festividades, ayunos y Rosh Jodesh
 * como eventos de día completo. Las velas traen un aviso 20 minutos antes (Apple y Outlook lo respetan; Google
 * Calendar usa las notificaciones de cada persona).
 */

export const CANDLE_ALARM_MINUTES = 20;

type FeedCity = { slug: string; city: string; timezone: string };

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** 20261016T214200Z */
function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const compact = (day: string) => day.replace(/-/g, "");

function addDay(day: string, n = 1) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const uidPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** «Velas de Shabat», «Velas de iom tov», «Velas de Shabat y iom tov» o «Velas de Iom Kipur», según el día siguiente. */
function candleTitle(item: CalendarItem, byDay: Map<string, CalendarItem[]>) {
  const tomorrow = byDay.get(addDay(item.day)) ?? [];
  if (tomorrow.some((i) => i.desc === "Yom Kippur")) return "Velas de Iom Kipur";
  const yomTov = tomorrow.some((i) => i.kind === "chag");
  const friday = new Date(`${item.day}T12:00:00Z`).getUTCDay() === 5;
  if (friday) return yomTov ? "Velas de Shabat y iom tov" : "Velas de Shabat";
  return "Velas de iom tov";
}

export function kosherIcs(city: FeedCity, items: CalendarItem[], now = new Date()) {
  const stamp = icsStamp(now);
  const cityPage = `${KOSHER_URL}/calendario?ciudad=${city.slug}`;
  const byDay = new Map<string, CalendarItem[]>();
  for (const i of items) byDay.set(i.day, [...(byDay.get(i.day) ?? []), i]);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mercav//Kosher//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`Mercav Kosher · ${city.city}`)}`,
    `X-WR-CALDESC:${escapeText(`Velas, Havdalá, parashá y festividades del calendario hebreo en ${city.city}.`)}`,
    `X-WR-TIMEZONE:${city.timezone}`,
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
  ];

  for (const item of items) {
    const uid = `${city.slug}-${compact(item.day)}-${item.kind}-${uidPart(item.desc)}@kosher.mercav.lat`;
    const festival = festivalSlugForDesc(item.desc);
    const url = festival ? `${KOSHER_URL}/festividades/${festival}` : item.time ? cityPage : null;
    lines.push("BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stamp}`);

    if (item.time) {
      // Evento puntual: sin DTEND dura cero minutos, que es lo que es.
      const candles = item.kind === "candles";
      const title = candles ? candleTitle(item, byDay) : "Havdalá";
      const note = candles
        ? `Encendido de velas en ${city.city}, 18 minutos antes de la puesta del sol.`
        : `Havdalá en ${city.city}, 42 minutos después de la puesta del sol.`;
      lines.push(
        `DTSTART:${icsStamp(new Date(item.time))}`,
        `SUMMARY:${escapeText(title)}`,
        `DESCRIPTION:${escapeText(`${note} Cada kehilá tiene su minhag: ante la duda, seguí el horario de tu sinagoga.`)}`,
        "TRANSP:TRANSPARENT",
      );
      if (url) lines.push(`URL:${url}`);
      if (candles) {
        lines.push(
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeText(`${title} en ${CANDLE_ALARM_MINUTES} minutos`)}`,
          `TRIGGER:-PT${CANDLE_ALARM_MINUTES}M`,
          "END:VALARM",
        );
      }
    } else {
      // Iom Kipur y Tishá BeAv son ayunos que empiezan la noche anterior; los menores, al amanecer.
      const minorFast = festival === "ayunos-menores";
      const note = [
        item.hebrew,
        item.kind === "chag" || (item.kind === "fast" && !minorFast) ? "Empieza al atardecer del día anterior." : null,
        minorFast ? "Se ayuna desde el amanecer hasta la salida de las estrellas." : null,
        url ? `Qué es y qué se acostumbra: ${url}` : null,
      ].filter(Boolean);
      lines.push(
        `DTSTART;VALUE=DATE:${compact(item.day)}`,
        // DTEND es exclusivo: el día siguiente.
        `DTEND;VALUE=DATE:${compact(addDay(item.day))}`,
        `SUMMARY:${escapeText(item.title)}`,
        `DESCRIPTION:${escapeText(note.join("\n"))}`,
        "TRANSP:TRANSPARENT",
      );
      if (url) lines.push(`URL:${url}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
// creado por pato dev y askforvini
