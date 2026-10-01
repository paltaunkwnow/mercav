import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"
import { createNotification } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const transactionId = typeof body?.transactionId === "string" ? body.transactionId : ""
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : ""

    if (!transactionId || !reason) {
      return NextResponse.json({ success: false, error: "ID de transacción y razón son requeridos" }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transacción no encontrada" }, { status: 404 })
    }

    if (transaction.status !== "PAID") {
      return NextResponse.json({ success: false, error: "Sólo se pueden reembolsar transacciones completadas (PAID)" }, { status: 400 })
    }

    // Process manual database refund
    // Update condicional: dos reembolsos simultáneos no pueden pasar ambos el chequeo de PAID
    const claimed = await prisma.transaction.updateMany({
      where: { id: transactionId, status: "PAID" },
      data: { status: "REFUNDED" }
    })
    if (claimed.count === 0) {
      return NextResponse.json({ success: false, error: "La transacción ya fue reembolsada o cambió de estado" }, { status: 409 })
    }
    const updatedTx = await prisma.transaction.findUnique({ where: { id: transactionId } })

    // Log the audit event
    await prisma.adminLog.create({
      data: {
        adminId: me.id,
        action: "MANUAL_REFUND",
        details: `Reembolso manual de $${transaction.amount} USD para transacción ID ${transactionId}. Razón: ${reason}`
      }
    })

    // Notify the user if user is linked
    if (transaction.userId) {
      await createNotification(
        transaction.userId,
        "MANUAL_REFUND_PROCESSED",
        "Reembolso Procesado por Soporte",
        `Se ha procesado un reembolso manual de $${transaction.amount} USD a tu favor. Justificación: ${reason}`,
        `/dashboard`
      )
    }

    return NextResponse.json({ success: true, data: updatedTx })
  } catch (error: any) {
    console.error("Error processing manual refund:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
// creado por pato dev y askforvini
