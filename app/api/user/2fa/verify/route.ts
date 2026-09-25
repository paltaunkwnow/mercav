import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { token } = await req.json();
    const userId = (session.user as any).id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true }
    });

    if (!user?.twoFactorSecret) {
      return NextResponse.json({ error: "Configuración 2FA no iniciada" }, { status: 400 });
    }

    const { verify } = await import("otplib");
    const result = await verify({
      token,
      secret: user.twoFactorSecret
    });
    const isValid = result && typeof result === 'object' ? result.valid : result;

    if (!isValid) {
      return NextResponse.json({ error: "Código inválido. Inténtalo de nuevo." }, { status: 400 });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return NextResponse.json({ success: true, message: "2FA habilitado correctamente" });
  } catch (error) {
    return NextResponse.json({ error: "Error en la verificación" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
