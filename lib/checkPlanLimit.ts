import { prisma } from "./prisma";
import { effectivePlan, isProPlan } from "./billing/plans";

function getMonthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Límites del plan Gratis. Mercav Pro (cualquier plan pago vigente) no tiene límites.
 * Pwn, Kosher y Calendario no pasan por acá: son gratis sin límites de plan.
 */
export const FREE_LIMITS = {
  spaces: 1,
  services: 1,
  jobsPerMonth: 1,
  applicationsPerMonth: 10,
  conversations: 5,
  /** Business: empresas de las que el usuario es dueño. */
  workspaces: 1,
  /** Business: trabajadores activos por empresa. */
  employeesPerWorkspace: 5,
  /** Business: programas de fidelización no archivados por empresa. */
  loyaltyProgramsPerWorkspace: 1,
} as const;

export type PlanAction =
  | "apply_job"
  | "create_space"
  | "create_service"
  | "create_job"
  | "create_conversation"
  | "create_workspace"
  | "add_employee"
  | "add_loyalty_program";

export type PlanLimitResult = { allowed: true } | { allowed: false; message: string };

const PRO_HINT = "Mercav Pro quita el límite: mirá los planes en /precios.";
const OWNER_PRO_HINT = "Si el dueño se pasa a Mercav Pro, no hay límite: mirá los planes en /precios.";

const deny = (message: string): PlanLimitResult => ({ allowed: false, message });

/**
 * Revisa si `userId` puede hacer `action` según su plan vigente.
 * En Business, `userId` tiene que ser el dueño de la empresa (el límite sigue su plan, no el de quien
 * hace la acción) y `workspaceId` la empresa: usá checkWorkspaceLimit.
 * Solo frena altas nuevas; lo que ya existe por encima del límite no se toca.
 */
export async function checkPlanLimit(userId: string, action: PlanAction, scope?: { workspaceId: string }): Promise<PlanLimitResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } });
  if (!user) return deny("Usuario no encontrado");
  if (isProPlan(effectivePlan(user.plan, user.planExpiresAt))) return { allowed: true };

  if (action === "apply_job") {
    const { start, end } = getMonthBounds();
    const applications = await prisma.application.count({ where: { applicantId: userId, appliedAt: { gte: start, lte: end } } });
    if (applications >= FREE_LIMITS.applicationsPerMonth) return deny(`El plan Gratis permite ${FREE_LIMITS.applicationsPerMonth} postulaciones por mes. ${PRO_HINT}`);
    return { allowed: true };
  }
  if (action === "create_space") {
    const count = await prisma.space.count({ where: { ownerId: userId } });
    if (count >= FREE_LIMITS.spaces) return deny(`El plan Gratis permite ${FREE_LIMITS.spaces} espacio publicado. ${PRO_HINT}`);
    return { allowed: true };
  }
  if (action === "create_service") {
    const count = await prisma.service.count({ where: { providerId: userId } });
    if (count >= FREE_LIMITS.services) return deny(`El plan Gratis permite ${FREE_LIMITS.services} servicio publicado. ${PRO_HINT}`);
    return { allowed: true };
  }
  if (action === "create_job") {
    const { start, end } = getMonthBounds();
    const jobs = await prisma.jobPost.count({ where: { companyId: userId, createdAt: { gte: start, lte: end } } });
    if (jobs >= FREE_LIMITS.jobsPerMonth) return deny(`El plan Gratis permite ${FREE_LIMITS.jobsPerMonth} vacante por mes. ${PRO_HINT}`);
    return { allowed: true };
  }
  if (action === "create_conversation") {
    const active = await prisma.conversation.count({ where: { messages: { some: { senderId: userId } } } });
    if (active >= FREE_LIMITS.conversations) return deny(`El plan Gratis permite ${FREE_LIMITS.conversations} conversaciones activas. ${PRO_HINT}`);
    return { allowed: true };
  }
  if (action === "create_workspace") {
    const owned = await prisma.businessWorkspace.count({ where: { ownerId: userId } });
    if (owned >= FREE_LIMITS.workspaces) return deny(`El plan Gratis permite ${FREE_LIMITS.workspaces} empresa. ${PRO_HINT}`);
    return { allowed: true };
  }
  if (action === "add_employee") {
    if (!scope) throw new Error("add_employee necesita la empresa");
    const active = await prisma.businessEmployee.count({ where: { workspaceId: scope.workspaceId, status: "ACTIVE" } });
    if (active >= FREE_LIMITS.employeesPerWorkspace) {
      return deny(`El plan Gratis permite hasta ${FREE_LIMITS.employeesPerWorkspace} trabajadores activos por empresa. ${OWNER_PRO_HINT}`);
    }
    return { allowed: true };
  }
  if (action === "add_loyalty_program") {
    if (!scope) throw new Error("add_loyalty_program necesita la empresa");
    const programs = await prisma.loyaltyProgram.count({ where: { workspaceId: scope.workspaceId, status: { not: "ARCHIVED" } } });
    if (programs >= FREE_LIMITS.loyaltyProgramsPerWorkspace) {
      return deny(`El plan Gratis permite ${FREE_LIMITS.loyaltyProgramsPerWorkspace} programa de fidelización por empresa. ${OWNER_PRO_HINT}`);
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/** Límite de Business para una empresa: se mide con el plan del dueño, no con el de quien hace la acción. */
export function checkWorkspaceLimit(workspace: { id: string; ownerId: string }, action: "add_employee" | "add_loyalty_program") {
  return checkPlanLimit(workspace.ownerId, action, { workspaceId: workspace.id });
}
// creado por pato dev y askforvini
