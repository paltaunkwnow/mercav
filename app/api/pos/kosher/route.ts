import { NextResponse } from "next/server";
import type { KosherStockCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError } from "@/lib/pos/server";
import { requireManager } from "@/lib/pos/staff";
import { STOCK } from "@/lib/kosher/labels";
import { getKosherViewer, managesPlace, writeGuard } from "@/lib/kosher/server";

const NOTE_MAX = 300;

/** Products of this POS that would be published, grouped by Kosher stock category (stock > 0 only). */
async function publishableByCategory(posConfigId: string) {
  const products = await prisma.pOSProduct.findMany({
    where: { posConfigId, isActive: true, trackStock: true, kosherCategory: { not: null }, stock: { gt: 0 } },
    select: { name: true, kosherCategory: true },
    orderBy: { name: "asc" },
  });
  const groups = new Map<KosherStockCategory, string[]>();
  for (const p of products) {
    if (!p.kosherCategory) continue;
    groups.set(p.kosherCategory, [...(groups.get(p.kosherCategory) ?? []), p.name]);
  }
  return groups;
}

/** "Disponible en el POS: A, B, C y 4 más." trimmed to the 300-char note limit. */
function noteFor(names: string[]) {
  const prefix = "Disponible según el POS: ";
  let note = prefix;
  for (let i = 0; i < names.length; i++) {
    const rest = names.length - i - 1;
    const piece = (i === 0 ? "" : ", ") + names[i];
    const tail = rest > 0 ? ` y ${rest} más.` : ".";
    if ((note + piece + tail).length > NOTE_MAX) {
      if (i === 0) return `${(note + piece).slice(0, NOTE_MAX - 1)}…`;
      const left = names.length - i;
      return `${note} y ${left} más.`.slice(0, NOTE_MAX);
    }
    note += piece;
  }
  return `${note}.`.slice(0, NOTE_MAX);
}

export async function GET(req: Request) {
  const ctx = await getPosContext(req, "pos.inventory");
  if (!ctx.ok) return ctx.response;

  const [managed, groups, viewer] = await Promise.all([
    prisma.kosherPlaceManager.findMany({
      where: { userId: ctx.userId },
      select: { place: { select: { id: true, name: true, city: true, slug: true } } },
    }),
    publishableByCategory(ctx.config.id),
    getKosherViewer(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      places: managed.map((m) => m.place),
      linkedPlaceId: ctx.config.kosherPlaceId,
      shabbatLocked: viewer?.shabbatLocked ?? false,
      preview: Array.from(groups.entries()).map(([category, names]) => ({ category, label: STOCK[category], count: names.length })),
    },
  });
}

// One publish per minute per POS, in this server's memory.
const lastPublish = new Map<string, number>();

export async function POST(req: Request) {
  const ctx = await getPosContext(req, "pos.inventory");
  if (!ctx.ok) return ctx.response;
  const { config } = ctx;

  const gate = await requireManager(req, config.id);
  if (!gate.ok) return gate.response;

  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? posError("Iniciá sesión", 401);

  if (!config.kosherPlaceId) return posError("Primero vinculá un lugar de Mercav Kosher en la configuración del POS");
  if (!(await managesPlace(viewer.id, config.kosherPlaceId))) return posError("Ya no administrás el lugar vinculado", 403);

  const last = lastPublish.get(config.id) ?? 0;
  if (Date.now() - last < 60_000) return posError("Ya publicaste hace menos de un minuto. Esperá un momento.", 429);

  const groups = await publishableByCategory(config.id);
  if (groups.size === 0) return posError("No hay productos con categoría Kosher y stock disponible para publicar");

  const place = await prisma.kosherPlace.findUnique({ where: { id: config.kosherPlaceId }, select: { id: true, name: true, published: true } });
  if (!place?.published) return posError("El lugar vinculado no está publicado en Mercav Kosher", 404);

  const authorName = (config.shopName?.trim() || place.name).slice(0, 120);
  const created = await prisma.$transaction(
    Array.from(groups.entries()).map(([category, names]) =>
      prisma.kosherStockReport.create({
        data: { placeId: place.id, category, note: noteFor(names), authorId: viewer.id, authorName },
        select: { id: true, category: true },
      }),
    ),
  );
  lastPublish.set(config.id, Date.now());

  return NextResponse.json({
    success: true,
    data: { placeName: place.name, reports: created.map((r) => ({ category: r.category, label: STOCK[r.category] })) },
  });
}
// creado por pato dev y askforvini
