import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  legalName: z.string().trim().max(120).nullable(),
  nit: z.string().trim().max(20).nullable(),
  region: z.string().trim().max(60).nullable(),
  city: z.string().trim().max(60).nullable(),
  productive: z.boolean(),
});

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "workspace.edit");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const parsed = UpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  await prisma.businessWorkspace.update({
    where: { id: ctx.workspace.id },
    data: { name: d.name, legalName: d.legalName || null, nit: d.nit || null, region: d.region || null, city: d.city || null, productive: d.productive },
  });
  await audit(ctx.workspace.id, ctx.userId, "workspace.update", "BusinessWorkspace", ctx.workspace.id, {
    productiveChanged: d.productive !== ctx.workspace.productive,
  });
  return NextResponse.json({ success: true });
}
// creado por pato dev y askforvini
