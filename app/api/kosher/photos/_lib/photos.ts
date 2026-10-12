import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { managesPlace, type KosherViewer } from "@/lib/kosher/server";
import { photoUrl, type PhotoDTO } from "@/components/kosher/manage/details";

type Db = Prisma.TransactionClient | typeof prisma;

/** Quien administra la ficha, los moderadores locales, las agencias y los admins de Mercav. */
export async function canEditPlace(viewer: KosherViewer, placeId: string) {
  return viewer.isModerator || (await managesPlace(viewer.id, placeId));
}

const ORDER = [{ position: "asc" }, { createdAt: "asc" }] satisfies Prisma.KosherPhotoOrderByWithRelationInput[];

/** Fotos del lugar en orden, sin los bytes. */
export async function listPhotos(db: Db, placeId: string): Promise<PhotoDTO[]> {
  const rows = await db.kosherPhoto.findMany({
    where: { placeId },
    orderBy: ORDER,
    select: { id: true, width: true, height: true, caption: true, position: true },
  });
  return rows.map((p) => ({ ...p, url: photoUrl(p.id) }));
}

/** Deja las posiciones en 0, 1, 2… con `order` como orden final (o el actual si no se pasa). */
export async function renumber(db: Db, placeId: string, order?: string[]) {
  const rows = await db.kosherPhoto.findMany({ where: { placeId }, orderBy: ORDER, select: { id: true, position: true } });
  const ids = order ?? rows.map((r) => r.id);
  for (const [index, id] of ids.entries()) {
    if (rows.find((r) => r.id === id)?.position !== index) await db.kosherPhoto.update({ where: { id }, data: { position: index } });
  }
}
// creado por pato dev y askforvini
