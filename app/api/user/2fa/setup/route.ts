import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA ya está habilitado" }, { status: 400 });
    }

    // Generate secret and QR code URL using otplib v13 direct exports
    const { generateSecret, generateURI } = await import("otplib");
    
    const secret = generateSecret();
    
    // Store secret temporarily
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });

    const otpauth = generateURI({
      secret,
      label: user.email,
      issuer: "MERCAV"
    });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({ 
      secret, 
      qrCodeUrl 
    });
  } catch (error) {
    console.error("2FA SETUP ERROR:", error);
    return NextResponse.json({ error: "Error interno al configurar 2FA" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
