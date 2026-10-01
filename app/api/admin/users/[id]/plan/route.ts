import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"
import { Plan } from "@prisma/client"

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

    const { plan, durationDays, reason } = (await req.json().catch(() => ({}))) as { plan?: unknown; durationDays?: unknown; reason?: unknown }

    if (!plan || !reason || typeof reason !== "string") {
      return NextResponse.json({ success: false, error: "El plan y la razón son campos obligatorios" }, { status: 400 })
    }

    const validPlans = Object.values(Plan)
    if (!validPlans.includes(plan as any)) {
      return NextResponse.json({ success: false, error: "Plan inválido" }, { status: 400 })
    }

    const userId = params.id
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    const planExpiresAt = durationDays && Number(durationDays) > 0
      ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000)
      : null

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan as Plan,
        planExpiresAt
      }
    })

    // Create Subscription entry
    await prisma.subscription.create({
      data: {
        userId,
        plan: plan as Plan,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: planExpiresAt,
        paymentId: `Soporte/Cortesía: ${reason.slice(0, 100)}`
      }
    })

    // Log the audit event in AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: me.id,
        action: "CHANGE_USER_PLAN",
        details: `Plan de usuario @${targetUser.username} cambiado a ${plan}. Expiración: ${planExpiresAt ? planExpiresAt.toLocaleDateString() : "Nunca"}. Razón: ${reason}`
      }
    })

    // No devolver hash de contraseña ni secreto 2FA
    const { password: _password, twoFactorSecret: _secret, ...safeUser } = updatedUser
    return NextResponse.json({ success: true, data: safeUser })
  } catch (error: any) {
    console.error("Error changing user plan:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
// creado por pato dev y askforvini
