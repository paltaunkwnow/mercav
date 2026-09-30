import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

/** Marks a post as resolved; it leaves the board but stays for moderation history. */
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  const post = await prisma.kosherChesed.findUnique({ where: { id: params.id }, select: { createdById: true } });
  if (!post) return kosherError(404, "Publicación no encontrada");
  if (post.createdById !== viewer.id && !viewer.isModerator) return forbidden();
  await prisma.kosherChesed.update({ where: { id: params.id }, data: { closed: true } });
  return NextResponse.json({ success: true, message: "Marcado como resuelto. Gracias." });
}
