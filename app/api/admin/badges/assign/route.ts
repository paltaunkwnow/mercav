import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (
      (session.user as any).role === "ADMIN" || 
      (session.user as any).roles?.includes("ADMIN")
    );

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { username, badgeId } = await req.json();

    if (!username || !badgeId) {
      return NextResponse.json({ success: false, error: "Faltan datos" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId }
    });

    if (!badge) {
      return NextResponse.json({ success: false, error: "Insignia no encontrada" }, { status: 404 });
    }

    // Connect badge to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        badges: {
          connect: { id: badgeId }
        }
      }
    });

    return NextResponse.json({ success: true, message: "Insignia asignada" });
  } catch (error) {
    console.error("Error assigning badge:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
