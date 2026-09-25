import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const { status } = await req.json();
    const allowed = new Set(["IN_PROGRESS", "IN_REVIEW", "REVISION", "COMPLETED", "CANCELLED", "DISPUTED"]);
    if (!allowed.has(status)) return NextResponse.json({ success: false, error: "Estado no permitido" }, { status: 400 });

    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { service: true }
    });

    if (!order) return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });

    // Security check: only client or provider can update status
    // Client can COMPLETED, Provider can IN_PROGRESS or IN_REVIEW
    const isClient = order.clientId === user.id;
    const isProvider = order.service.providerId === user.id;

    if (!isClient && !isProvider) {
      return NextResponse.json({ success: false, error: "No tienes permiso" }, { status: 403 });
    }

    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    });

    // Emit real-time update if io is available
    const io = (globalThis as any).io;
    if (io) {
      io.to(order.clientId).emit("statusUpdate", { orderId: params.id, status });
      io.to(order.service.providerId).emit("statusUpdate", { orderId: params.id, status });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
