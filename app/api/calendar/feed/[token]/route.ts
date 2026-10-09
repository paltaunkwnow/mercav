import { prisma } from "@/lib/prisma";
import { buildCalendar } from "@/lib/calendar";
import { buildIcs } from "@/lib/calendar/ics";
import { getCalendarPrefs, userLocale } from "@/lib/calendar/server";

/**
 * Calendario suscripto (Google Calendar, Apple, Outlook). Lo leen sin sesión: el token del link es la llave.
 * Va el año en curso y el siguiente, con lo que la persona eligió ver; la app lo vuelve a leer cada día, así los
 * cambios por decreto llegan solos.
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const token = params.token.replace(/\.ics$/i, "");
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return new Response("No encontrado", { status: 404 });
  const pref = await prisma.calendarPreference.findUnique({ where: { feedToken: token }, select: { userId: true } });
  if (!pref) return new Response("No encontrado", { status: 404 });

  const [prefs, { today }] = await Promise.all([getCalendarPrefs(pref.userId), userLocale(pref.userId)]);
  const year = Number(today.slice(0, 4));
  const ics = buildIcs([...buildCalendar(year, prefs), ...buildCalendar(year + 1, prefs)], { name: "Mercav — Calendario", refreshDaily: true });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="mercav-calendario.ics"',
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
// creado por pato dev y askforvini
