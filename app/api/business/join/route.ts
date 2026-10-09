import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/calendar/server";
import { hashInviteToken } from "@/lib/business/invites";
import { audit } from "@/lib/business/audit";

const JoinSchema = z.object({ token: z.string().min(20).max(200) });

/** Acepta una invitación: un solo uso, canjeada de forma atómica. */
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  const parsed = JoinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invitación inválida" }, { status: 400 });
  const tokenHash = hashInviteToken(parsed.data.token);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.businessInvite.findUnique({ where: { tokenHash }, include: { workspace: { select: { id: true, slug: true } } } });
      if (!invite || invite.usedAt || invite.expiresAt < new Date()) throw new Error("INVALID");
      // La invitación solo vale si quien la generó todavía puede invitar.
      const creator = await tx.businessMember.findUnique({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: invite.createdById } } });
      if (!creator || (creator.role !== "OWNER" && creator.role !== "HR_ADMIN")) throw new Error("INVALID");
      const existing = await tx.businessMember.findUnique({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } } });
      // Si ya es miembro, no gastamos la invitación ni cambiamos su rol en silencio.
      if (existing && !invite.employeeId) throw new Error("ALREADY_MEMBER");
      const claimed = await tx.businessInvite.updateMany({ where: { id: invite.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) throw new Error("INVALID");

      if (!existing) await tx.businessMember.create({ data: { workspaceId: invite.workspaceId, userId, role: invite.role } });

      if (invite.employeeId) {
        const alreadyLinked = await tx.businessEmployee.findFirst({ where: { workspaceId: invite.workspaceId, userId }, select: { id: true } });
        if (!alreadyLinked) {
          await tx.businessEmployee.updateMany({ where: { id: invite.employeeId, workspaceId: invite.workspaceId, userId: null }, data: { userId } });
        }
      }
      return { invite, slug: invite.workspace.slug, existed: !!existing };
    });
    await audit(result.invite.workspaceId, userId, "invite.accept", "BusinessInvite", result.invite.id, { role: result.invite.role, existed: result.existed });
    return NextResponse.json({ success: true, data: { slug: result.slug } });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID") {
      return NextResponse.json({ success: false, error: "La invitación venció o ya se usó. Pedí una nueva." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "ALREADY_MEMBER") {
      return NextResponse.json({ success: false, error: "Ya sos parte de esta empresa. Si necesitás otro rol, pedíselo al dueño." }, { status: 400 });
    }
    throw error;
  }
}
// creado por pato dev y askforvini
