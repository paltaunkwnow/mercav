import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCalendarPrefs, saveCalendarPrefs, sessionUserId } from "@/lib/calendar/server";
import { originFor } from "@/app/api/loyalty/_lib/server";

/** Link de suscripción (webcal) del calendario de la sesión: verlo, crearlo o regenerarlo, y desactivarlo. */

function feedUrls(token: string) {
  const h = headers();
  const https = `${originFor(h.get("host"), h.get("x-forwarded-proto"))}/api/calendar/feed/${token}.ics`;
  return { url: https, webcal: https.replace(/^https?:\/\//, "webcal://") };
}

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return Response.json({ success: false, error: "No autorizado" }, { status: 401 });
  const pref = await prisma.calendarPreference.findUnique({ where: { userId }, select: { feedToken: true } });
  return Response.json({ success: true, data: pref?.feedToken ? feedUrls(pref.feedToken) : null }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Crea el link, o lo regenera: el anterior deja de funcionar. */
export async function POST() {
  const userId = await sessionUserId();
  if (!userId) return Response.json({ success: false, error: "No autorizado" }, { status: 401 });
  const feedToken = randomBytes(32).toString("base64url");
  // Sin preferencias guardadas, la persona ve las de por defecto: se guardan tal cual antes de colgarles el link
  // (crear la fila vacía le borraba los feriados que estaba viendo).
  const existing = await prisma.calendarPreference.findUnique({ where: { userId }, select: { userId: true } });
  if (!existing) await saveCalendarPrefs(userId, await getCalendarPrefs(userId));
  await prisma.calendarPreference.update({ where: { userId }, data: { feedToken } });
  return Response.json({ success: true, data: feedUrls(feedToken) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE() {
  const userId = await sessionUserId();
  if (!userId) return Response.json({ success: false, error: "No autorizado" }, { status: 401 });
  await prisma.calendarPreference.updateMany({ where: { userId }, data: { feedToken: null } });
  return Response.json({ success: true, data: null });
}
// creado por pato dev y askforvini
