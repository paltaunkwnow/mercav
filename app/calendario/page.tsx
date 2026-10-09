import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildCalendar, daysOffFor, latamRegions } from "@/lib/calendar";
import { parseDateParam } from "@/lib/calendar/dates";
import { getCalendarPrefs, sessionUserId, userLocale } from "@/lib/calendar/server";
import { CalendarClient, type CalendarYearData } from "@/components/calendar/CalendarClient";

export const metadata: Metadata = {
  title: "Calendario",
  description: "Feriados de tu país y fechas del calendario hebreo, con las fuentes que elijas.",
};

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: { fecha?: string | string[] } }) {
  const rawDate = typeof searchParams.fecha === "string" ? searchParams.fecha : null;
  const userId = await sessionUserId();
  if (!userId) {
    // El link con fecha sobrevive al login (solo si tiene forma de fecha).
    const back = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? `/calendario?fecha=${rawDate}` : "/calendario";
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }

  // "Hoy" en la zona horaria de la cuenta, no la del servidor.
  const [{ today }, prefs] = await Promise.all([userLocale(userId), getCalendarPrefs(userId)]);
  const year = Number(today.slice(0, 4));
  // ?fecha=yyyy-mm-dd abre ese día (links de /inicio y de afuera).
  const initialDate = parseDateParam(rawDate, today);
  // Este año y el que viene (para "Próximas fechas" cerca de fin de año), más el del link si es otro.
  const years = Array.from(new Set([year, year + 1, ...(initialDate ? [Number(initialDate.slice(0, 4))] : [])]));
  const initialYears: Record<number, CalendarYearData> = Object.fromEntries(
    years.map((y) => [y, { entries: buildCalendar(y, prefs, { includeHidden: true }), daysOff: daysOffFor(y, prefs) }]),
  );

  return <CalendarClient today={today} initialDate={initialDate} initialYears={initialYears} initialPrefs={prefs} regions={latamRegions()} />;
}
// creado por pato dev y askforvini
