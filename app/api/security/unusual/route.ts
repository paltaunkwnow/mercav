import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REASON_LABELS, clip, displayIp, looksLikeInterceptor } from "@/lib/security/unusual-traffic";
import { clientIp } from "@/app/api/pwn/_lib/http";

const WINDOW_MS = 45_000;
// Tope global de inserciones por ventana: aunque se roten IPs, la tabla no se llena.
const GLOBAL_MAX_PER_WINDOW = 60;
const recent = new Map<string, number>();
let globalWindowStart = 0;
let globalCount = 0;

function allowed(ip: string) {
  const now = Date.now();
  const last = recent.get(ip) || 0;
  if (now - last < WINDOW_MS) return false;
  if (now - globalWindowStart >= WINDOW_MS) {
    globalWindowStart = now;
    globalCount = 0;
  }
  if (globalCount >= GLOBAL_MAX_PER_WINDOW) return false;
  if (recent.size > 2000) {
    // Antes se vaciaba todo el mapa (rotar 2000 IPs reseteaba el límite). Ahora solo se podan las vencidas.
    for (const [key, at] of recent) {
      if (now - at >= WINDOW_MS) recent.delete(key);
    }
    if (recent.size > 2000) return false;
  }
  recent.set(ip, now);
  globalCount += 1;
  return true;
}

type Viewer = { id?: string; email?: string | null; name?: string | null };

async function sessionViewer(): Promise<(Viewer & { roles: string[] }) | undefined> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string; name?: string; roles?: string[] } | undefined;
  if (!user) return undefined;
  return { ...user, roles: (user.roles || []).map((role) => String(role).toUpperCase()) };
}

export async function GET(req: NextRequest) {
  // Normalizamos ::ffff: para que IPv4 mapeada y pura compartan registro y límite.
  const ip = displayIp(clientIp(req));
  const viewer = await sessionViewer().catch(() => undefined);
  try {
    return NextResponse.json(await dossier(ip, viewer), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: true, ip, caseId: null, at: new Date().toISOString(), account: null }, { headers: { "Cache-Control": "no-store" } });
  }
}

async function dossier(ip: string, viewer?: Viewer) {
  const latest = await prisma.unusualTrafficEvent.findFirst({
    where: { ip },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  // Solo mostramos la cuenta de la sesión actual: antes se devolvía el correo/nombre
  // guardado en el último evento de esa IP, que puede ser de otra persona (NAT, CGNAT, oficina).
  return {
    ok: true,
    ip,
    caseId: latest?.id ?? null,
    at: latest?.createdAt?.toISOString() ?? new Date().toISOString(),
    account: viewer?.email || viewer?.name
      ? { name: viewer?.name || null, email: viewer?.email || null }
      : null,
  };
}

export async function POST(req: NextRequest) {
  const ip = displayIp(clientIp(req));
  const noStore = { headers: { "Cache-Control": "no-store" } };

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const user = await sessionViewer().catch(() => undefined);
  if (user?.roles.includes("ADMIN")) {
    return NextResponse.json({ ok: true, ip }, noStore);
  }

  if (allowed(ip)) {
    const userAgent = clip(req.headers.get("user-agent"), 512);
    // reason es un enum cerrado: no aceptamos texto libre del cliente.
    const rawReason = clip(body.reason, 40);
    const reason = looksLikeInterceptor(userAgent)
      ? "proxy"
      : rawReason && Object.prototype.hasOwnProperty.call(REASON_LABELS, rawReason)
        ? rawReason
        : "inspect";
    const payload = {
      reason,
      ip,
      userAgent,
      fingerprint: clip(body.fingerprint, 160),
      path: clip(body.path, 300),
      userEmail: clip(user?.email, 190),
      userName: clip(user?.name, 120),
    };
    try {
      await prisma.unusualTrafficEvent.create({
        data: { ...payload, userId: user?.id || null },
      });
    } catch {
      try {
        await prisma.unusualTrafficEvent.create({ data: payload });
      } catch {
        return NextResponse.json(await dossier(ip, user).catch(() => ({ ok: false, ip })), { status: 500, ...noStore });
      }
    }
  }

  return NextResponse.json(await dossier(ip, user), noStore);
}
// creado por pato dev y askforvini
