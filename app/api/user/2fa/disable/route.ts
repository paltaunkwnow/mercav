import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password : "";
    const code = typeof body.code === "string" ? body.code : "";
    if (!password || !code) {
      return NextResponse.json({ error: "Se requiere contraseña y código 2FA" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() } });
    if (!user?.password || !user.twoFactorSecret) {
      return NextResponse.json({ error: "No se puede desactivar" }, { status: 400 });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });
    }

    const { verify } = await import("otplib");
    const result = await verify({ token: code, secret: user.twoFactorSecret });
    const valid = result && typeof result === "object" ? result.valid : result;
    if (!valid) {
      return NextResponse.json({ error: "Código 2FA inválido" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return NextResponse.json({ success: true, message: "2FA desactivado correctamente" });
  } catch (error) {
    console.error("2FA DISABLE ERROR");
    return NextResponse.json({ error: "Error al desactivar 2FA" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
