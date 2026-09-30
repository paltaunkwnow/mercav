import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

const INVITE_DAYS = 30;

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isModerator) return forbidden("Solo moderadores pueden invitar instituciones.");
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true, published: true } });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");

  const token = randomBytes(24).toString("base64url");
  await prisma.kosherInvite.create({
    data: { token, placeId: place.id, createdById: viewer.id, expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) },
  });
  return NextResponse.json({ success: true, token }, { status: 201 });
}
