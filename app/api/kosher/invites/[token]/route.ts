import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

const schema = z.object({
  contactName: z.string().trim().min(2).max(80),
  contactRole: z.string().trim().min(2).max(80),
  contactPhone: z.string().trim().max(40).nullable().optional(),
});

/** A moderator already vetted the institution when issuing the link, so redeeming grants access directly. */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Completá tu nombre y tu rol.");

  const invite = await prisma.kosherInvite.findUnique({ where: { token: params.token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) return kosherError(410, "Esta invitación venció o ya se usó. Pedí una nueva al equipo de Mercav Kosher.");

  await prisma.$transaction([
    prisma.kosherInvite.update({ where: { id: invite.id }, data: { usedById: viewer.id, usedAt: new Date() } }),
    prisma.kosherPlaceManager.upsert({
      where: { placeId_userId: { placeId: invite.placeId, userId: viewer.id } },
      create: { placeId: invite.placeId, userId: viewer.id },
      update: {},
    }),
    prisma.kosherClaim.create({
      data: {
        kind: "ownership",
        placeId: invite.placeId,
        userId: viewer.id,
        ...parsed.data,
        contactPhone: parsed.data.contactPhone || null,
        evidence: `Invitación emitida por un moderador el ${invite.createdAt.toISOString().slice(0, 10)}.`,
        state: "approved",
        reviewedById: invite.createdById,
        reviewedAt: new Date(),
      },
    }),
  ]);
  return NextResponse.json({ success: true });
}
