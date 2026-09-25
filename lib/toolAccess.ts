import { prisma } from "@/lib/prisma";
import { TOOL_REQUIREMENTS, toolPlanLabel } from "./toolPlanCatalog";

export async function checkToolAccess(userId: string, toolName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, message: "Usuario no encontrado" };

  const allowedPlans = TOOL_REQUIREMENTS[toolName] || ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"];
  if (!allowedPlans.includes(user.plan)) {
    return { allowed: false, message: `Tu plan actual no permite usar ${toolName}` };
  }

  return { allowed: true, plan: user.plan };
}
// creado por Patodev y Invertilo
