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
      return new Response("No autorizado", { status: 403 })
    }

    // 1. Fetch tables data
    const users = await prisma.user.findMany()
    const posts = await prisma.post.findMany()
    const services = await prisma.service.findMany()
    const spaces = await prisma.space.findMany()
    const transactions = await prisma.transaction.findMany()
    const tickets = await prisma.ticket.findMany()
    const adminLogs = await prisma.adminLog.findMany()

    const backupData = {
      version: "2.6.5",
      timestamp: new Date().toISOString(),
      database: "mercav",
      tables: {
        users,
        posts,
        services,
        spaces,
        transactions,
        tickets,
        adminLogs
      }
    }

    // 2. Add audit event to AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: me.id,
        action: "MANUAL_DATABASE_BACKUP",
        details: "Respaldo manual completo de base de datos generado y descargado."
      }
    })

    const fileName = `backup_mercav_${new Date().toISOString().split('T')[0]}.json`

    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/json",
      }
    })
  } catch (error: any) {
    console.error("Backup system error:", error)
    return new Response(error.message || "Error interno", { status: 500 })
  }
}
