import { buildCalendar } from "@/lib/calendar";
import { buildIcs } from "@/lib/calendar/ics";
import { getCalendarPrefs, parseYear, sessionUserId, userLocale } from "@/lib/calendar/server";

const headers = (filename: string) => ({
  "Content-Type": "text/calendar; charset=utf-8",
  "Content-Disposition": `attachment; filename="${filename}"`,
  "Cache-Control": "private, no-store",
});

/** .ics de un año (?year=2026) o de los próximos 12 meses desde hoy (?rango=12m). */
export async function GET(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return new Response("No autorizado", { status: 401 });
  const url = new URL(req.url);

  if (url.searchParams.get("rango") === "12m") {
    const [{ today }, prefs] = await Promise.all([userLocale(userId), getCalendarPrefs(userId)]);
    const year = Number(today.slice(0, 4));
    // Hasta el mismo día del año que viene (exclusivo). Se compara como texto, así que un 29 de febrero no molesta.
    const to = `${year + 1}${today.slice(4)}`;
    const ics = buildIcs([...buildCalendar(year, prefs), ...buildCalendar(year + 1, prefs)], { name: "Mercav — Próximos 12 meses", from: today, to });
    return new Response(ics, { headers: headers("mercav-proximos-12-meses.ics") });
  }

  const year = parseYear(url.searchParams.get("year"));
  if (year === null) return new Response("Año fuera de rango", { status: 400 });
  const prefs = await getCalendarPrefs(userId);
  const ics = buildIcs(buildCalendar(year, prefs), { name: `Mercav — Feriados ${year}` });
  return new Response(ics, { headers: headers(`mercav-feriados-${year}.ics`) });
}
// creado por pato dev y askforvini
