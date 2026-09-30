import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!me) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    const { targetId, targetType, reason, description } = await req.json()

    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ success: false, error: "Parámetros incompletos" }, { status: 400 })
    }

    // 1. Check if user already reported this content
    const alreadyReported = await prisma.report.findFirst({
      where: {
        reporterId: me.id,
        targetType,
        targetId
      }
    })

    if (alreadyReported) {
      return NextResponse.json({
        success: false,
        error: "Ya has reportado este contenido anteriormente. Nuestro equipo lo revisará a la brevedad."
      }, { status: 400 })
    }

    // 2. Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: me.id,
        targetType,
        targetId,
        reason,
        description: description || ""
      }
    })

    // 3. Count reports for this content to check if it reaches 3 or more
    const totalReports = await prisma.report.count({
      where: {
        targetType,
        targetId,
        status: { in: ["PENDING", "REVIEWED"] }
      }
    })

    const admins = await prisma.user.findMany({
      where: { roles: { some: { role: "ADMIN" } } }
    })

    // Notify admins on any new report
    for (const admin of admins) {
      await createNotification(
        admin.id,
        "NEW_REPORT",
        "Nuevo Reporte de Contenido",
        `El usuario @${me.username} reportó un contenido (${targetType}). Motivo: ${reason}.`,
        `/admin/dashboard?tab=reports`
      )
    }

    // 4. Auto-flag content if it reaches 3 or more reports
    if (totalReports >= 3) {
      let updated = false

      if (targetType === "POST") {
        await prisma.post.update({
          where: { id: targetId },
          data: { isUnderReview: true, isActive: false }
        })
        updated = true
      } else if (targetType === "SERVICE") {
        await prisma.service.update({
          where: { id: targetId },
          data: { isUnderReview: true, isActive: false }
        })
        updated = true
      } else if (targetType === "SPACE") {
        await prisma.space.update({
          where: { id: targetId },
          data: { isUnderReview: true, isActive: false }
        })
        updated = true
      } else if (targetType === "JOB") {
        await prisma.jobPost.update({
          where: { id: targetId },
          data: { isUnderReview: true, isActive: false }
        })
        updated = true
      }

      if (updated) {
        // Send specific alert to admins
        for (const admin of admins) {
          await createNotification(
            admin.id,
            "CONTENT_UNDER_REVIEW",
            "Contenido en Revisión Automática",
            `El contenido (${targetType}) con ID ${targetId} acumuló ${totalReports} reportes y se marcó como 'En revisión'.`,
            `/admin/dashboard?tab=reports`
          )
        }
      }
    }

    return NextResponse.json({ success: true, data: report })
  } catch (error: any) {
    console.error("Error creating report:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
// creado por pato dev y askforvini
