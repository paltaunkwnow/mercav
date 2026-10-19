import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMailAdmin } from "@/lib/mail/auth";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { assertMailOrigin, MailError } from "@/lib/mail/config";

export const runtime = "nodejs";
export function PATCH(request: Request, { params }: { params: { id: string } }) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const actor = await requireMailAdmin();
    const id = z.string().uuid().parse(params.id);
    const data = z.object({ name: z.string().trim().min(1).max(120).optional(), role: z.enum(["USER", "ADMIN", "AUDITOR"]).optional(), status: z.enum(["ACTIVE", "SUSPENDED"]).optional(), revokeSessions: z.boolean().optional() }).parse(await readMailJson(request, 4096));
    if (id === actor.id && (data.status === "SUSPENDED" || (data.role && data.role !== "ADMIN"))) throw new MailError(409, "Otro administrador debe cambiar tu acceso.");
    if (!await prisma.mailAccount.findUnique({ where: { id } })) throw new MailError(404, "Cuenta no encontrada.");
    const { revokeSessions, ...changes } = data;
    await prisma.$transaction(async (tx) => {
      await tx.mailAccount.update({ where: { id }, data: changes });
      if (revokeSessions || data.status === "SUSPENDED" || data.role) await tx.mailSession.deleteMany({ where: { accountId: id } });
      await tx.mailAuditEvent.create({ data: { action: data.status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : revokeSessions ? "SESSIONS_REVOKED" : "ACCOUNT_UPDATED", actorId: actor.id, targetId: id } });
    });
    return mailJson({ updated: true, note: data.status === "SUSPENDED" ? "Acceso web revocado. Suspendé también la cuenta en Stalwart para bloquear otros clientes y protocolos." : undefined });
  });
}
