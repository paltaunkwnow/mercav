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

    const reports = await prisma.report.findMany({
      where: { status: { in: ["PENDING", "REVIEWED"] } },
      include: { reporter: { select: { id: true, name: true, username: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Admin reports error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
