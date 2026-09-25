import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("SESSION EMAIL:", session?.user?.email);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        services: {
          include: {
            packages: { take: 1, orderBy: { price: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.services });
  } catch (error) {
    console.error("Error fetching user services:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
