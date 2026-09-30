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

    const body = await req.json();
    const { isSanctioned, reason, expiresAt } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isSanctioned,
        sanctionReason: reason,
        sanctionExpiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error sanctioning user:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
