import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, type KosherStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { editValueProblem, isHttpUrl } from "@/lib/kosher/edits";
import { parseHours } from "@/lib/kosher/hours";
import { STATUS, isFoodPlace } from "@/lib/kosher/labels";
import { forbidden, getKosherViewer, kosherError, managesPlace, unauthorized, writeGuard } from "@/lib/kosher/server";
import { cleanServices, editableStatuses, hoursInputProblem, isTimeZone, statusLockedFor } from "@/components/kosher/manage/details";

const time = z.string().trim().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Usá el formato 24 h, por ejemplo 07:30.").optional();

// Cada campo es opcional: cada sección de Administrar guarda lo suyo y lo que no llega no se toca.
const schema = z.object({
  phone: z.string().trim().max(40).nullable().optional(),
  // refine: url() de zod deja pasar `javascript:`, que después se renderiza como href.
  website: z
    .string()
    .trim()
    .url("El sitio tiene que empezar con https://")
    .max(300)
    .refine(isHttpUrl, "El sitio tiene que empezar con https://")
    .nullable()
    .optional(),
  notes: z.string().trim().max(800).nullable().optional(),
  prayerTimes: z.object({ shacharit: time, mincha: time, maariv: time }).nullable().optional(),
  // El horario se valida aparte (hoursInputProblem) y se normaliza con parseHours.
  hours: z.unknown().optional(),
  timezone: z.string().trim().max(64).nullable().optional(),
  priceLevel: z.number().int().min(1).max(4).nullable().optional(),
  services: z.array(z.string().max(40)).max(20).optional(),
  status: z.enum(Object.keys(STATUS) as [KosherStatus, ...KosherStatus[]]).optional(),
});

/**
 * Quien administra la ficha (y moderación) edita contacto, horario, precio, servicios y el nivel de kashrut.
 * "Certificado" no se elige acá: sale de un certificado revisado por moderación (claim de tipo certificate).
 */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true, type: true, status: true } });
  if (!place) return kosherError(404, "Lugar no encontrado");
  if (!viewer.isModerator && !(await managesPlace(viewer.id, place.id))) return forbidden("Solo quien administra la ficha puede editarla.");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos.");
  const d = parsed.data;
  const data: Prisma.KosherPlaceUpdateInput = {};

  if (d.phone !== undefined) data.phone = d.phone || null;
  if (d.website !== undefined) data.website = d.website || null;
  if (d.notes !== undefined) data.notes = d.notes || null;
  if (d.prayerTimes !== undefined) data.prayerTimes = d.prayerTimes ?? Prisma.DbNull;

  if (d.hours !== undefined) {
    const problem = hoursInputProblem(d.hours);
    if (problem) return kosherError(400, problem);
    const hours = parseHours(d.hours);
    data.hours = hours ? (hours as Prisma.InputJsonObject) : Prisma.DbNull;
  }
  if (d.timezone !== undefined) {
    if (d.timezone && !isTimeZone(d.timezone)) return kosherError(400, "No reconocemos esa zona horaria.");
    data.timezone = d.timezone || null;
  }
  if (d.priceLevel !== undefined) data.priceLevel = d.priceLevel;
  if (d.services !== undefined) {
    const services = cleanServices(place.type, d.services);
    if (!services) return kosherError(400, "Hay un servicio que no aplica a este lugar.");
    data.services = services;
  }

  // Mandar el nivel que ya tiene no cambia nada (también si es "certified").
  if (d.status !== undefined && d.status !== place.status) {
    if (!isFoodPlace(place.type)) return kosherError(400, "El nivel de kashrut aplica a lugares de comida.");
    const problem = editValueProblem("status", d.status);
    if (problem) return kosherError(400, problem);
    if (statusLockedFor(place.status, viewer.isModerator)) return forbidden("Hay una revisión abierta sobre el kashrut de este lugar: la resuelve moderación.");
    if (!editableStatuses(viewer.isModerator).includes(d.status)) return forbidden("Ese nivel lo carga moderación.");
    data.status = d.status;
    data.confirmedAt = new Date();
    // Sin certificado vigente, la ficha no muestra el enlace ni el vencimiento del anterior.
    if (place.status === "certified") {
      data.certificateUrl = null;
      data.certExpiresAt = null;
    }
  }

  if (Object.keys(data).length) await prisma.kosherPlace.update({ where: { id: place.id }, data });
  return NextResponse.json({ success: true });
}
// creado por pato dev y askforvini
