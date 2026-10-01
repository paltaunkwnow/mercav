import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// Estados desde los que ya no se puede abrir una disputa.
const CLOSED_STATUSES = new Set(["COMPLETED", "CANCELLED", "DISPUTED"]);

const REASON_MIN = 5;
const REASON_MAX = 140;
const DETAILS_MAX = 4000;

/**
 * Abre una disputa sobre un pedido de servicio.
 * - Solo el comprador (clientId) o el vendedor (providerId) del pedido.
 * - Solo si el pedido no está COMPLETED / CANCELLED / DISPUTED.
 * - Pasa el pedido a DISPUTED, abre un Ticket de soporte con el motivo
 *   (lo ve el equipo en /dashboard/pedidos/tickets/[id]) y notifica
 *   a la otra parte y a los administradores.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const details = typeof body?.details === "string" ? body.details.trim() : "";

    if (reason.length < REASON_MIN) {
      return NextResponse.json(
        { success: false, error: `Indicá el motivo de la disputa (mínimo ${REASON_MIN} caracteres).` },
        { status: 400 }
      );
    }
    if (reason.length > REASON_MAX || details.length > DETAILS_MAX) {
      return NextResponse.json({ success: false, error: "El motivo o los detalles son demasiado largos." }, { status: 400 });
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        clientId: true,
        providerId: true,
        service: { select: { title: true, providerId: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    const providerId = order.service.providerId || order.providerId;
    const isClient = order.clientId === user.id;
    const isProvider = providerId === user.id;
    if (!isClient && !isProvider) {
      return NextResponse.json({ success: false, error: "Solo el comprador o el vendedor pueden abrir una disputa." }, { status: 403 });
    }

    if (CLOSED_STATUSES.has(order.status)) {
      const msg =
        order.status === "DISPUTED"
          ? "Este pedido ya tiene una disputa abierta."
          : "No se puede abrir una disputa sobre un pedido completado o cancelado.";
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    const shortId = order.id.slice(-8).toUpperCase();

    const ticket = await prisma.$transaction(async (tx) => {
      // Update condicional: evita la carrera entre dos pedidos de disputa simultáneos
      // o un cambio de estado concurrente.
      const updated = await tx.serviceOrder.updateMany({
        where: { id: order.id, status: { notIn: ["COMPLETED", "CANCELLED", "DISPUTED"] } },
        data: { status: "DISPUTED" },
      });
      if (updated.count === 0) return null;

      return tx.ticket.create({
        data: {
          userId: user.id,
          orderId: order.id,
          category: "OTHER",
          status: "OPEN",
          subject: `Disputa del pedido ${shortId}: ${reason}`.slice(0, 200),
          message:
            `Motivo: ${reason}\n` +
            `Abierta por: ${isClient ? "comprador" : "vendedor"}\n` +
            `Estado previo del pedido: ${order.status}` +
            (details ? `\n\nDetalles:\n${details}` : ""),
        },
        select: { id: true },
      });
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "El estado del pedido cambió. Recargá la página e intentá de nuevo." }, { status: 409 });
    }

    // Tiempo real (mismo evento que usa /api/orders/[id]/status)
    const io = (globalThis as any).io;
    if (io) {
      io.to(order.clientId).emit("statusUpdate", { orderId: order.id, status: "DISPUTED" });
      io.to(providerId).emit("statusUpdate", { orderId: order.id, status: "DISPUTED" });
    }

    // Notificaciones: no bloquean la respuesta si fallan (createNotification ya captura errores).
    const otherPartyId = isClient ? providerId : order.clientId;
    const admins = await prisma.userRole
      .findMany({ where: { role: "ADMIN" }, select: { userId: true } })
      .catch(() => [] as { userId: string }[]);

    await Promise.all([
      createNotification(
        otherPartyId,
        "ORDER_DISPUTE",
        "Se abrió una disputa en tu pedido",
        `${user.name} abrió una disputa sobre "${order.service.title}": ${reason}`,
        `/dashboard/pedidos/${order.id}`
      ),
      ...admins
        .filter((a) => a.userId !== user.id && a.userId !== otherPartyId)
        .map((a) =>
          createNotification(
            a.userId,
            "ORDER_DISPUTE_ADMIN",
            `Nueva disputa · pedido ${shortId}`,
            `Motivo: ${reason}`,
            `/dashboard/pedidos/tickets/${ticket.id}`
          )
        ),
    ]);

    return NextResponse.json({ success: true, data: { status: "DISPUTED", ticketId: ticket.id } });
  } catch (error) {
    console.error("Error opening order dispute:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
