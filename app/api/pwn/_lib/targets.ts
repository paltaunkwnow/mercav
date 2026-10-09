import type { Prisma, PwnTargetVerificationStatus } from "@prisma/client";
import { confirmationMethodFor } from "@/lib/pwn/monitor-authorization";

/**
 * Un objetivo cuenta como propio solo si alguien lo probó: la misma cuenta (correo confirmado,
 * enlace al buzón o DNS TXT) o un administrador. verifiedByUserId queda en null en las filas
 * que el código viejo marcó como verificadas sin prueba, así que no alcanzan.
 */
export const PROVEN_TARGET_WHERE = {
  verificationStatus: "VERIFIED",
  verifiedAt: { not: null },
  verifiedByUserId: { not: null },
} satisfies Prisma.PwnMonitoringTargetWhereInput;

export function isProvenTarget(row: {
  verificationStatus: PwnTargetVerificationStatus | string;
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
}): boolean {
  return row.verificationStatus === "VERIFIED" && Boolean(row.verifiedAt) && Boolean(row.verifiedByUserId);
}

export const targetSelect = {
  id: true,
  organizationId: true,
  targetType: true,
  targetHash: true,
  targetDisplay: true,
  targetLookup: true,
  active: true,
  verificationStatus: true,
  verificationTokenHash: true,
  authorizationRequestedAt: true,
  authorizationMessage: true,
  verifiedAt: true,
  verifiedByUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PwnMonitoringTargetSelect;

export type TargetRow = Prisma.PwnMonitoringTargetGetPayload<{ select: typeof targetSelect }>;

export type TargetContext = { accountEmailHash: string | null; accountConfirmed: boolean; mailerReady: boolean };

/** Lo que ve el dueño. Nunca devuelve el hash del objetivo ni el del token. */
export function presentTarget(row: TargetRow, context: TargetContext) {
  const proven = isProvenTarget(row);
  const isAccountEmail = row.targetType === "EMAIL" && context.accountEmailHash === row.targetHash;
  const method = confirmationMethodFor({
    targetType: row.targetType,
    isAccountEmail,
    accountConfirmed: context.accountConfirmed,
    mailerReady: context.mailerReady,
  });
  // Una fila "VERIFIED" sin prueba se muestra como pendiente hasta que se pruebe de nuevo.
  const verificationStatus = proven ? "VERIFIED" : row.verificationStatus === "VERIFIED" ? "PENDING" : row.verificationStatus;
  return {
    id: row.id,
    organizationId: row.organizationId,
    targetType: row.targetType,
    targetDisplay: row.targetDisplay,
    targetLookup: row.targetLookup,
    active: row.active,
    verificationStatus,
    confirmationMethod: proven ? null : method,
    awaitingConfirmation: !proven && Boolean(row.verificationTokenHash),
    isAccountEmail,
    authorizationRequestedAt: row.authorizationRequestedAt,
    authorizationMessage: row.authorizationMessage,
    verifiedAt: proven ? row.verifiedAt : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
// creado por pato dev y askforvini
