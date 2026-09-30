import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EDITABLE_FIELDS, type EditableField } from "@/lib/kosher/edits";
import { listCities } from "@/lib/kosher/cities";
import { notifyCity, notifyUser } from "@/lib/kosher/notify";
import { getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

const KINDS = ["edit", "place", "message", "event", "host", "chesed", "claim"] as const;

const schema = z.object({ kind: z.enum(KINDS), id: z.string().uuid(), decision: z.enum(["accepted", "rejected"]) });

async function citySlug(city: string, countryCode: string) {
  return (await listCities()).find((c) => c.city === city && c.countryCode === countryCode)?.slug ?? "";
}

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isModerator) return kosherError(403, "Necesitás rol de moderador de Kosher.");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Acción no válida");
  const { kind, id, decision } = parsed.data;
  const accepted = decision === "accepted";
  const state = accepted ? "approved" : "rejected";

  if (kind === "edit") {
    const edit = await prisma.kosherEditSuggestion.findUnique({ where: { id } });
    if (!edit || edit.status !== "pending") return kosherError(404, "Sugerencia no encontrada");
    await prisma.$transaction(async (tx) => {
      await tx.kosherEditSuggestion.update({
        where: { id },
        data: { status: decision, reviewedById: viewer.id, reviewedAt: new Date() },
      });
      if (accepted && edit.field in EDITABLE_FIELDS) {
        const field = edit.field as EditableField;
        await tx.kosherPlace.update({
          where: { id: edit.placeId },
          data: { [field]: edit.newValue, ...(field === "status" ? { confirmedAt: new Date() } : {}) },
        });
      }
    });
  } else if (kind === "place") {
    if (accepted) {
      await prisma.kosherPlace.update({ where: { id }, data: { published: true } });
    } else {
      await prisma.kosherPlace.deleteMany({ where: { id, published: false } });
    }
  } else if (kind === "message") {
    if (accepted) {
      await prisma.$transaction([
        prisma.kosherMessageFlag.deleteMany({ where: { messageId: id } }),
        prisma.kosherMessage.update({ where: { id }, data: { hidden: false } }),
      ]);
    } else {
      await prisma.kosherMessage.delete({ where: { id } });
    }
  } else if (kind === "event") {
    const event = await prisma.kosherEvent.findUnique({ where: { id } });
    if (!event || event.state !== "pending") return kosherError(404, "Evento no encontrado");
    await prisma.kosherEvent.update({ where: { id }, data: { state } });
    if (accepted) {
      const slug = await citySlug(event.city, event.countryCode);
      await notifyCity({
        city: event.city,
        countryCode: event.countryCode,
        topic: "agenda",
        title: `Agenda de ${event.city}: ${event.title}`,
        body: event.body ?? "Nuevo evento en la agenda de tu comunidad.",
        link: `/kosher/comunidad/agenda?ciudad=${slug}`,
        exclude: event.createdById,
      });
    }
    await notifyUser(event.createdById, accepted ? "Tu evento está en la agenda" : "Tu evento no se publicó", event.title, "/kosher/comunidad/agenda");
  } else if (kind === "host") {
    const host = await prisma.kosherHost.findUnique({ where: { id } });
    if (!host || host.state !== "pending") return kosherError(404, "Anfitrión no encontrado");
    await prisma.kosherHost.update({ where: { id }, data: { state } });
    await notifyUser(
      host.userId,
      accepted ? "Tu mesa de Shabat está publicada" : "Tu mesa de Shabat no se publicó",
      accepted ? "Ya aparecés para quienes visitan tu ciudad." : "Escribinos si querés contarnos más sobre tu mesa.",
      "/kosher/comunidad/shabat",
    );
  } else if (kind === "chesed") {
    const post = await prisma.kosherChesed.findUnique({ where: { id } });
    if (!post || post.state !== "pending") return kosherError(404, "Publicación no encontrada");
    await prisma.kosherChesed.update({ where: { id }, data: { state } });
    if (accepted) {
      const slug = await citySlug(post.city, post.countryCode);
      await notifyCity({
        city: post.city,
        countryCode: post.countryCode,
        topic: "jesed",
        title: `Jésed en ${post.city}: ${post.title}`,
        body: post.body,
        link: `/kosher/comunidad/jesed?ciudad=${slug}`,
        exclude: post.createdById,
      });
    }
    await notifyUser(post.createdById, accepted ? "Tu pedido de jésed está publicado" : "Tu pedido de jésed no se publicó", post.title, "/kosher/comunidad/jesed");
  } else {
    const claim = await prisma.kosherClaim.findUnique({ where: { id }, include: { place: { select: { slug: true, name: true } } } });
    if (!claim || claim.state !== "pending") return kosherError(404, "Solicitud no encontrada");
    await prisma.$transaction(async (tx) => {
      await tx.kosherClaim.update({ where: { id }, data: { state, reviewedById: viewer.id, reviewedAt: new Date() } });
      if (!accepted) return;
      if (claim.kind === "ownership") {
        await tx.kosherPlaceManager.upsert({
          where: { placeId_userId: { placeId: claim.placeId, userId: claim.userId } },
          create: { placeId: claim.placeId, userId: claim.userId },
          update: {},
        });
      } else {
        await tx.kosherPlace.update({
          where: { id: claim.placeId },
          data: {
            status: "certified",
            agencyName: claim.agencyName,
            certificateUrl: claim.certificateUrl,
            certExpiresAt: claim.certExpiresAt,
            confirmedAt: new Date(),
            verifiedAt: new Date(),
          },
        });
      }
    });
    const what = claim.kind === "ownership" ? "administrar la ficha" : "el certificado";
    await notifyUser(
      claim.userId,
      accepted ? `Aprobamos ${what} de ${claim.place.name}` : `No pudimos verificar ${what} de ${claim.place.name}`,
      accepted ? "Ya podés gestionarla desde Mercav Kosher." : "Respondé con más datos o pedí una invitación al equipo.",
      `/kosher/lugar/${claim.place.slug}/administrar`,
    );
  }
  return NextResponse.json({ success: true });
}
