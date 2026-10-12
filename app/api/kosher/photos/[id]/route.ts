import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forbidden, getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";
import { CAPTION_MAX, MAX_PHOTOS } from "@/components/kosher/manage/details";
import { canEditPlace, listPhotos, renumber } from "@/app/api/kosher/photos/_lib/photos";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => kosherError(404, "Foto no encontrada");

/** Los bytes de la foto. Una foto nunca cambia (editarla es subir otra), así que se cachea para siempre. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return notFound();
  const etag = `"${params.id}"`;
  const cache = { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable", ETag: etag };
  if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: cache });

  const photo = await prisma.kosherPhoto.findUnique({
    where: { id: params.id },
    select: { data: true, mime: true, place: { select: { published: true } } },
  });
  if (!photo?.place.published) return notFound();
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      ...cache,
      "Content-Type": photo.mime,
      "Content-Length": String(photo.data.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const patchSchema = z
  .object({
    caption: z.string().trim().max(CAPTION_MAX, `El epígrafe tiene hasta ${CAPTION_MAX} caracteres.`).nullable().optional(),
    /** Posición final, desde 0. */
    position: z.number().int().min(0).max(MAX_PHOTOS - 1).optional(),
    /** true la deja de portada; false la saca si lo era. */
    cover: z.boolean().optional(),
  })
  .refine((d) => d.caption !== undefined || d.position !== undefined || d.cover !== undefined, "No hay nada para cambiar.");

async function editable(id: string) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return { error: guard ?? unauthorized() };
  if (!UUID.test(id)) return { error: notFound() };
  const photo = await prisma.kosherPhoto.findUnique({ where: { id }, select: { id: true, placeId: true } });
  if (!photo) return { error: notFound() };
  if (!(await canEditPlace(viewer, photo.placeId))) return { error: forbidden("Solo quien administra la ficha o moderación puede cambiar sus fotos.") };
  return { photo };
}

async function result(placeId: string) {
  const place = await prisma.kosherPlace.findUnique({ where: { id: placeId }, select: { coverPhotoId: true } });
  return NextResponse.json({ success: true, photos: await listPhotos(prisma, placeId), coverPhotoId: place?.coverPhotoId ?? null });
}

/** Epígrafe, orden y portada. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const access = await editable(params.id);
  if ("error" in access) return access.error;
  const { photo } = access;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos.");
  const { caption, position, cover } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (caption !== undefined) await tx.kosherPhoto.update({ where: { id: photo.id }, data: { caption: caption || null } });
    if (position !== undefined) {
      const ids = (await listPhotos(tx, photo.placeId)).map((p) => p.id).filter((id) => id !== photo.id);
      ids.splice(Math.min(position, ids.length), 0, photo.id);
      await renumber(tx, photo.placeId, ids);
    }
    if (cover === true) await tx.kosherPlace.update({ where: { id: photo.placeId }, data: { coverPhotoId: photo.id } });
    if (cover === false) await tx.kosherPlace.updateMany({ where: { id: photo.placeId, coverPhotoId: photo.id }, data: { coverPhotoId: null } });
  });
  return result(photo.placeId);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const access = await editable(params.id);
  if ("error" in access) return access.error;
  const { photo } = access;
  await prisma.$transaction(async (tx) => {
    await tx.kosherPhoto.delete({ where: { id: photo.id } });
    await tx.kosherPlace.updateMany({ where: { id: photo.placeId, coverPhotoId: photo.id }, data: { coverPhotoId: null } });
    await renumber(tx, photo.placeId);
  });
  return result(photo.placeId);
}
// creado por pato dev y askforvini
