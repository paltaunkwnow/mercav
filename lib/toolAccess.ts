import { prisma } from "@/lib/prisma";
import { TOOL_REQUIREMENTS, toolPlanLabel } from "./toolPlanCatalog";
import { effectivePlan } from "./billing/plans";

export async function checkToolAccess(userId: string, toolName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, message: "Usuario no encontrado" };

  const allowedPlans = TOOL_REQUIREMENTS[toolName] || ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"];
  // Respetar el vencimiento del plan
  const plan = effectivePlan(user.plan, user.planExpiresAt);
  if (!allowedPlans.includes(plan)) {
    return { allowed: false, message: `Tu plan actual no permite usar ${toolName}` };
  }

  return { allowed: true, plan };
}
// creado por pato dev y askforvini
