import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"
import { createNotification } from "@/lib/notifications"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const action = typeof body?.action === "string" ? body.action : ""
    if (!action || !["RELEASE", "REFUND"].includes(action)) {
      return NextResponse.json({ success: false, error: "Acción no válida o no especificada" }, { status: 400 })
    }

    const orderId = params.id
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        clientId: true,
        totalPrice: true,
        service: { select: { providerId: true } }
      }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Orden de servicio no encontrada" }, { status: 404 })
    }

    // Solo se resuelven pedidos en disputa, y una sola vez (update condicional más abajo)
    if (order.status !== "DISPUTED") {
      return NextResponse.json({ success: false, error: "El pedido no está en disputa" }, { status: 409 })
    }

    if (action === "RELEASE") {
      // Release funds to Freelancer / Provider
      const resolved = await prisma.serviceOrder.updateMany({
        where: { id: orderId, status: "DISPUTED" },
        data: {
          status: "COMPLETED",
          completedAt: new Date()
        }
      })
      if (resolved.count === 0) {
        return NextResponse.json({ success: false, error: "La disputa ya fue resuelta" }, { status: 409 })
      }

      // Notify both parties
      await createNotification(
        order.service.providerId,
        "DISPUTE_RELEASED",
        "Disputa Resuelta: Fondos Liberados",
        `El administrador de Mercav resolvió la disputa a tu favor. Los fondos de la orden por $${order.totalPrice} USD han sido liberados.`,
        `/dashboard/pedidos`
      )

      await createNotification(
        order.clientId,
        "DISPUTE_RELEASED",
        "Disputa Cerrada Administrativamente",
        `La disputa de la orden de servicio por $${order.totalPrice} USD ha sido resuelta y cerrada por el administrador.`,
        `/dashboard/pedidos`
      )

      // Audit Log
      await prisma.adminLog.create({
        data: {
          adminId: me.id,
          action: "RESOLVE_DISPUTE_RELEASE",
          details: `Disputa resuelta a favor del freelancer para orden ID ${orderId}. Fondos de $${order.totalPrice} liberados.`
        }
      })

      return NextResponse.json({ success: true, message: "Fondos liberados exitosamente al freelancer" })
    } else {
      // Refund client, cancel order
      // Cancelar + marcar reembolso en una sola transacción y de forma condicional
      const resolved = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.serviceOrder.updateMany({
          where: { id: orderId, status: "DISPUTED" },
          data: { status: "CANCELLED" }
        })
        if (cancelled.count === 0) return false
        await tx.transaction.updateMany({
          where: { orderId: orderId, status: "PAID" },
          data: { status: "REFUNDED" }
        })
        return true
      })
      if (!resolved) {
        return NextResponse.json({ success: false, error: "La disputa ya fue resuelta" }, { status: 409 })
      }

      // Notify both parties
      await createNotification(
        order.clientId,
        "DISPUTE_REFUNDED",
        "Disputa Resuelta: Reembolso Aprobado",
        `El administrador de Mercav resolvió la disputa a tu favor. Se ha procesado un reembolso por $${order.totalPrice} USD para tu orden.`,
        `/dashboard/pedidos`
      )

      await createNotification(
        order.service.providerId,
        "DISPUTE_REFUNDED",
        "Disputa Resuelta: Reembolso a Cliente",
        `La disputa de la orden por $${order.totalPrice} USD ha sido resuelta a favor del cliente. La orden ha sido cancelada.`,
        `/dashboard/pedidos`
      )

      // Audit Log
      await prisma.adminLog.create({
        data: {
          adminId: me.id,
          action: "RESOLVE_DISPUTE_REFUND",
          details: `Disputa resuelta a favor del cliente para orden ID ${orderId}. Reembolso de $${order.totalPrice} procesado.`
        }
      })

      return NextResponse.json({ success: true, message: "Reembolso procesado y orden cancelada" })
    }
  } catch (error: any) {
    console.error("Error resolving dispute:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
// creado por pato dev y askforvini
