import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/services/[serviceId]/milestone/[milestoneId]/approve
 *
 * Aprueba un milestone completado y libera fondos del escrow al freelancer.
 * - Solo el cliente de la orden puede aprobar
 * - El milestone debe estar COMPLETED
 * - Solo se libera una vez (released = false inicialmente)
 * - Crea una transacción registrando la liberación
 */
export async function POST(
  req: Request,
  { params }: { params: { serviceId: string; milestoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Buscar el milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: params.milestoneId },
      include: {
        order: {
          include: {
            service: { select: { providerId: true, title: true } },
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: "Hito no encontrado" },
        { status: 404 }
      );
    }

    // Validar que el milestone pertenece al servicio solicitado
    if (milestone.order.serviceId !== params.serviceId) {
      return NextResponse.json(
        { success: false, error: "El hito no pertenece a este servicio" },
        { status: 403 }
      );
    }

    // VALIDACIÓN: Solo el cliente puede aprobar
    if (milestone.order.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Solo el cliente puede aprobar milestones" },
        { status: 403 }
      );
    }

    // VALIDACIÓN: El milestone debe estar COMPLETED
    if (milestone.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "El hito debe estar completado para ser aprobado" },
        { status: 409 }
      );
    }

    // Transacción atómica: actualizar milestone + crear transacción de liberación
    const updatedMilestone = await prisma.$transaction(async (tx) => {
      // Validar que no haya sido liberado previamente (dentro de la transacción)
      const mCurrent = await tx.milestone.findUnique({
        where: { id: milestone.id },
      });

      if (mCurrent?.released) {
        throw new Error("Este hito ya fue liberado previamente");
      }

      // Actualizar milestone: marcar como PAID y released
      const m = await tx.milestone.update({
        where: { id: milestone.id },
        data: {
          status: "PAID",
          released: true,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Crear transacción de liberación de fondos
      // Nota: Esta transacción registra que los fondos están siendo liberados.
      // En producción con Stripe Connected Accounts, aquí se haría stripe.transfers.create()
      await tx.transaction.create({
        data: {
          // Usar un ID único basado en el milestone para evitar duplicados
          stripeId: `milestone_${milestone.id}_release`,
          amount: milestone.amount,
          currency: "USD",
          status: "PAID", // Marcamos como PAID ya que es una liberación de escrow
          metadata: {
            type: "milestone_release",
            milestoneId: milestone.id,
            orderId: milestone.orderId,
            providerId: milestone.order.service.providerId,
            clientId: milestone.order.clientId,
            serviceTitle: milestone.order.service.title,
          },
          orderId: milestone.orderId,
          // Opcionalmente, guardar el userId del provider
          // userId: milestone.order.service.providerId,
        },
      });

      return m;
    });

    // Obtener información del freelancer para la respuesta
    const provider = await prisma.user.findUnique({
      where: { id: milestone.order.service.providerId },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        milestone: updatedMilestone,
        message: `Hito "${milestone.title}" aprobado. Fondos de $${Number(milestone.amount).toFixed(2)} USD liberados a ${provider?.name || "el freelancer"}.`,
      },
    });
  } catch (error) {
    console.error("Error approving milestone:", error);
    // Verificar si es error de liberación duplicada
    if (error instanceof Error && error.message.includes("ya fue liberado")) {
      return NextResponse.json(
        { success: false, error: "Este hito ya fue liberado previamente" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Error al procesar la aprobación del hito" },
      { status: 500 }
    );
  }
}
// creado por pato dev y askforvini
