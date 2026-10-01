import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

const schema = z.object({
  denomination: z.enum(["orthodox", "conservative", "other"]).nullable().optional(),
  orthodoxStream: z.enum(["modern", "yeshivish", "chabad", "hasidic", "sephardi", "other"]).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  countryCode: z.string().trim().length(2).transform((v) => v.toUpperCase()).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  shabbatMode: z.boolean().optional(),
  timezone: z
    .string()
    .max(64)
    .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz) || tz === "UTC")
    .nullable()
    .optional(),
});

export async function PATCH(request: NextRequest) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Revisá tus preferencias.");
  // Si el request manda lat: null explícito, no hay que caer al valor viejo del perfil.
  const nextLat = parsed.data.lat !== undefined ? parsed.data.lat : viewer.profile?.lat;
  const nextLng = parsed.data.lng !== undefined ? parsed.data.lng : viewer.profile?.lng;
  const nextMode = parsed.data.shabbatMode ?? viewer.profile?.shabbatMode ?? false;
  if (nextMode && (nextLat == null || nextLng == null)) {
    return kosherError(400, "Elegí tu ciudad para calcular el horario de Shabat.");
  }

  const profile = await prisma.kosherProfile.upsert({
    where: { userId: viewer.id },
    create: { userId: viewer.id, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ success: true, profile });
}
