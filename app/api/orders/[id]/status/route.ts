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
    // DISPUTED se abre solo por /api/orders/[id]/dispute (exige motivo y crea el ticket de soporte).
    const allowed = new Set(["IN_PROGRESS", "IN_REVIEW", "REVISION", "COMPLETED", "CANCELLED"]);
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

    // Un pedido en disputa, completado o cancelado no vuelve a cambiar desde acá
    // (las disputas las resuelve el equipo de Mercav).
    if (["DISPUTED", "COMPLETED", "CANCELLED"].includes(order.status)) {
      return NextResponse.json({ success: false, error: "El pedido ya no admite cambios de estado" }, { status: 409 });
    }

    // Who may move the order where. The provider delivers, the client accepts or asks for changes,
    // and either side may cancel only before work starts.
    const providerMoves: Record<string, string[]> = {
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["IN_REVIEW"],
      REVISION: ["IN_PROGRESS", "IN_REVIEW"],
    };
    const clientMoves: Record<string, string[]> = {
      PENDING: ["CANCELLED"],
      IN_REVIEW: ["COMPLETED", "REVISION"],
    };
    const moves = isProvider ? providerMoves : clientMoves;
    if (!(moves[order.status] ?? []).includes(status)) {
      return NextResponse.json({ success: false, error: "Ese cambio de estado no está permitido para tu rol en este momento" }, { status: 409 });
    }

    const updatedOrder = await prisma.serviceOrder.updateMany({
      where: { id: params.id, status: order.status },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    });
    if (updatedOrder.count === 0) {
      return NextResponse.json({ success: false, error: "El pedido cambió mientras tanto. Recargá la página." }, { status: 409 });
    }
    const fresh = await prisma.serviceOrder.findUnique({ where: { id: params.id } });

    // Emit real-time update if io is available
    const io = (globalThis as any).io;
    if (io) {
      io.to(order.clientId).emit("statusUpdate", { orderId: params.id, status });
      io.to(order.service.providerId).emit("statusUpdate", { orderId: params.id, status });
    }

    return NextResponse.json({ success: true, data: fresh });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
