import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

// Registros archivados antes del fix incluyen el User completo del dueño (hash de contraseña,
// secreto 2FA, NIT/CI). Se limpian al leer.
const SENSITIVE_KEYS = new Set(["password", "twoFactorSecret", "nit", "ci", "email"])
function scrub(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (depth > 0 && SENSITIVE_KEYS.has(k)) continue
    out[k] = scrub(v, depth + 1)
  }
  return out
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const history = await prisma.deletedContentHistory.findMany({
      include: {
        deletedBy: { select: { id: true, name: true, username: true } }
      },
      orderBy: { deletedAt: "desc" },
      take: 100
    })

    return NextResponse.json({
      success: true,
      data: history.map((h) => ({ ...h, contentData: scrub(h.contentData) })),
    })
  } catch (error: any) {
    console.error("Error fetching deleted content history:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
// creado por pato dev y askforvini
