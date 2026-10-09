import { prisma } from "@/lib/prisma";
import { toolAllowedForPlan } from "./toolPlanCatalog";
import { effectivePlan } from "./billing/plans";

export async function checkToolAccess(userId: string, toolName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, message: "Usuario no encontrado" };

  // Respetar el vencimiento del plan
  const plan = effectivePlan(user.plan, user.planExpiresAt);
  if (!toolAllowedForPlan(toolName, plan)) {
    return { allowed: false, message: "Esta herramienta viene con Mercav Pro. Mirá los planes en /precios." };
  }

  return { allowed: true, plan };
}
// creado por pato dev y askforvini
