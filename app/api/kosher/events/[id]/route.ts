import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  const event = await prisma.kosherEvent.findUnique({ where: { id: params.id }, select: { createdById: true } });
  if (!event) return kosherError(404, "Evento no encontrado");
  if (event.createdById !== viewer.id && !viewer.isModerator) return forbidden();
  await prisma.kosherEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true, message: "Evento eliminado." });
}
