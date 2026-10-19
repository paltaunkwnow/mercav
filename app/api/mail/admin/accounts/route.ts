import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMailAdmin, rateLimitMail } from "@/lib/mail/auth";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { assertMailOrigin, MailError } from "@/lib/mail/config";
import { corporateEmail } from "@/lib/mail/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return mailRoute(async () => {
    await requireMailAdmin();
    return mailJson({ accounts: await prisma.mailAccount.findMany({ orderBy: { createdAt: "desc" }, take: 500, select: { id: true, email: true, name: true, role: true, status: true, createdAt: true } }) });
  });
}
export function POST(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const actor = await requireMailAdmin();
    await rateLimitMail(`admin:${actor.id}`, 30, 60);
    const data = z.object({ email: corporateEmail, name: z.string().trim().min(1).max(120), role: z.enum(["USER", "ADMIN", "AUDITOR"]).default("USER") }).parse(await readMailJson(request, 4096));
    if (await prisma.mailAccount.findUnique({ where: { email: data.email } })) throw new MailError(409, "Ese correo ya está autorizado.");
    const account = await prisma.$transaction(async (tx) => {
      const account = await tx.mailAccount.create({ data: { ...data, createdBy: actor.id } });
      await tx.mailAuditEvent.create({ data: { action: "ACCOUNT_AUTHORIZED", actorId: actor.id, targetId: account.id } });
      return account;
    });
    return mailJson({ account: { id: account.id, email: account.email, name: account.name, role: account.role, status: account.status }, provisioning: "El buzón debe existir en Stalwart antes del primer acceso." }, 201);
  });
}
