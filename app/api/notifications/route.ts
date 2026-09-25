import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { 
        user: { email: session.user.email }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.warn("Notifications table/database unavailable, returning empty list:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id, all } = await req.json();

    if (all) {
      await prisma.notification.updateMany({
        where: { user: { email: session.user.email }, isRead: false },
        data: { isRead: true }
      });
    } else if (id && typeof id === "string") {
      const result = await prisma.notification.updateMany({
        where: { id, user: { email: session.user.email } },
        data: { isRead: true },
      });
      if (result.count === 0) {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn("Error updating notifications:", error);
    return NextResponse.json({ success: true });
  }
}
// creado por pato dev y askforvini
