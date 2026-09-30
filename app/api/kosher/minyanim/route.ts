import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { cityBySlug } from "@/lib/kosher/cities";
import { PRAYER } from "@/lib/kosher/labels";
import { notifyCity } from "@/lib/kosher/notify";
import { formatDateTime, zonedToUtc } from "@/lib/kosher/time";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z
  .object({
    prayer: z.enum(["shacharit", "mincha", "maariv"]),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Elegí fecha y hora."),
    citySlug: z.string().min(1),
    placeSlug: z.string().nullable().optional(),
    locationNote: z.string().trim().max(160).nullable().optional(),
    note: z.string().trim().max(200).nullable().optional(),
  })
  .refine((d) => d.placeSlug || d.locationNote, { message: "Indicá la sinagoga o un punto de encuentro." });

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-minyan", capacity: 5, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos del minián.");
  const d = parsed.data;
  const city = await cityBySlug(d.citySlug);
  if (!city) return kosherError(400, "Elegí una ciudad de la lista.");
  const startsAt = zonedToUtc(d.startsAt, city.timezone)!;
  if (startsAt.getTime() < Date.now() - 15 * 60_000 || startsAt.getTime() > Date.now() + 14 * 86_400_000) {
    return kosherError(400, "El minián tiene que ser en los próximos 14 días.");
  }
  const place = d.placeSlug ? await prisma.kosherPlace.findUnique({ where: { slug: d.placeSlug }, select: { id: true, name: true, published: true } }) : null;
  if (d.placeSlug && !place?.published) return kosherError(400, "Ese lugar no está en el atlas.");

  const minyan = await prisma.kosherMinyan.create({
    data: {
      prayer: d.prayer,
      startsAt,
      city: city.city,
      countryCode: city.countryCode,
      placeId: place?.id ?? null,
      locationNote: d.locationNote || null,
      note: d.note || null,
      createdById: viewer.id,
      rsvps: { create: { userId: viewer.id } },
    },
  });
  await notifyCity({
    city: city.city,
    countryCode: city.countryCode,
    topic: "minian",
    title: `Se busca minián para ${PRAYER[d.prayer]} en ${city.city}`,
    body: `${formatDateTime(startsAt, city.timezone)} · ${place?.name ?? d.locationNote}`,
    link: `/kosher/comunidad/minian?ciudad=${city.slug}`,
    exclude: viewer.id,
  });
  return NextResponse.json({ success: true, id: minyan.id }, { status: 201 });
}
