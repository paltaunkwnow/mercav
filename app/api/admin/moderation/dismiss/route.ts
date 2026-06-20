import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { targetId, targetType } = await req.json()

    if (!targetId || !targetType) {
      return NextResponse.json({ success: false, error: "El ID de contenido y tipo son requeridos" }, { status: 400 })
    }

    // 1. Resolve all related reports
    await prisma.report.updateMany({
      where: { targetId, targetType },
      data: {
        status: "RESOLVED",
        resolvedBy: me.id,
        resolvedAt: new Date()
      }
    })

    // 2. Restore content status back to active / not under review
    if (targetType === "POST") {
      await prisma.post.update({
        where: { id: targetId },
        data: { isUnderReview: false, isActive: true }
      })
    } else if (targetType === "SERVICE") {
      await prisma.service.update({
        where: { id: targetId },
        data: { isUnderReview: false, isActive: true }
      })
    } else if (targetType === "SPACE") {
      await prisma.space.update({
        where: { id: targetId },
        data: { isUnderReview: false, isActive: true }
      })
    } else if (targetType === "JOB") {
      await prisma.jobPost.update({
        where: { id: targetId },
        data: { isUnderReview: false, isActive: true }
      })
    }

    // 3. Add Admin Log entry
    await prisma.adminLog.create({
      data: {
        adminId: me.id,
        action: `DISMISS_${targetType}_REPORTS`,
        details: `Reportes desestimados para ${targetType} con ID ${targetId}. Contenido restaurado a activo.`
      }
    })

    return NextResponse.json({ success: true, message: "Reportes desestimados y contenido restaurado exitosamente" })
  } catch (error: any) {
    console.error("Error dismissing reports:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 })
  }
}
