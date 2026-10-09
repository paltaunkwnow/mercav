import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { syncRun } from "@/lib/business/payroll-service";
import { audit } from "@/lib/business/audit";

const ActionSchema = z.object({ action: z.enum(["close", "reopen", "sync"]) });

async function findRun(workspaceId: string, runId: string) {
  return prisma.businessPayrollRun.findFirst({ where: { id: runId, workspaceId } });
}

export async function PATCH(req: Request, { params }: { params: { slug: string; runId: string } }) {
  const parsed = ActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Acción inválida" }, { status: 400 });
  const { action } = parsed.data;
  const auth = await apiBusiness(params.slug, action === "reopen" ? "payroll.reopen" : action === "close" ? "payroll.close" : "payroll.edit");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const run = await findRun(ctx.workspace.id, params.runId);
  if (!run) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });

  if (action === "sync") {
    if (run.status !== "DRAFT") return NextResponse.json({ success: false, error: "La planilla está cerrada" }, { status: 400 });
    await syncRun(ctx.workspace, run);
    await audit(ctx.workspace.id, ctx.userId, "payroll.sync", "BusinessPayrollRun", run.id);
  } else if (action === "close") {
    if (run.status !== "DRAFT") return NextResponse.json({ success: false, error: "Ya está cerrada" }, { status: 400 });
    await syncRun(ctx.workspace, run);
    const closed = await prisma.businessPayrollRun.updateMany({ where: { id: run.id, status: "DRAFT" }, data: { status: "CLOSED", closedAt: new Date(), closedById: ctx.userId } });
    if (closed.count !== 1) return NextResponse.json({ success: false, error: "Ya está cerrada" }, { status: 400 });
    await audit(ctx.workspace.id, ctx.userId, "payroll.close", "BusinessPayrollRun", run.id);
  } else {
    if (run.status !== "CLOSED") return NextResponse.json({ success: false, error: "No está cerrada" }, { status: 400 });
    const reopened = await prisma.businessPayrollRun.updateMany({ where: { id: run.id, status: "CLOSED" }, data: { status: "DRAFT", closedAt: null, closedById: null } });
    if (reopened.count !== 1) return NextResponse.json({ success: false, error: "No está cerrada" }, { status: 400 });
    await audit(ctx.workspace.id, ctx.userId, "payroll.reopen", "BusinessPayrollRun", run.id);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { slug: string; runId: string } }) {
  const auth = await apiBusiness(params.slug, "payroll.edit");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const run = await findRun(ctx.workspace.id, params.runId);
  if (!run) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
  if (run.status !== "DRAFT") return NextResponse.json({ success: false, error: "Solo se borran planillas en borrador" }, { status: 400 });
  const removed = await prisma.businessPayrollRun.deleteMany({ where: { id: run.id, status: "DRAFT" } });
  if (removed.count !== 1) return NextResponse.json({ success: false, error: "Solo se borran planillas en borrador" }, { status: 400 });
  await audit(ctx.workspace.id, ctx.userId, "payroll.delete", "BusinessPayrollRun", run.id, { year: run.year, month: run.month });
  return NextResponse.json({ success: true });
}
// creado por pato dev y askforvini
