import { requireMailAdmin, requireMailSession } from "@/lib/mail/auth";
import { prisma } from "@/lib/prisma";
import { mailJson, mailRoute } from "@/lib/mail/http";
import { MailError } from "@/lib/mail/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return mailRoute(async () => {
    try { await requireMailAdmin(); }
    catch (error) {
      if (!(error instanceof MailError) || ![401, 403].includes(error.status)) throw error;
      const session = await requireMailSession();
      if (session.account.role !== "AUDITOR") throw new MailError(403, "Se requiere acceso de auditoría.");
    }
    return mailJson({ events: await prisma.mailAuditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) });
  });
}
