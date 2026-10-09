import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";
import { prisma } from "@/lib/prisma";

/**
 * Trae la caja personal de antes (Mercav POS) a la empresa: productos, ventas, cajas y personal pasan a ser de la
 * empresa. Solo el dueño, solo su propia caja y solo si la empresa todavía no tiene una.
 */
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const res = await apiBusiness(params.slug, "pos.configure");
  if ("error" in res) return res.error;
  const { ctx } = res;
  if (ctx.role !== "OWNER") return Response.json({ success: false, error: "Solo el dueño puede traer su caja" }, { status: 403 });

  try {
    const moved = await prisma.$transaction(async (tx) => {
      if (await tx.pOSConfig.findUnique({ where: { workspaceId: ctx.workspace.id }, select: { id: true } })) return "taken" as const;
      const legacy = await tx.pOSConfig.findFirst({ where: { userId: ctx.userId, workspaceId: null }, select: { id: true } });
      if (!legacy) return "none" as const;
      // Sin userId: la caja ya no depende de la cuenta personal (borrar la cuenta no borra la caja de la empresa).
      await tx.pOSConfig.update({ where: { id: legacy.id }, data: { workspaceId: ctx.workspace.id, userId: null } });
      return legacy.id;
    });
    if (moved === "taken") return Response.json({ success: false, error: "Esta empresa ya tiene caja" }, { status: 409 });
    if (moved === "none") return Response.json({ success: false, error: "No encontramos una caja anterior en tu cuenta" }, { status: 404 });
    await audit(ctx.workspace.id, ctx.userId, "pos.adopt", "POSConfig", moved);
    return Response.json({ success: true });
  } catch (error) {
    console.error("BUSINESS_POS_ADOPT_ERROR", error);
    return Response.json({ success: false, error: "No pudimos traer la caja. Probá de nuevo." }, { status: 500 });
  }
}
// creado por pato dev y askforvini
