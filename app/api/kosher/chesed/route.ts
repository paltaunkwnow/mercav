import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { cityBySlug } from "@/lib/kosher/cities";
import { notifyCity } from "@/lib/kosher/notify";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({
  kind: z.enum(["volunteer", "bikur_cholim", "donation", "need"]),
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().min(10).max(1500),
  citySlug: z.string().min(1),
  contact: z.string().trim().max(160).nullable().optional(),
  days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
});

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-chesed", capacity: 4, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Contá qué se necesita en al menos una frase.");
  const d = parsed.data;
  const city = await cityBySlug(d.citySlug);
  if (!city) return kosherError(400, "Elegí una ciudad de la lista.");

  const approved = viewer.isModerator;
  const post = await prisma.kosherChesed.create({
    data: {
      kind: d.kind,
      title: d.title,
      body: d.body,
      city: city.city,
      countryCode: city.countryCode,
      contact: d.contact || null,
      expiresAt: new Date(Date.now() + d.days * 86_400_000),
      state: approved ? "approved" : "pending",
      createdById: viewer.id,
    },
  });
  if (approved) {
    await notifyCity({ city: city.city, countryCode: city.countryCode, topic: "jesed", title: `Jésed en ${city.city}: ${d.title}`, body: d.body, link: `/kosher/comunidad/jesed?ciudad=${city.slug}`, exclude: viewer.id });
  }
  return NextResponse.json({ success: true, id: post.id, message: approved ? "Publicado en el tablón." : undefined }, { status: 201 });
}
