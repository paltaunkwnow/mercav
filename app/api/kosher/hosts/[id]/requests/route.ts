import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { notifyUser } from "@/lib/kosher/notify";
import { getKosherViewer, kosherError, publicAuthorName, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(10),
  message: z.string().trim().min(20, "Presentate en un par de frases.").max(600),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-host-request", capacity: 5, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá tu pedido.");
  const date = new Date(`${parsed.data.date}T12:00:00Z`);
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  if (date < today || date.getTime() > today.getTime() + 90 * 86_400_000) return kosherError(400, "Elegí un Shabat de los próximos tres meses.");
  if (![5, 6].includes(date.getUTCDay())) return kosherError(400, "Elegí el viernes o el sábado de ese Shabat.");

  const host = await prisma.kosherHost.findUnique({ where: { id: params.id }, select: { id: true, userId: true, state: true, active: true, capacity: true } });
  if (!host || host.state !== "approved" || !host.active) return kosherError(404, "Esta mesa no está recibiendo invitados.");
  if (host.userId === viewer.id) return kosherError(400, "Es tu propia mesa.");
  if (parsed.data.guests > host.capacity) return kosherError(400, `Esta mesa recibe hasta ${host.capacity} personas.`);

  const duplicate = await prisma.kosherHostRequest.findUnique({ where: { hostId_guestId_date: { hostId: host.id, guestId: viewer.id, date } } });
  if (duplicate) return kosherError(409, "Ya le pediste lugar para ese Shabat.");

  try {
    await prisma.kosherHostRequest.create({ data: { hostId: host.id, guestId: viewer.id, date, guests: parsed.data.guests, message: parsed.data.message } });
  } catch (error) {
    // Carrera contra el unique (hostId, guestId, date): mismo mensaje que el duplicado.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return kosherError(409, "Ya le pediste lugar para ese Shabat.");
    }
    throw error;
  }
  await notifyUser(host.userId, "Pedido para tu mesa de Shabat", `${publicAuthorName(viewer.name)} quiere sumarse (${parsed.data.guests}).`, "/kosher/comunidad/shabat#pedidos");
  return NextResponse.json({ success: true }, { status: 201 });
}
