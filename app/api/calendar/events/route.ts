import { NextResponse } from "next/server";
import { buildCalendar, daysOffFor } from "@/lib/calendar";
import { getCalendarPrefs, parseYear, sessionUserId } from "@/lib/calendar/server";
import { prefsVersion } from "@/lib/calendar/sources";

/*
 * Fechas de un año con las preferencias guardadas. El cliente agrega `v` (prefsVersion de lo que cree
 * guardado) para que el caché del navegador cambie de entrada cuando cambian las preferencias. Solo se
 * cachea si `v` coincide con lo guardado: si no, otra pestaña o un guardado en curso cambiaron algo.
 */
export async function GET(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  const url = new URL(req.url);
  const year = parseYear(url.searchParams.get("year"));
  if (year === null) return NextResponse.json({ success: false, error: "Año fuera de rango" }, { status: 400 });
  const prefs = await getCalendarPrefs(userId);
  const entries = buildCalendar(year, prefs, { includeHidden: url.searchParams.get("includeHidden") === "1" });
  const cacheable = url.searchParams.get("v") === prefsVersion(prefs);
  return NextResponse.json(
    { success: true, data: { year, entries, daysOff: daysOffFor(year, prefs) } },
    { headers: { "Cache-Control": cacheable ? "private, max-age=300" : "private, no-store", Vary: "Cookie" } },
  );
}
// creado por pato dev y askforvini
