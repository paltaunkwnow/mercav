import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { isSanctioned, reason, expiresAt } = body ?? {};
    if (typeof isSanctioned !== "boolean") {
      return NextResponse.json({ success: false, error: "isSanctioned debe ser booleano" }, { status: 400 });
    }
    const expires = expiresAt ? new Date(expiresAt) : null;
    if (expires && Number.isNaN(expires.getTime())) {
      return NextResponse.json({ success: false, error: "Fecha de expiración inválida" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isSanctioned,
        sanctionReason: typeof reason === "string" ? reason.slice(0, 1000) : null,
        sanctionExpiresAt: expires
      },
      // No devolver hash de contraseña ni secreto 2FA
      select: { id: true, username: true, isSanctioned: true, sanctionReason: true, sanctionExpiresAt: true }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error sanctioning user:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
