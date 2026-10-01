import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clip, displayIp, looksLikeInterceptor } from "@/lib/security/unusual-traffic";
import { clientIp } from "@/app/api/pwn/_lib/http";

const recent = new Map<string, number>();

function allowed(ip: string) {
  const now = Date.now();
  const last = recent.get(ip) || 0;
  if (now - last < 45_000) return false;
  if (recent.size > 2000) recent.clear();
  recent.set(ip, now);
  return true;
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  try {
    return NextResponse.json(await dossier(ip), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: true, ip: displayIp(ip), caseId: null, at: new Date().toISOString(), account: null }, { headers: { "Cache-Control": "no-store" } });
  }
}

async function dossier(ip: string, fallback?: { name?: string | null; email?: string | null }) {
  const latest = await prisma.unusualTrafficEvent.findFirst({
    where: { ip },
    orderBy: { createdAt: "desc" },
  });
  return {
    ok: true,
    ip: displayIp(ip),
    caseId: latest?.id ?? null,
    at: latest?.createdAt?.toISOString() ?? new Date().toISOString(),
    account: latest?.userEmail || fallback?.email
      ? { name: latest?.userName || fallback?.name || null, email: latest?.userEmail || fallback?.email || null }
      : null,
  };
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const noStore = { headers: { "Cache-Control": "no-store" } };

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string; name?: string; roles?: string[] } | undefined;
  const roles = (user?.roles || []).map((role) => role.toUpperCase());
  if (roles.includes("ADMIN")) {
    return NextResponse.json({ ok: true, ip: displayIp(ip) }, noStore);
  }

  if (allowed(ip)) {
    const userAgent = clip(req.headers.get("user-agent"), 512);
    const reason = looksLikeInterceptor(userAgent) ? "proxy" : clip(body.reason, 40) || "inspect";
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
        return NextResponse.json(await dossier(ip, user).catch(() => ({ ok: false, ip: displayIp(ip) })), { status: 500, ...noStore });
      }
    }
  }

  return NextResponse.json(await dossier(ip, user), noStore);
}
// creado por pato dev y askforvini
