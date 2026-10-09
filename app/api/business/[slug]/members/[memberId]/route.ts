import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";

const RoleSchema = z.object({ role: z.enum(["HR_ADMIN", "MANAGER", "EMPLOYEE", "ACCOUNTANT"]) });

async function target(workspaceId: string, memberId: string) {
  return prisma.businessMember.findFirst({ where: { id: memberId, workspaceId } });
}

export async function PATCH(req: Request, { params }: { params: { slug: string; memberId: string } }) {
  const auth = await apiBusiness(params.slug, "members.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const member = await target(ctx.workspace.id, params.memberId);
  if (!member) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
  if (member.role === "OWNER") return NextResponse.json({ success: false, error: "El rol del dueño no se cambia" }, { status: 400 });
  const parsed = RoleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Rol inválido" }, { status: 400 });
  // Si deja de poder invitar, sus invitaciones pendientes dejan de valer.
  const revokeInvites = parsed.data.role !== "HR_ADMIN";
  const invitesRevoked = await prisma.$transaction(async (tx) => {
    await tx.businessMember.update({ where: { id: member.id }, data: { role: parsed.data.role } });
    if (!revokeInvites) return 0;
    const { count } = await tx.businessInvite.deleteMany({ where: { workspaceId: ctx.workspace.id, createdById: member.userId, usedAt: null } });
    return count;
  });
  await audit(ctx.workspace.id, ctx.userId, "member.role", "BusinessMember", member.id, { from: member.role, to: parsed.data.role, invitesRevoked });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { slug: string; memberId: string } }) {
  const auth = await apiBusiness(params.slug, "members.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const member = await target(ctx.workspace.id, params.memberId);
  if (!member) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
  if (member.role === "OWNER") return NextResponse.json({ success: false, error: "No podés quitar al dueño" }, { status: 400 });
  const [, , revoked] = await prisma.$transaction([
    prisma.businessEmployee.updateMany({ where: { workspaceId: ctx.workspace.id, userId: member.userId }, data: { userId: null } }),
    prisma.businessMember.delete({ where: { id: member.id } }),
    // Sin esto, alguien quitado podría volver a entrar con un link que generó antes.
    prisma.businessInvite.deleteMany({ where: { workspaceId: ctx.workspace.id, createdById: member.userId, usedAt: null } }),
  ]);
  await audit(ctx.workspace.id, ctx.userId, "member.remove", "BusinessMember", member.id, { role: member.role, invitesRevoked: revoked.count });
  return NextResponse.json({ success: true });
}
// creado por pato dev y askforvini
