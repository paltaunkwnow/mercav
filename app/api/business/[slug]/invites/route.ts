import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { INVITE_DAYS, newInviteToken } from "@/lib/business/invites";
import { audit } from "@/lib/business/audit";

const InviteSchema = z.object({
  role: z.enum(["HR_ADMIN", "MANAGER", "EMPLOYEE", "ACCOUNTANT"]),
  employeeId: z.string().min(1).optional().nullable(),
  email: z.string().trim().email().max(120).optional().nullable().or(z.literal("")),
});

/** Crea una invitación. El token se devuelve una sola vez; en la base queda solo su hash. */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "invites.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const parsed = InviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
  const { role, employeeId, email } = parsed.data;
  // Solo el dueño invita a RR.HH. o contadores.
  if (role !== "EMPLOYEE" && role !== "MANAGER" && ctx.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Solo el dueño puede invitar a RR.HH. o a un contador" }, { status: 403 });
  }
  if (employeeId) {
    const employee = await prisma.businessEmployee.findFirst({ where: { id: employeeId, workspaceId: ctx.workspace.id }, select: { userId: true } });
    if (!employee) return NextResponse.json({ success: false, error: "Trabajador no encontrado" }, { status: 404 });
    if (employee.userId) return NextResponse.json({ success: false, error: "Ese trabajador ya está vinculado a una cuenta" }, { status: 400 });
  }
  const { token, tokenHash } = newInviteToken();
  const invite = await prisma.businessInvite.create({
    data: {
      workspaceId: ctx.workspace.id,
      role,
      employeeId: employeeId || null,
      email: email || null,
      tokenHash,
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
      createdById: ctx.userId,
    },
  });
  await audit(ctx.workspace.id, ctx.userId, "invite.create", "BusinessInvite", invite.id, { role, employeeId: employeeId || null });
  return NextResponse.json({ success: true, data: { id: invite.id, path: `/business/unirse/${token}`, expiresAt: invite.expiresAt } });
}
// creado por pato dev y askforvini
