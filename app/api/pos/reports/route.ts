import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user?.posConfig) return NextResponse.json({ success: false, error: "POS not configured" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "day"; // day, week, month

    let startDate, endDate;
    const now = new Date();

    if (range === "day") {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    } else if (range === "week") {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else if (range === "month") {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    }

    const prismaAny = prisma as any;
    const saleModel = prismaAny.posSale || prismaAny.pOSSale;
    const sessionModel = prismaAny.posCashSession || prismaAny.pOSCashSession;

    // Fetch sales for the range
    const sales = await saleModel.findMany({
      where: {
        posConfigId: user.posConfig.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Fetch sessions for the range with their sales
    const rawSessions = await sessionModel.findMany({
      where: {
        posConfigId: user.posConfig.id,
        openedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sales: {
          select: { totalAmount: true }
        }
      },
      orderBy: {
        openedAt: 'desc'
      }
    });

    // Map sessions to include real-time sales totals
    const sessions = rawSessions.map((session: any) => {
      const salesTotal = session.sales.reduce((acc: number, sale: any) => acc + Number(sale.totalAmount), 0);
      return {
        ...session,
        currentTotal: salesTotal,
        // Ensure closingBalance reflects real total if closed, or current if open
        displayTotal: session.status === 'CLOSED' ? Number(session.closingBalance || 0) : salesTotal
      };
    });

    // Calculate stats
    const totalRevenue = sales.reduce((acc: number, sale: any) => acc + Number(sale.totalAmount), 0);
    const totalOrders = sales.length;
    const totalDiscounts = sales.reduce((acc: number, sale: any) => acc + Number(sale.discountAmount), 0);

    // Calculate cost and profit
    let totalCost = 0;
    const productProfitabilityMap = new Map<string, {
      id: string;
      name: string;
      imageUrl: string | null;
      categoryName: string;
      quantitySold: number;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    sales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const prod = item.product;
        const prodId = item.productId || prod?.id || "unknown";
        const name = prod?.name || item.productName || "Producto";
        const imageUrl = prod?.imageUrl || null;
        const categoryName = prod?.category?.name || "General";
        const qty = item.quantity;
        const costPrice = Number(prod?.costPrice || 0);
        const itemCost = costPrice * qty;
        const itemRevenue = Number(item.subtotal);

        totalCost += itemCost;

        const existing = productProfitabilityMap.get(prodId);
        if (existing) {
          existing.quantitySold += qty;
          existing.revenue += itemRevenue;
          existing.cost += itemCost;
          existing.profit += (itemRevenue - itemCost);
        } else {
          productProfitabilityMap.set(prodId, {
            id: prodId,
            name,
            imageUrl,
            categoryName,
            quantitySold: qty,
            revenue: itemRevenue,
            cost: itemCost,
            profit: (itemRevenue - itemCost)
          });
        }
      });
    });

    const totalProfit = totalRevenue - totalCost;

    const productProfitability = Array.from(productProfitabilityMap.values()).map(p => {
      const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
      return { ...p, margin };
    }).sort((a, b) => b.profit - a.profit);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalDiscounts,
        totalCost,
        totalProfit,
        averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      sales,
      sessions,
      productProfitability,
      config: user.posConfig
    });

  } catch (error: any) {
    console.error("POS_REPORTS_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
