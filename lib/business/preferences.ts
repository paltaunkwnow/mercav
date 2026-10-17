import { prisma } from "@/lib/prisma";

/** La preferencia nunca sustituye la comprobación de membresía. */
export async function getAccountBusinessPreferences(userId: string) {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { lastBusinessWorkspaceId: true } });
  return { lastWorkspaceId: row?.lastBusinessWorkspaceId ?? null };
}

export async function saveLastBusinessWorkspace(userId: string, workspaceId: string) {
  const member = await prisma.businessMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, select: { workspaceId: true } });
  if (!member) return false;
  await prisma.user.update({ where: { id: userId }, data: { lastBusinessWorkspaceId: workspaceId } });
  return true;
}
