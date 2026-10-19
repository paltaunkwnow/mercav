import "server-only";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { MailError, mailConfig, mailCookieName } from "./config";
import { hashToken, openCredential } from "./crypto";

export async function rateLimitMail(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const window = Math.floor(now / (windowSeconds * 1000));
  const row = await prisma.mailRateLimit.upsert({
    where: { key: hashToken(`${key}:${window}`) },
    create: { key: hashToken(`${key}:${window}`), expiresAt: new Date((window + 1) * windowSeconds * 1000) },
    update: { count: { increment: 1 } },
  });
  if (row.count > limit) throw new MailError(429, "Demasiados intentos. Esperá un momento antes de volver a probar.");
}

export async function auditMail(action: string, actorId?: string, targetId?: string) {
  // No addresses, message content, subjects, passwords or tokens in audit records.
  await prisma.mailAuditEvent.create({ data: { action, actorId, targetId } });
}

export async function requireMailSession() {
  mailConfig();
  const token = cookies().get(mailCookieName())?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new MailError(401, "Iniciá sesión en Mercav Mail.");
  const session = await prisma.mailSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { account: true } });
  const now = Date.now();
  if (!session || session.account.status !== "ACTIVE" || session.expiresAt.getTime() <= now || session.lastSeenAt.getTime() + 30 * 60_000 <= now) {
    if (session) await prisma.mailSession.deleteMany({ where: { id: session.id } });
    throw new MailError(401, "La sesión de correo terminó. Volvé a ingresar.");
  }
  if (now - session.lastSeenAt.getTime() > 60_000) await prisma.mailSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  await rateLimitMail(`request:${session.accountId}`, 180, 60);
  let password: string;
  try { password = openCredential(session.credential, session.accountId); }
  catch {
    await prisma.mailSession.deleteMany({ where: { id: session.id } });
    throw new MailError(401, "La sesión de correo terminó. Volvé a ingresar.");
  }
  return { ...session, password };
}

export async function requireMailAdmin() {
  mailConfig();
  // The initial bootstrap is explicitly allowlisted by immutable platform user ID.
  // A platform ADMIN alone is insufficient; a public registration never grants Mail admin.
  const auth = await getServerSession(authOptions);
  const id = auth?.user?.id;
  const allowed = (process.env.MAIL_BOOTSTRAP_ADMIN_IDS || "").split(",").map((v) => v.trim()).filter(Boolean);
  if (id && allowed.includes(id)) {
    const user = await prisma.user.findUnique({ where: { id }, select: { isSanctioned: true, roles: { select: { role: true } } } });
    if (user && !user.isSanctioned && user.roles.some((r) => r.role === "ADMIN")) return { id, role: "ADMIN" as const };
  }
  const session = await requireMailSession();
  if (session.account.role !== "ADMIN") throw new MailError(403, "Se requiere administración de correo.");
  return { id: session.accountId, role: session.account.role };
}
