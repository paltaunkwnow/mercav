import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cityBySlug } from "@/lib/kosher/cities";
import { MEALS } from "@/lib/kosher/labels";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({
  citySlug: z.string().min(1),
  capacity: z.number().int().min(1).max(20),
  meals: z.array(z.enum(Object.keys(MEALS) as [keyof typeof MEALS, ...(keyof typeof MEALS)[]])).min(1, "Elegí al menos una comida."),
  kashrut: z.string().trim().min(3).max(160),
  about: z.string().trim().min(20, "Contá un poco más sobre tu mesa.").max(1000),
  active: z.boolean(),
});

export async function PUT(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos de tu mesa.");
  const { citySlug, ...d } = parsed.data;
  const city = await cityBySlug(citySlug);
  if (!city) return kosherError(400, "Elegí una ciudad de la lista.");

  const existing = await prisma.kosherHost.findUnique({ where: { userId: viewer.id } });
  const contentChanged =
    !existing || existing.about !== d.about || existing.kashrut !== d.kashrut || existing.city !== city.city || existing.countryCode !== city.countryCode;
  const state = viewer.isModerator ? "approved" : contentChanged ? "pending" : existing!.state;
  const data = { ...d, city: city.city, countryCode: city.countryCode, state } as const;

  await prisma.kosherHost.upsert({ where: { userId: viewer.id }, create: { userId: viewer.id, ...data }, update: data });
  return NextResponse.json({
    success: true,
    message: state === "approved" ? "Tu mesa está publicada." : "Guardado. Un moderador de la kehilá lo revisa antes de mostrarlo.",
  });
}
