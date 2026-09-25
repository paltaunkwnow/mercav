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

    const service = await prisma.service.findUnique({ where: { id: params.id } });
    if (!service) return NextResponse.json({ success: false, error: "Servicio no encontrado" }, { status: 404 });

    const existing = await prisma.savedService.findUnique({
      where: {
        userId_serviceId: {
          userId: user.id,
          serviceId: service.id
        }
      }
    });

    if (existing) {
      await prisma.savedService.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, saved: false });
    }

    await prisma.savedService.create({
      data: {
        userId: user.id,
        serviceId: service.id
      }
    });

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error("Error saving service:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
