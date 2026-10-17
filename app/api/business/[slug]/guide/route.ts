import { NextResponse } from "next/server";
import { apiBusiness } from "@/lib/business/context";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const result = await apiBusiness(params.slug);
  if ("error" in result) return result.error;
  const { ctx } = result;
  const [config, progress] = await Promise.all([
    prisma.pOSConfig.findUnique({ where: { workspaceId: ctx.workspace.id }, select: { products: { where: { isActive: true }, select: { id: true }, take: 1 }, sales: { where: { status: "COMPLETED" }, select: { id: true }, take: 1 } } }),
    prisma.businessGuideProgress.findUnique({ where: { userId_workspaceId: { userId: ctx.userId, workspaceId: ctx.workspace.id } } }),
  ]);
  const action = !config?.products.length ? "catalog" : !config.sales.length ? "sell" : "page";
  return NextResponse.json({ success: true, data: { action, dismissed: Boolean(progress?.dismissedAt), permissions: { inventory: ctx.can("pos.inventory"), sell: ctx.can("pos.sell"), page: ctx.can("publicPage.edit") } } });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const result = await apiBusiness(params.slug);
  if ("error" in result) return result.error;
  const body = await req.json().catch(() => null) as { action?: "dismiss" | "resume" } | null;
  if (!body?.action) return NextResponse.json({ success: false, error: "Acción inválida" }, { status: 400 });
  const data = { dismissedAt: body.action === "dismiss" ? new Date() : null };
  await prisma.businessGuideProgress.upsert({ where: { userId_workspaceId: { userId: result.ctx.userId, workspaceId: result.ctx.workspace.id } }, create: { userId: result.ctx.userId, workspaceId: result.ctx.workspace.id, ...data }, update: data });
  return NextResponse.json({ success: true });
}
