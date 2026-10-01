import { prisma } from "./prisma";
import { effectivePlan } from "./billing/plans";

function getMonthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function checkPlanLimit(userId: string, action: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, message: 'Usuario no encontrado' };
  const plan = effectivePlan(user.plan, user.planExpiresAt);

  if (plan === 'FREE') {
    if (action === 'apply_job') {
      // count applications this month
      const { start, end } = getMonthBounds();
      const applications = await prisma.application.count({ where: { applicantId: userId, appliedAt: { gte: start, lte: end } } });
      if (applications >= 10) return { allowed: false, message: 'Alcanzaste el límite de postulaciones de tu plan (10/mes)' };
      return { allowed: true };
    }
    if (action === 'create_space') {
      const count = await prisma.space.count({ where: { ownerId: userId } });
      if (count >= 1) return { allowed: false, message: 'Alcanzaste el límite de espacios publicados para tu plan' };
      return { allowed: true };
    }
    if (action === 'create_service') {
      const count = await prisma.service.count({ where: { providerId: userId } });
      if (count >= 1) return { allowed: false, message: 'Alcanzaste el límite de servicios publicados para tu plan' };
      return { allowed: true };
    }
    if (action === 'create_job') {
      const { start, end } = getMonthBounds();
      const jobs = await prisma.jobPost.count({ where: { companyId: userId, createdAt: { gte: start, lte: end } } });
      if (jobs >= 1) return { allowed: false, message: 'Alcanzaste el límite de vacantes por mes para tu plan' };
      return { allowed: true };
    }
    if (action === 'create_conversation') {
      const active = await prisma.conversation.count({ where: { messages: { some: { senderId: userId } } } });
      if (active >= 5) return { allowed: false, message: 'Has alcanzado el límite de conversaciones activas para tu plan' };
      return { allowed: true };
    }
  }

  // PROFESSIONAL and above have fewer limits (can adjust per action)
  return { allowed: true };
}
// creado por pato dev y askforvini
