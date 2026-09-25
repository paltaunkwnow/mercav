import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const logs = await prisma.adminLog.findMany({
      include: {
        admin: { select: { id: true, name: true, username: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error: any) {
    console.error("Error fetching admin logs:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 })
  }
}
// creado por Patodev y Invertilo
