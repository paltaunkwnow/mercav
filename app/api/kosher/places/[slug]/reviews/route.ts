import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(600).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-review", capacity: 6, refillPerMinute: 2, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Elegí de 1 a 5 estrellas.");
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true, published: true } });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");

  const data = { rating: parsed.data.rating, body: parsed.data.body || null };
  await prisma.kosherReview.upsert({
    where: { placeId_userId: { placeId: place.id, userId: viewer.id } },
    create: { ...data, placeId: place.id, userId: viewer.id },
    update: data,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!place) return kosherError(404, "Lugar no encontrado");
  await prisma.kosherReview.deleteMany({ where: { placeId: place.id, userId: viewer.id } });
  return NextResponse.json({ success: true });
}
