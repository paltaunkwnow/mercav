import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PwnProviderError } from "@/lib/integrations/pwn";

export type PwnSessionUser = {
  id: string;
  email?: string | null;
  roles: string[];
};

export function disabledResponse(): NextResponse | null {
  return process.env.PWN_ENABLED === "true"
    ? null
    : NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
}

export async function getPwnSessionUser(): Promise<PwnSessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: unknown; email?: string | null; name?: string | null; roles?: unknown }
    | undefined;
  if (!user) return null;
  const sessionId = typeof user.id === "string" ? user.id : "";
  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  const name = typeof user.name === "string" ? user.name : null;
  if (!sessionId && !email) return null;

  const resolved = await ensureDbUser({ sessionId, email, name });
  if (!resolved) return null;

  const jwtRoles = Array.isArray(user.roles)
    ? user.roles.filter((role): role is string => typeof role === "string")
    : [];
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: resolved.id },
    select: { role: true },
  });
  const roles = [...new Set([...jwtRoles, ...dbRoles.map((row) => row.role)])];

  return {
    id: resolved.id,
    email: resolved.email,
    roles,
  };
}

async function ensureDbUser(input: {
  sessionId: string;
  email: string;
  name: string | null;
}): Promise<{ id: string; email: string } | null> {
  if (input.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true },
    });
    if (byEmail) return byEmail;
  }
  if (input.sessionId) {
    const byId = await prisma.user.findUnique({
      where: { id: input.sessionId },
      select: { id: true, email: true },
    });
    if (byId) return byId;
  }
  if (!input.email) return null;

  const base =
    input.email
      .split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "user";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      return await prisma.user.create({
        data: {
          ...(looksLikeUuid(input.sessionId) ? { id: input.sessionId } : {}),
          email: input.email,
          name: input.name?.trim() || "Usuario",
          username,
          isVerified: true,
        },
        select: { id: true, email: true },
      });
    } catch {
      const raced = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true },
      });
      if (raced) return raced;
    }
  }
  return null;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  console.error(`Pwn provider failure: ${error.provider}`);
  return NextResponse.json(
    { success: false, error: "El proveedor externo no está disponible" },
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

export function isAdmin(user: PwnSessionUser): boolean {
  return user.roles.some((role) => role.toUpperCase() === "ADMIN");
}
// creado por pato dev y askforvini
