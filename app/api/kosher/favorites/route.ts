import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({ slug: z.string().trim().min(1).max(120) });
const noStore = { "Cache-Control": "private, no-store" };

/** Los lugares que guardó la persona, del más reciente al más viejo. */
export async function GET() {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  const rows = await prisma.kosherFavorite.findMany({
    where: { userId: viewer.id, place: { published: true } },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      createdAt: true,
      place: { select: { slug: true, name: true, type: true, status: true, city: true, country: true, countryCode: true, verifiedAt: true } },
    },
  });
  return NextResponse.json(
    {
      success: true,
      favorites: rows.map((r) => ({
        slug: r.place.slug,
        name: r.place.name,
        type: r.place.type,
        status: r.place.status,
        verified: !!r.place.verifiedAt,
        city: r.place.city,
        country: r.place.country,
        countryCode: r.place.countryCode,
        savedAt: r.createdAt.toISOString(),
      })),
    },
    { headers: noStore },
  );
}

async function setSaved(request: NextRequest, save: boolean) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-favorite", capacity: 30, refillPerMinute: 15, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Falta el lugar.");
  const place = await prisma.kosherPlace.findUnique({ where: { slug: parsed.data.slug }, select: { id: true, published: true } });
  // Se puede sacar de guardados un lugar que ya no está publicado; guardar, no.
  if (!place || (save && !place.published)) return kosherError(404, "Lugar no encontrado");

  const key = { userId: viewer.id, placeId: place.id };
  if (save) await prisma.kosherFavorite.upsert({ where: { userId_placeId: key }, create: key, update: {} });
  else await prisma.kosherFavorite.deleteMany({ where: key });
  return NextResponse.json({ success: true, saved: save }, { headers: noStore });
}

export const POST = (request: NextRequest) => setSaved(request, true);
export const DELETE = (request: NextRequest) => setSaved(request, false);
// creado por pato dev y askforvini
