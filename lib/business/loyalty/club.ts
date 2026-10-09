import { prisma } from "@/lib/prisma";
import { newClubCode } from "./codes";

/**
 * MercavClub: el código de la cuenta para que cualquier negocio la encuentre y le registre la tarjeta. Se crea la
 * primera vez que hace falta y no cambia.
 */
export async function ensureClubCode(userId: string) {
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { clubCode: true } });
  if (current?.clubCode) return current.clubCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // updateMany con clubCode null: si dos pestañas lo crean a la vez, gana una y la otra lee el resultado.
      await prisma.user.updateMany({ where: { id: userId, clubCode: null }, data: { clubCode: newClubCode() } });
      const fresh = await prisma.user.findUnique({ where: { id: userId }, select: { clubCode: true } });
      if (fresh?.clubCode) return fresh.clubCode;
    } catch {
      // Choque de código (casi imposible con 40 bits): otro intento.
    }
  }
  return null;
}

export function findUserByClubCode(code: string) {
  return prisma.user.findUnique({ where: { clubCode: code }, select: { id: true, name: true } });
}
// creado por pato dev y askforvini
