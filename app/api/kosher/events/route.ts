import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { cityBySlug } from "@/lib/kosher/cities";
import { notifyCity } from "@/lib/kosher/notify";
import { zonedToUtc } from "@/lib/kosher/time";
import { getKosherViewer, kosherError, managesPlace, unauthorized, writeGuard } from "@/lib/kosher/server";

const local = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Elegí fecha y hora.");

const schema = z.object({
  kind: z.enum(["shiur", "tefila", "jag", "comunidad", "juventud", "otro"]),
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().max(1500).nullable().optional(),
  citySlug: z.string().min(1),
  placeSlug: z.string().nullable().optional(),
  startsAt: local,
  endsAt: local.nullable().optional(),
});

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-events", capacity: 6, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos del evento.");
  const d = parsed.data;
  const city = await cityBySlug(d.citySlug);
  if (!city) return kosherError(400, "Elegí una ciudad de la lista.");
  const startsAt = zonedToUtc(d.startsAt, city.timezone)!;
  const endsAt = d.endsAt ? zonedToUtc(d.endsAt, city.timezone) : null;
  if (startsAt.getTime() < Date.now() - 3_600_000) return kosherError(400, "La fecha ya pasó.");
  if (endsAt && endsAt <= startsAt) return kosherError(400, "El final tiene que ser después del inicio.");
  const place = d.placeSlug ? await prisma.kosherPlace.findUnique({ where: { slug: d.placeSlug }, select: { id: true, published: true } }) : null;
  if (d.placeSlug && !place?.published) return kosherError(400, "Ese lugar no está en el atlas.");

  const official = !!place && (await managesPlace(viewer.id, place.id));
  const approved = official || viewer.isModerator;
  const event = await prisma.kosherEvent.create({
    data: {
      kind: d.kind,
      title: d.title,
      body: d.body || null,
      city: city.city,
      countryCode: city.countryCode,
      placeId: place?.id ?? null,
      startsAt,
      endsAt,
      official,
      state: approved ? "approved" : "pending",
      createdById: viewer.id,
    },
  });
  if (approved) {
    await notifyCity({
      city: city.city,
      countryCode: city.countryCode,
      topic: "agenda",
      title: `Agenda de ${city.city}: ${d.title}`,
      body: d.body ?? "Nuevo evento en la agenda de tu comunidad.",
      link: `/kosher/comunidad/agenda?ciudad=${city.slug}`,
      exclude: viewer.id,
    });
  }
  return NextResponse.json(
    { success: true, id: event.id, message: approved ? "Publicado en la agenda." : "Enviado. Un moderador lo revisa antes de publicarlo." },
    { status: 201 },
  );
}
