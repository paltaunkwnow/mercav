import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { YEAR_SPAN } from "./dates";
import { normalizePrefs } from "./sources";
import type { CalendarPrefs } from "./types";

/** Usuario de la sesión actual (solo id). null si no hay sesión. */
export async function sessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/** País y zona horaria de la cuenta (si no tiene, Bolivia). */
export async function userLocale(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { countryCode: true, timezone: true } });
  const country = latamCountry(user?.countryCode);
  const timezone = user?.timezone || country.timezone;
  return { countryCode: user?.countryCode ?? null, timezone, today: todayIn(timezone) };
}

export async function getCalendarPrefs(userId: string): Promise<CalendarPrefs> {
  const [row, user] = await Promise.all([
    prisma.calendarPreference.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { countryCode: true } }),
  ]);
  return normalizePrefs(row, user?.countryCode);
}

export async function saveCalendarPrefs(userId: string, prefs: CalendarPrefs): Promise<CalendarPrefs> {
  const clean = normalizePrefs(prefs, prefs.country);
  await prisma.calendarPreference.upsert({
    where: { userId },
    create: { userId, ...clean },
    update: clean,
  });
  return clean;
}

/**
 * Año pedido por query. Sin año, el actual. Inválido o fuera de rango: null, y la API responde 400
 * (antes devolvía el año actual y el cliente mostraba fechas de otro año sin darse cuenta).
 */
export function parseYear(raw: string | null): number | null {
  const now = new Date().getFullYear();
  if (raw === null || raw === "") return now;
  const year = Number(raw);
  // Un año de margen sobre lo que navega el cliente: el año del servidor (UTC) puede ir uno adelante.
  return Number.isInteger(year) && Math.abs(year - now) <= YEAR_SPAN + 1 ? year : null;
}
// creado por pato dev y askforvini
