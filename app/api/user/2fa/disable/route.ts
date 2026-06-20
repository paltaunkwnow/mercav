import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null 
      }
    });

    console.log(`2FA Disabled for user ${userId}`);

    return NextResponse.json({ success: true, message: "2FA desactivado correctamente" });
  } catch (error) {
    console.error("2FA DISABLE ERROR:", error);
    return NextResponse.json({ error: "Error al desactivar 2FA" }, { status: 500 });
  }
}
