import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    | { id?: unknown; email?: string | null; roles?: unknown }
    | undefined;
  if (!user || typeof user.id !== "string") return null;
  return {
    id: user.id,
    email: user.email,
    roles: Array.isArray(user.roles)
      ? user.roles.filter((role): role is string => typeof role === "string")
      : [],
  };
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
// creado por Patodev y Invertilo
