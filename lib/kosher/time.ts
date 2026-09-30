/** Formatting helpers that always render in the city's timezone, never the server's. */

export function formatTime(date: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat("es", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(date));
}

export function formatDay(date: Date | string, timeZone: string, opts: Intl.DateTimeFormatOptions = {}) {
  const text = new Intl.DateTimeFormat("es", { timeZone, weekday: "long", day: "numeric", month: "long", ...opts }).format(new Date(date));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateTime(date: Date | string, timeZone: string) {
  return `${formatDay(date, timeZone, { weekday: "short", month: "short" })} · ${formatTime(date, timeZone)}`;
}

function offsetMs(instant: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, Number(p.value)]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(instant / 1000) * 1000;
}

/** Reads a `yyyy-mm-ddThh:mm` wall-clock time as local to `timeZone`. */
export function zonedToUtc(local: string, timeZone: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = wall - offsetMs(wall, timeZone);
  guess = wall - offsetMs(guess, timeZone);
  return new Date(guess);
}

/** yyyy-mm-dd of the instant as seen in `timeZone`. */
export function dayKey(date: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}
