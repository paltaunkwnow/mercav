import { prisma } from "./prisma";

export async function getRecommendationsForUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { skills: true, experiences: true }
        }
      }
    });
    
    if (!user || !user.profile || user.profile.skills.length === 0) return [];
    
    const skillNames = user.profile.skills.map(s => s.name);
    
    const jobs = await prisma.jobPost.findMany({
      where: {
        isActive: true,
        OR: skillNames.map(skill => ({
          description: { contains: skill, mode: "insensitive" }
        }))
      },
      take: 5
    });
    
    return jobs.map(job => ({ ...job, recommendedReason: "Coincide con tus habilidades" }));
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}
// creado por Patodev y Invertilo
