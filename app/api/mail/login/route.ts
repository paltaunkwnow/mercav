import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMailOrigin, mailConfig, mailCookieName, MailError } from "@/lib/mail/config";
import { hashToken, newToken, sealCredential } from "@/lib/mail/crypto";
import { auditMail, rateLimitMail } from "@/lib/mail/auth";
import { discoverMail } from "@/lib/mail/jmap";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { corporateEmail } from "@/lib/mail/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function POST(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    await rateLimitMail("login:global", 300, 60);
    const data = z.object({ email: corporateEmail, password: z.string().min(1).max(1024) }).parse(await readMailJson(request, 4096));
    await rateLimitMail(`login:${data.email}`, 10, 900);
    const account = await prisma.mailAccount.findUnique({ where: { email: data.email } });
    if (!account || account.status !== "ACTIVE") {
      await auditMail("LOGIN_DENIED");
      throw new MailError(401, "Correo o contraseña incorrectos, o acceso no autorizado.");
    }
    let discovery;
    try { discovery = await discoverMail({ email: account.email, password: data.password }); }
    catch (error) {
      await auditMail("LOGIN_FAILED", account.id);
      if (error instanceof MailError && error.status === 401) throw new MailError(401, "Correo o contraseña incorrectos, o acceso no autorizado.");
      throw error;
    }
    const token = newToken();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60_000);
    await prisma.$transaction(async (tx) => {
      await tx.mailSession.deleteMany({ where: { accountId: account.id, OR: [{ expiresAt: { lte: new Date() } }, { lastSeenAt: { lte: new Date(Date.now() - 30 * 60_000) } }] } });
      await tx.mailSession.create({ data: { tokenHash: hashToken(token), accountId: account.id, credential: sealCredential(data.password, account.id), jmapAccountId: discovery.primaryAccounts["urn:ietf:params:jmap:mail"], expiresAt } });
      await tx.mailAuditEvent.create({ data: { action: "LOGIN_SUCCEEDED", actorId: account.id } });
    });
    const response = mailJson({ user: { email: account.email, name: account.name, role: account.role }, expiresAt });
    response.cookies.set(mailCookieName(), token, { httpOnly: true, secure: mailConfig().secure, sameSite: "strict", path: "/", expires: expiresAt });
    return response;
  });
}
