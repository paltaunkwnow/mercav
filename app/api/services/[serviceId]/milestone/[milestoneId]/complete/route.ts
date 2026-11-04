import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/services/[serviceId]/milestone/[milestoneId]/complete
 *
 * El freelancer marca un milestone como completado.
 * - Solo el provider (freelancer) puede marcar como completado
 * - El milestone debe estar PENDING
 * - Actualiza el estado a COMPLETED
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
            service: { select: { providerId: true } },
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

    // VALIDACIÓN: Solo el provider puede marcar como completado
    if (milestone.order.service.providerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Solo el freelancer puede completar milestones" },
        { status: 403 }
      );
    }

    // VALIDACIÓN: El milestone debe estar PENDING
    if (milestone.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "El hito debe estar pendiente para marcar como completado" },
        { status: 409 }
      );
    }

    // Actualizar el milestone
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        milestone: updatedMilestone,
        message: `Hito "${milestone.title}" marcado como completado. El cliente será notificado para revisar y aprobar.`,
      },
    });
  } catch (error) {
    console.error("Error completing milestone:", error);
    return NextResponse.json(
      { success: false, error: "Error al marcar el hito como completado" },
      { status: 500 }
    );
  }
}
// creado por pato dev y askforvini
