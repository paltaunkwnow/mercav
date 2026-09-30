import { prisma } from "./prisma";

export async function isAdminUser(userId?: string | null) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });

  return !!user?.roles?.some((role) => role.role === "ADMIN");
}
// creado por pato dev y askforvini
