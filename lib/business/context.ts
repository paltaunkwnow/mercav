import { notFound, redirect } from "next/navigation";
import type { BusinessEmployee, BusinessMember, BusinessWorkspace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/calendar/server";
import { can, type BusinessPermission, type BusinessRoleKey } from "./permissions";

export type BusinessContext = {
  userId: string;
  workspace: BusinessWorkspace;
  member: BusinessMember;
  role: BusinessRoleKey;
  /** Legajo de la persona en esta empresa, si tiene. */
  employee: BusinessEmployee | null;
  can: (permission: BusinessPermission) => boolean;
};

export type ContextResult = { ok: true; ctx: BusinessContext } | { ok: false; status: 401 | 404 };

/**
 * Resuelve la empresa por slug y la membresía de la sesión. Toda ruta de Business pasa por acá:
 * si la persona no es miembro, la empresa "no existe" (404) para no revelar slugs ajenos.
 */
export async function resolveBusiness(slug: string): Promise<ContextResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, status: 401 };
  const workspace = await prisma.businessWorkspace.findUnique({ where: { slug } });
  if (!workspace) return { ok: false, status: 404 };
  const member = await prisma.businessMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId } } });
  if (!member) return { ok: false, status: 404 };
  const employee = await prisma.businessEmployee.findFirst({ where: { workspaceId: workspace.id, userId } });
  const role = member.role as BusinessRoleKey;
  return { ok: true, ctx: { userId, workspace, member, role, employee, can: (p) => can(role, p) } };
}

/** Para páginas: redirige al login o da 404. */
export async function requireBusiness(slug: string, permission?: BusinessPermission): Promise<BusinessContext> {
  const result = await resolveBusiness(slug);
  if (!result.ok) {
    if (result.status === 401) redirect(`/login?callbackUrl=/business/${encodeURIComponent(slug)}`);
    notFound();
  }
  if (permission && !result.ctx.can(permission)) notFound();
  return result.ctx;
}

/** Para rutas de API. */
export async function apiBusiness(slug: string, permission?: BusinessPermission): Promise<{ ctx: BusinessContext } | { error: Response }> {
  const result = await resolveBusiness(slug);
  if (!result.ok) {
    return { error: Response.json({ success: false, error: result.status === 401 ? "No autorizado" : "No encontrado" }, { status: result.status }) };
  }
  if (permission && !result.ctx.can(permission)) {
    return { error: Response.json({ success: false, error: "No tenés permiso para esto" }, { status: 403 }) };
  }
  return { ctx: result.ctx };
}
// creado por pato dev y askforvini
