import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/calendar/server";
import { uniqueSlug } from "@/lib/business/slug";
import { audit } from "@/lib/business/audit";
import { LATAM_CODES, latamCountry } from "@/lib/geo/latam";

const CreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  legalName: z.string().trim().max(120).optional().nullable(),
  nit: z.string().trim().max(20).optional().nullable(),
  country: z.enum(LATAM_CODES as [string, ...string[]]),
  region: z.string().trim().max(60).optional().nullable(),
  city: z.string().trim().max(60).optional().nullable(),
  productive: z.boolean().default(false),
});

/** Crea una empresa y deja a quien la crea como dueño. */
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const owned = await prisma.businessWorkspace.count({ where: { ownerId: userId } });
  if (owned >= 5) return NextResponse.json({ success: false, error: "Ya tenés 5 empresas. Escribinos si necesitás más." }, { status: 400 });

  const data = parsed.data;
  const slug = await uniqueSlug(data.name, async (s) => !!(await prisma.businessWorkspace.findUnique({ where: { slug: s }, select: { id: true } })));
  const workspace = await prisma.businessWorkspace.create({
    data: {
      slug,
      name: data.name,
      legalName: data.legalName || null,
      nit: data.nit || null,
      country: data.country,
      currency: latamCountry(data.country).currency,
      region: data.region || null,
      city: data.city || null,
      productive: data.productive,
      ownerId: userId,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  await audit(workspace.id, userId, "workspace.create", "BusinessWorkspace", workspace.id, { country: data.country });
  return NextResponse.json({ success: true, data: { slug: workspace.slug } });
}
// creado por pato dev y askforvini
