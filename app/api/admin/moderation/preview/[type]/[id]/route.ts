import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

export async function GET(
  req: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { type, id } = params
    let content: any = null

    if (type === "POST") {
      content = await prisma.post.findUnique({
        where: { id },
        include: { author: { select: { name: true, username: true, avatar: true } } }
      })
    } else if (type === "SERVICE") {
      content = await prisma.service.findUnique({
        where: { id },
        include: {
          provider: { select: { name: true, username: true, avatar: true } },
          packages: { take: 1, select: { price: true } }
        }
      })
    } else if (type === "SPACE") {
      content = await prisma.space.findUnique({
        where: { id },
        include: {
          owner: { select: { name: true, username: true, avatar: true } },
          images: { take: 1, select: { url: true } }
        }
      })
    } else if (type === "JOB") {
      content = await prisma.jobPost.findUnique({
        where: { id },
        include: { company: { select: { name: true, username: true, avatar: true } } }
      })
    }

    if (!content) {
      return NextResponse.json({ success: false, error: "Contenido no encontrado (ya podría haber sido eliminado)" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: content })
  } catch (error: any) {
    console.error("Error previewing reported content:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 })
  }
}
// creado por Patodev y Invertilo
