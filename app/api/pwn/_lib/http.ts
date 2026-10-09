import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PwnProviderError } from "@/lib/integrations/pwn";
import { retryAfterCopy } from "@/lib/pwn/rate-copy";

export type PwnSessionUser = {
  id: string;
  email?: string | null;
  roles: string[];
  /** La cuenta confirmó su buzón: alta con Google o User.isVerified. */
  emailConfirmed: boolean;
};

export function disabledResponse(): NextResponse | null {
  return process.env.PWN_ENABLED === "true"
    ? null
    : NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
}

/**
 * Usuario de la sesión, siempre resuelto contra la base. Si la fila no existe (cuenta borrada),
 * el JWT no alcanza: devolvemos null. Los roles salen solo de la base, nunca del token.
 */
export async function getPwnSessionUser(): Promise<PwnSessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: unknown; email?: string | null } | undefined;
  if (!user) return null;
  const sessionId = typeof user.id === "string" ? user.id : "";
  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!sessionId && !email) return null;

  const resolved = await findDbUser({ sessionId, email });
  if (!resolved) return null;

  const dbRoles = await prisma.userRole.findMany({
    where: { userId: resolved.id },
    select: { role: true },
  });

  return {
    id: resolved.id,
    email: resolved.email,
    roles: [...new Set(dbRoles.map((row) => row.role))],
    emailConfirmed: resolved.isVerified,
  };
}

async function findDbUser(input: {
  sessionId: string;
  email: string;
}): Promise<{ id: string; email: string; isVerified: boolean } | null> {
  const select = { id: true, email: true, isVerified: true } as const;
  // Con id en el token, ese id manda: si la fila ya no existe no caemos al email (podría ser otra cuenta).
  if (input.sessionId) {
    return prisma.user.findUnique({ where: { id: input.sessionId }, select });
  }
  if (input.email) {
    return prisma.user.findUnique({ where: { email: input.email }, select });
  }
  return null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
}

export function validationError(details?: unknown): NextResponse {
  return NextResponse.json(
    { success: false, error: "Solicitud inválida", details },
    { status: 400 },
  );
}

export function providerError(error: unknown): NextResponse | null {
  if (!(error instanceof PwnProviderError)) return null;
  if (error.rateLimited) {
    console.warn(`Pwn provider rate limited: ${error.provider}`);
    const seconds = error.retryAfterSeconds ?? 60;
    return NextResponse.json(
      { success: false, error: `${error.provider} está limitando las consultas. ${retryAfterCopy(seconds)}` },
      { status: 429, headers: { "Retry-After": String(seconds) } },
    );
  }
  console.error(`Pwn provider failure: ${error.provider}`);
  return NextResponse.json(
    { success: false, error: `${error.provider} no respondió. Probá de nuevo en unos minutos.` },
    { status: 502 },
  );
}

export function internalError(context: string, error: unknown): NextResponse {
  console.error(`Pwn ${context} failed`, error);
  return NextResponse.json(
    { success: false, error: "Error interno" },
    { status: 500 },
  );
}

/**
 * The left-most x-forwarded-for entry is client-controlled, so prefer the
 * platform-provided address, then x-real-ip (set by the edge proxy), then the
 * right-most x-forwarded-for hop (appended by the nearest proxy).
 */
export function clientIp(request: NextRequest): string {
  const platformIp = (request as NextRequest & { ip?: string }).ip;
  if (platformIp) return platformIp;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops?.length ? hops[hops.length - 1] : "unknown";
}

/**
 * Valida `Authorization: Bearer <CRON_SECRET>` en tiempo constante.
 * Se comparan digests SHA-256 para que el largo del header no filtre información.
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const received = createHash("sha256").update(header).digest();
  return timingSafeEqual(expected, received);
}

export function isAdmin(user: PwnSessionUser): boolean {
  return user.roles.some((role) => role.toUpperCase() === "ADMIN");
}
// creado por pato dev y askforvini
