import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const space = await prisma.space.findUnique({ where: { id: params.id } });
    if (!space) return NextResponse.json({ success: false, error: "Espacio no encontrado" }, { status: 404 });

    const existing = await prisma.savedSpace.findUnique({
      where: {
        userId_spaceId: {
          userId: user.id,
          spaceId: space.id
        }
      }
    });

    if (existing) {
      await prisma.savedSpace.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, saved: false });
    }

    await prisma.savedSpace.create({
      data: {
        userId: user.id,
        spaceId: space.id
      }
    });

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error("Error saving space:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
