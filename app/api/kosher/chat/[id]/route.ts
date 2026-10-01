import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

/** Three reports from different members hide a message until a moderator reviews it. */
const HIDE_AFTER_FLAGS = 3;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  // Modo Shabat: escritura bloqueada también en el servidor.
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-flag", capacity: 10, refillPerMinute: 5, userId: viewer.id });
  if (limited) return limited;

  const message = await prisma.kosherMessage.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!message) return kosherError(404, "Mensaje no encontrado");
  if (message.userId === viewer.id) return kosherError(400, "No podés reportar tu propio mensaje.");

  try {
    await prisma.kosherMessageFlag.create({ data: { messageId: params.id, userId: viewer.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ success: true });
    }
    throw error;
  }
  const flags = await prisma.kosherMessageFlag.count({ where: { messageId: params.id } });
  if (flags >= HIDE_AFTER_FLAGS || viewer.isModerator) {
    await prisma.kosherMessage.update({ where: { id: params.id }, data: { hidden: true } });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  // Modo Shabat: escritura bloqueada también en el servidor.
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const message = await prisma.kosherMessage.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!message) return kosherError(404, "Mensaje no encontrado");
  if (message.userId !== viewer.id && !viewer.isModerator) return kosherError(403, "Acceso denegado");
  await prisma.kosherMessage.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
