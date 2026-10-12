import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { forbidden, getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";
import { CAPTION_MAX, MAX_PHOTOS, PHOTO_MAX_BYTES, PHOTO_MAX_SIDE, PHOTO_MIN_SIDE } from "@/components/kosher/manage/details";
import { sniffImage } from "@/app/api/kosher/photos/_lib/image";
import { canEditPlace, listPhotos } from "@/app/api/kosher/photos/_lib/photos";

export const dynamic = "force-dynamic";

/** Fotos de un lugar publicado, en orden. Los bytes se piden a /api/kosher/photos/[id]. */
export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true, published: true, coverPhotoId: true } });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");
  return NextResponse.json(
    { success: true, photos: await listPhotos(prisma, place.id), coverPhotoId: place.coverPhotoId },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

const tooHeavy = () => kosherError(413, "La foto pesa más de 700 KB después de achicarla. Probá con otra.");

/** Sube una foto ya achicada en el navegador (multipart: file, caption opcional). */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-photo", capacity: 10, refillPerMinute: 4, userId: viewer.id });
  if (limited) return limited;

  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true, published: true, coverPhotoId: true } });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");
  if (!(await canEditPlace(viewer, place.id))) return forbidden("Solo quien administra la ficha o moderación puede subir fotos.");

  // Corte temprano por el largo declarado: el multipart suma unos pocos KB de encabezados.
  if (Number(request.headers.get("content-length") ?? 0) > PHOTO_MAX_BYTES + 32 * 1024) return tooHeavy();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !file || typeof file === "string") return kosherError(400, "Falta la foto.");
  if (file.size > PHOTO_MAX_BYTES) return tooHeavy();

  const caption = String(form.get("caption") ?? "").trim();
  if (caption.length > CAPTION_MAX) return kosherError(400, `El epígrafe tiene hasta ${CAPTION_MAX} caracteres.`);

  const data = Buffer.from(await file.arrayBuffer());
  const info = sniffImage(data);
  if (!info) return kosherError(415, "Solo se aceptan fotos JPG, PNG o WebP.");
  if (Math.max(info.width, info.height) > PHOTO_MAX_SIDE) return kosherError(400, `La foto tiene que medir hasta ${PHOTO_MAX_SIDE} px de lado.`);
  if (Math.min(info.width, info.height) < PHOTO_MIN_SIDE) return kosherError(400, `La foto es muy chica: tiene que medir al menos ${PHOTO_MIN_SIDE} px de lado.`);

  const full = () => kosherError(409, `La ficha ya tiene ${MAX_PHOTOS} fotos. Borrá una para sumar otra.`);
  if ((await prisma.kosherPhoto.count({ where: { placeId: place.id } })) >= MAX_PHOTOS) return full();

  const last = await prisma.kosherPhoto.aggregate({ where: { placeId: place.id }, _max: { position: true } });
  const photo = await prisma.kosherPhoto.create({
    data: {
      placeId: place.id,
      data,
      mime: info.mime,
      width: info.width,
      height: info.height,
      bytes: data.length,
      caption: caption || null,
      position: (last._max.position ?? -1) + 1,
      uploadedById: viewer.id,
    },
    select: { id: true },
  });
  // Dos subidas a la vez pueden pasar el conteo: la que sobra se borra.
  if ((await prisma.kosherPhoto.count({ where: { placeId: place.id } })) > MAX_PHOTOS) {
    await prisma.kosherPhoto.delete({ where: { id: photo.id } });
    return full();
  }
  // La primera foto queda de portada.
  let coverPhotoId = place.coverPhotoId;
  if (!coverPhotoId) {
    const set = await prisma.kosherPlace.updateMany({ where: { id: place.id, coverPhotoId: null }, data: { coverPhotoId: photo.id } });
    coverPhotoId = set.count ? photo.id : (await prisma.kosherPlace.findUnique({ where: { id: place.id }, select: { coverPhotoId: true } }))?.coverPhotoId ?? null;
  }

  return NextResponse.json({ success: true, id: photo.id, photos: await listPhotos(prisma, place.id), coverPhotoId }, { status: 201 });
}
// creado por pato dev y askforvini
