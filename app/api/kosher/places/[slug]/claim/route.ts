import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { isFoodPlace } from "@/lib/kosher/labels";
import { forbidden, getKosherViewer, kosherError, managesPlace, unauthorized, writeGuard } from "@/lib/kosher/server";

const base = {
  contactName: z.string().trim().min(2).max(80),
  contactRole: z.string().trim().min(2).max(80),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  evidence: z.string().trim().min(10, "Contanos cómo podemos verificarte.").max(800),
};

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ownership"), ...base }),
  z.object({
    kind: z.literal("certificate"),
    ...base,
    agencyName: z.string().trim().min(2).max(80),
    certificateUrl: z.string().trim().url().max(300),
    certExpiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-claim", capacity: 3, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, parsed.error.issues[0]?.message ?? "Revisá los datos.");
  const d = parsed.data;
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { id: true, type: true, published: true } });
  if (!place?.published) return kosherError(404, "Lugar no encontrado");

  const manager = await managesPlace(viewer.id, place.id);
  if (d.kind === "ownership" && manager) return kosherError(409, "Ya administrás esta ficha.");
  if (d.kind === "certificate") {
    if (!manager) return forbidden("Primero pedí administrar la ficha.");
    if (!isFoodPlace(place.type)) return kosherError(400, "Los certificados de kashrut aplican a lugares de comida.");
    if (new Date(`${d.certExpiresAt}T23:59:59Z`) < new Date()) return kosherError(400, "Ese certificado ya venció.");
  }
  const pending = await prisma.kosherClaim.findFirst({ where: { placeId: place.id, userId: viewer.id, kind: d.kind, state: "pending" }, select: { id: true } });
  if (pending) return kosherError(409, "Ya tenés una solicitud en revisión para esta ficha.");

  await prisma.kosherClaim.create({
    data: {
      kind: d.kind,
      placeId: place.id,
      userId: viewer.id,
      contactName: d.contactName,
      contactRole: d.contactRole,
      contactPhone: d.contactPhone || null,
      evidence: d.evidence,
      ...(d.kind === "certificate"
        ? { agencyName: d.agencyName, certificateUrl: d.certificateUrl, certExpiresAt: new Date(`${d.certExpiresAt}T23:59:59Z`) }
        : {}),
    },
  });
  return NextResponse.json({ success: true }, { status: 201 });
}
