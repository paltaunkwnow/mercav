import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (!me || !(await isAdminUser(me.id))) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    const [users, activeUsers, posts, jobs, spaces, services, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.post.count(),
      prisma.jobPost.count(),
      prisma.space.count(),
      prisma.service.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({ success: true, data: { users, activeUsers, posts, jobs, spaces, services, pendingReports } });
  } catch (error) {
    console.error("Admin stats error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
