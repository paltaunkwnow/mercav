import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (!me || !(await isAdminUser(me.id))) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { nit: { contains: q, mode: "insensitive" } },
          { ci: { contains: q, mode: "insensitive" } },
        ],
      } : undefined,
      include: { roles: true, profile: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const safeUsers = users.map(({ password: _password, twoFactorSecret: _secret, ...user }) => user);
    return NextResponse.json({ success: true, data: safeUsers });
  } catch (error) {
    console.error("Admin users error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
