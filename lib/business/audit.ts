import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Registra un cambio sensible. Nunca guarda CI ni cuentas bancarias, solo qué campos cambiaron. */
export async function audit(
  workspaceId: string,
  actorId: string,
  action: string,
  entity: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
) {
  try {
    await prisma.businessAuditLog.create({ data: { workspaceId, actorId, action, entity, entityId: entityId ?? null, metadata } });
  } catch (error) {
    console.error("[business] no se pudo registrar auditoría", action, error);
  }
}
// creado por pato dev y askforvini
