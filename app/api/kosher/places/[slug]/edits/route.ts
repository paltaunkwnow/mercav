import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { EDITABLE_FIELDS } from "@/lib/kosher/edits";
import { getKosherViewer, kosherError, publicAuthorName, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({
  field: z.enum(Object.keys(EDITABLE_FIELDS) as [keyof typeof EDITABLE_FIELDS, ...(keyof typeof EDITABLE_FIELDS)[]]),
  newValue: z.string().trim().min(1).max(600),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-edit", capacity: 6, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Revisá el cambio propuesto.");
  const { field, newValue, note } = parsed.data;
  const spec = EDITABLE_FIELDS[field];
  if (spec.options && !spec.options.includes(newValue)) return kosherError(400, "Valor no válido para ese campo.");

  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug } });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");

  await prisma.kosherEditSuggestion.create({
    data: {
      placeId: place.id,
      authorId: viewer.id,
      authorName: publicAuthorName(viewer.name),
      field,
      oldValue: place[field] == null ? null : String(place[field]),
      newValue,
      note: note || null,
    },
  });
  return NextResponse.json({ success: true }, { status: 201 });
}
