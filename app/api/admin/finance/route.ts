import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
    if (!me || !(await isAdminUser(me.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    // 1. Escrow Transactions (Service orders paid but not yet completed/cancelled)
    const escrowOrders = await prisma.serviceOrder.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS", "IN_REVIEW", "REVISION"] }
      },
      include: {
        client: { select: { id: true, name: true, username: true, email: true } },
        service: {
          include: {
            provider: { select: { id: true, name: true, username: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // 2. Disputed Orders (Service orders in DISPUTED state)
    const disputedOrders = await prisma.serviceOrder.findMany({
      where: { status: "DISPUTED" },
      include: {
        client: { select: { id: true, name: true, username: true, email: true } },
        service: {
          include: {
            provider: { select: { id: true, name: true, username: true, email: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    // 3. Paid Transactions (For manual refunds list)
    const transactions = await prisma.transaction.findMany({
      where: { status: { in: ["PAID", "REFUNDED"] } },
      include: {
        user: { select: { id: true, name: true, username: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    // 4. Commission stats by module
    // Ads: Sum of advertiserFee + ownerFee from Reservations
    const reservations = await prisma.reservation.findMany({
      select: { advertiserFee: true, ownerFee: true }
    })
    const adsCommissions = reservations.reduce((sum, res) => sum + Number(res.advertiserFee || 0) + Number(res.ownerFee || 0), 0)

    // Services: Sum of platformFee from Completed Service Orders
    const completedServiceOrders = await prisma.serviceOrder.findMany({
      where: { status: "COMPLETED" },
      select: { platformFee: true }
    })
    const servicesCommissions = completedServiceOrders.reduce((sum, order) => sum + Number(order.platformFee || 0), 0)

    // Jobs: Subscription revenue from ELITE / EMPRESA plans
    const jobSubscriptions = await prisma.subscription.findMany({
      where: {
        plan: { in: ["EMPRESA", "ELITE"] },
        status: "ACTIVE"
      },
      select: { plan: true }
    })
    
    // Fictional pricing values for plan commissions in system
    const planPrices: Record<string, number> = { EMPRESA: 99.99, ELITE: 299.99 }
    const jobsCommissions = jobSubscriptions.reduce((sum, sub) => sum + (planPrices[sub.plan as string] || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        escrowOrders,
        disputedOrders,
        transactions,
        commissions: {
          ads: adsCommissions,
          services: servicesCommissions,
          jobs: jobsCommissions,
          total: adsCommissions + servicesCommissions + jobsCommissions
        }
      }
    })
  } catch (error: any) {
    console.error("Admin finance endpoint error:", error)
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 })
  }
}
// creado por Patodev y Invertilo
