import { addDays } from "./bolivia";
import type { CalendarEntry } from "./types";

/** iCalendar (RFC 5545) con eventos de día completo. */

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Corta en líneas de hasta 75 octetos; las continuaciones empiezan con un espacio. */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function compact(date: string) {
  return date.replace(/-/g, "");
}

/** Fecha y hora UTC en formato iCalendar: 20261009T153000Z. */
function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * UID estable entre descargas: `${clave}-${año}-${n}@mercav.lat`, con n = número de aparición de esa
 * clave en el año (Pésaj tiene ocho días). Sin la fecha adentro, así un feriado trasladado por
 * decreto actualiza el evento en vez de duplicarlo al volver a importar.
 */
function stableUids(entries: CalendarEntry[]) {
  const counts = new Map<string, number>();
  return entries.map((e) => {
    const year = e.date.slice(0, 4);
    const n = (counts.get(`${e.key}|${year}`) ?? 0) + 1;
    counts.set(`${e.key}|${year}`, n);
    return `${e.key.replace(/[^A-Za-z0-9-]/g, "-")}-${year}-${n}@mercav.lat`;
  });
}

/**
 * Arma el .ics. Pasale los años completos: los UID se numeran contra todo el año, y `from`/`to`
 * (yyyy-mm-dd, `to` exclusivo) recortan después, así un mismo día tiene el mismo UID en cualquier descarga.
 */
export function buildIcs(
  entries: CalendarEntry[],
  opts: { name: string; stamp?: Date; from?: string; to?: string; /** Suscripción: pedir a la app que lo vuelva a leer cada día. */ refreshDaily?: boolean } = { name: "Mercav — Feriados" },
) {
  const stamp = icsStamp(opts.stamp ?? new Date());
  const all = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const allUids = stableUids(all);
  const keep = all.map((e) => (!opts.from || e.date >= opts.from) && (!opts.to || e.date < opts.to));
  const sorted = all.filter((_, i) => keep[i]);
  const uids = allUids.filter((_, i) => keep[i]);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mercav//Calendario//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    ...(opts.refreshDaily ? ["REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D"] : []),
  ];
  sorted.forEach((e, i) => {
    const description = [e.note, e.hebrewDate, e.hebrew].filter(Boolean).join(" · ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uids[i]}`,
      `DTSTAMP:${stamp}`,
      // No guardamos cuándo cambió cada fecha: va el momento de la descarga.
      `LAST-MODIFIED:${stamp}`,
      "SEQUENCE:0",
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      // DTEND es exclusivo: el día siguiente.
      `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`,
      `SUMMARY:${escapeText(e.title)}`,
      ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
      `TRANSP:${e.dayOff ? "OPAQUE" : "TRANSPARENT"}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
// creado por pato dev y askforvini
