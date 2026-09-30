import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { forbidden, getKosherViewer, kosherError, managesPlace, unauthorized, writeGuard } from "@/lib/kosher/server";

const time = z.string().trim().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Usá el formato 24 h, por ejemplo 07:30.").optional();

const schema = z.object({
  phone: z.string().trim().max(40).nullable(),
  website: z.string().trim().url("El sitio tiene que empezar con https://").max(300).nullable(),
  notes: z.string().trim().max(800).nullable(),
  prayerTimes: z.object({ shacharit: time, mincha: time, maariv: time }).nullable(),
});

/** Managers edit contact details directly; kashrut status only changes through a reviewed certificate. */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!place) return kosherError(404, "Lugar no encontrado");
  if (!(await managesPlace(viewer.id, place.id))) return forbidden("Solo quien administra la ficha puede editarla.");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos.");
  const { prayerTimes, ...rest } = parsed.data;
  await prisma.kosherPlace.update({
    where: { id: place.id },
    data: { ...rest, prayerTimes: prayerTimes ?? Prisma.DbNull },
  });
  return NextResponse.json({ success: true });
}
