import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { STOCK } from "@/lib/kosher/labels";
import { notifyCity } from "@/lib/kosher/notify";
import { getKosherViewer, kosherError, publicAuthorName, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({
  category: z.enum(["meat", "wine", "matzah", "cheese", "frozen", "bakery"]),
  note: z.string().trim().min(3).max(300),
});

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-stock", capacity: 10, refillPerMinute: 2, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Escribí una nota breve de lo que viste.");
  const place = await prisma.kosherPlace.findUnique({
    where: { slug: params.slug },
    select: { id: true, published: true, name: true, city: true, countryCode: true },
  });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");

  const report = await prisma.kosherStockReport.create({
    data: {
      placeId: place.id,
      category: parsed.data.category,
      note: parsed.data.note,
      authorId: viewer.id,
      authorName: publicAuthorName(viewer.name),
    },
  });
  if (place.city) {
    await notifyCity({
      city: place.city,
      countryCode: place.countryCode,
      topic: "stock",
      title: `${STOCK[parsed.data.category]} en ${place.name}`,
      body: parsed.data.note,
      link: `/kosher/lugar/${params.slug}`,
      exclude: viewer.id,
    });
  }
  return NextResponse.json({ success: true, id: report.id }, { status: 201 });
}
