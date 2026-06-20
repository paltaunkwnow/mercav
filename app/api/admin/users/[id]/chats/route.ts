import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const userId = params.id
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // Fetch all conversations involving the target user
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: userId } }
      },
      include: {
        participants: { select: { id: true, name: true, username: true, avatar: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, username: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    // Log the inspection in AdminLog to prevent administrative abuse
    await prisma.adminLog.create({
      data: {
        adminId: me.id,
        action: "INSPECT_USER_CHATS",
        details: `Inspección de auditoría de chats del usuario @${targetUser.username} (ID: ${userId})`
      }
    })

    return NextResponse.json({ success: true, data: conversations })
  } catch (error: any) {
    console.error("Error inspecting user chats:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 })
  }
}
