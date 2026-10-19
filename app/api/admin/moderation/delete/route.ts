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

    const { targetType, targetId, reason } = await req.json()

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ success: false, error: "El tipo de contenido, ID y razón son requeridos" }, { status: 400 })
    }

    let contentData: any = null
    let ownerUsername = "Desconocido"

    // 1. Fetch content from database and resolve owner
    // (solo campos públicos del dueño: antes se archivaba el User completo, con hash de contraseña
    // y secreto 2FA, dentro de DeletedContentHistory.contentData)
    if (targetType === "POST") {
      contentData = await prisma.post.findUnique({
        where: { id: targetId },
        include: { author: { select: { id: true, username: true, name: true } } }
      })
      if (contentData) ownerUsername = contentData.author.username
    } else if (targetType === "SERVICE") {
      contentData = await prisma.service.findUnique({
        where: { id: targetId },
        include: { provider: { select: { id: true, username: true, name: true } } }
      })
      if (contentData) ownerUsername = contentData.provider.username
    } else if (targetType === "SPACE") {
      contentData = await prisma.space.findUnique({
        where: { id: targetId },
        include: { owner: { select: { id: true, username: true, name: true } } }
      })
      if (contentData) ownerUsername = contentData.owner.username
    } else if (targetType === "JOB") {
      contentData = await prisma.jobPost.findUnique({
        where: { id: targetId },
        include: { company: { select: { id: true, username: true, name: true } } }
      })
      if (contentData) ownerUsername = contentData.company.username
    }

    if (!contentData) {
      return NextResponse.json({ success: false, error: "El contenido a eliminar no existe en la base de datos" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // 2. Save content in DeletedContentHistory
      await tx.deletedContentHistory.create({
        data: {
          contentType: targetType,
          contentId: targetId,
          contentOwner: ownerUsername,
          contentData: JSON.parse(JSON.stringify(contentData)),
          reason,
          deletedById: me.id
        }
      });

      // 3. Delete content permanently from table
      if (targetType === "POST") {
        await tx.post.delete({ where: { id: targetId } });
      } else if (targetType === "SERVICE") {
        await tx.service.delete({ where: { id: targetId } });
      } else if (targetType === "SPACE") {
        await tx.space.delete({ where: { id: targetId } });
      } else if (targetType === "JOB") {
        await tx.jobPost.delete({ where: { id: targetId } });
      }

      // 4. Resolve all related reports
      await tx.report.updateMany({
        where: { targetId, targetType },
        data: {
          status: "RESOLVED",
          resolvedBy: me.id,
          resolvedAt: new Date()
        }
      });

      // 5. Add Admin Log entry
      await tx.adminLog.create({
        data: {
          adminId: me.id,
          action: `DELETE_${targetType}`,
          details: `Contenido ${targetType} con ID ${targetId} de @${ownerUsername} eliminado permanentemente. Razón: ${reason}`
        }
      });
    });

    return NextResponse.json({ success: true, message: "Contenido eliminado y archivado con éxito" });
  } catch (error: any) {
    console.error("Content deletion error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
// creado por pato dev y askforvini
