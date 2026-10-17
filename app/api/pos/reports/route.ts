import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPosContext, summarizeSales } from "@/lib/pos/server";
import { currencyDecimals } from "@/lib/pos/money";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const ctx = await getPosContext(req, "pos.reports");
    if (!ctx.ok) return ctx.response;
    const posConfigId = ctx.config.id;

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

    // Fetch sales for the range (voided ones are listed, but never counted)
    const allSales = await saleModel.findMany({
      where: {
        posConfigId: posConfigId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: { include: { category: true } }
          }
        },
        payments: true,
        staff: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const sales = allSales.filter((sale: any) => sale.status !== 'VOIDED');

    // Fetch sessions for the range with their sales
    const rawSessions = await sessionModel.findMany({
      where: {
        posConfigId: posConfigId,
        openedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sales: {
          where: { status: { not: 'VOIDED' } },
          select: { totalAmount: true }
        },
        staff: { select: { id: true, name: true, role: true } }
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
        displayTotal: salesTotal
      };
    });

    // Calculate stats
    const totalRevenue = sales.reduce((acc: number, sale: any) => acc + Number(sale.totalAmount), 0);
    const totalOrders = sales.length;
    const totalDiscounts = sales.reduce((acc: number, sale: any) => acc + Number(sale.discountAmount), 0);
    const totalTax = sales.reduce((acc: number, sale: any) => acc + Number(sale.taxAmount || 0), 0);
    const { byMethod } = summarizeSales(sales, currencyDecimals(ctx.config.currency));

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
        const name = item.productName || prod?.name || "Producto";
        const imageUrl = prod?.imageUrl || null;
        const categoryName = prod?.category?.name || "General";
        const qty = Number(item.quantity);
        const costPrice = item.unitCostPrice == null ? null : Number(item.unitCostPrice);
        const itemCost = costPrice == null ? 0 : costPrice * qty;
        const itemRevenue = Number(item.subtotal) - (ctx.config!.pricesIncludeTax ? Number(item.taxAmount || 0) : 0);

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

    const totalProfit = totalRevenue - totalTax - totalCost;

    const productProfitability = Array.from(productProfitabilityMap.values()).map(p => {
      const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
      return { ...p, margin };
    }).sort((a, b) => b.profit - a.profit);

    // Low stock: products that track stock and dropped to or below their own minimum
    const tracked = await prisma.pOSProduct.findMany({
      where: { posConfigId: posConfigId, isActive: true, trackStock: true, minStock: { not: null } },
      select: { id: true, name: true, stock: true, minStock: true, unit: true, imageUrl: true },
      orderBy: { name: 'asc' }
    });
    const lowStock = tracked.filter((p) => Number(p.stock) <= Number(p.minStock));

    // Caja de empresa: ventas por persona y quién abrió y cerró cada caja (con su cuenta Mercav).
    let sellers: { userId: string; name: string; orders: number; revenue: number }[] = [];
    let sessionsOut = sessions;
    if (ctx.workspaceId) {
      const ids = new Set<string>();
      for (const sale of sales as { sellerUserId?: string | null }[]) if (sale.sellerUserId) ids.add(sale.sellerUserId);
      for (const session of rawSessions as { openedByUserId?: string | null; closedByUserId?: string | null }[]) {
        if (session.openedByUserId) ids.add(session.openedByUserId);
        if (session.closedByUserId) ids.add(session.closedByUserId);
      }
      const people = ids.size ? await prisma.user.findMany({ where: { id: { in: Array.from(ids) } }, select: { id: true, name: true, username: true } }) : [];
      const nameOf = new Map(people.map((p) => [p.id, p.name || p.username || "Sin nombre"]));
      const bySeller = new Map<string, { userId: string; name: string; orders: number; revenue: number }>();
      for (const sale of sales as { sellerUserId?: string | null; totalAmount: unknown }[]) {
        if (!sale.sellerUserId) continue;
        const row = bySeller.get(sale.sellerUserId) ?? { userId: sale.sellerUserId, name: nameOf.get(sale.sellerUserId) ?? "Sin nombre", orders: 0, revenue: 0 };
        row.orders += 1;
        row.revenue += Number(sale.totalAmount);
        bySeller.set(sale.sellerUserId, row);
      }
      sellers = Array.from(bySeller.values()).sort((a, b) => b.revenue - a.revenue);
      sessionsOut = sessions.map((session: { openedByUserId?: string | null; closedByUserId?: string | null }) => ({
        ...session,
        openedByName: session.openedByUserId ? nameOf.get(session.openedByUserId) ?? null : null,
        closedByName: session.closedByUserId ? nameOf.get(session.closedByUserId) ?? null : null,
      }));
    }

    return NextResponse.json({
      success: true,
      sellers,
      stats: {
        totalRevenue,
        totalOrders,
        totalDiscounts,
        totalCost,
        totalProfit,
        totalTax,
        byMethod,
        averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      sales: allSales,
      sessions: sessionsOut,
      lowStock,
      productProfitability,
      config: ctx.config
    });

  } catch (error: any) {
    console.error("POS_REPORTS_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
