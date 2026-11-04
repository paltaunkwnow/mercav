import { NextResponse } from "next/server";
import { apiBusiness } from "@/lib/business/context";
import { prisma } from "@/lib/prisma";
import { subDays, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const result = await apiBusiness(params.slug, "pos.reports");
  if ("error" in result) return result.error;
  const { ctx } = result;

  // Get the POSConfig for this business
  const posConfig = await prisma.pOSConfig.findUnique({
    where: { workspaceId: ctx.workspace.id },
  });

  if (!posConfig) {
    return NextResponse.json({
      success: true,
      data: {
        currentMonth: {
          totalSales: 0,
          averageMargin: 0,
          uniqueCustomers: 0,
          growthPercent: 0,
        },
        salesLast30Days: [],
        topProducts: [],
      },
    });
  }

  // Get query parameters for date filtering
  const searchParams = new URL(req.url).searchParams;
  const period = searchParams.get("period") || "month"; // month, quarter, year
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;

  // Determine date range based on period
  let startDate: Date;
  let endDate: Date;

  if (period === "month") {
    startDate = startOfMonth(new Date(year, month - 1));
    endDate = endOfMonth(new Date(year, month - 1));
  } else if (period === "quarter") {
    const quarterMonth = (Math.ceil(month / 3) - 1) * 3;
    startDate = startOfMonth(new Date(year, quarterMonth));
    endDate = endOfMonth(new Date(year, quarterMonth + 2));
  } else if (period === "year") {
    startDate = startOfMonth(new Date(year, 0));
    endDate = endOfMonth(new Date(year, 11));
  } else {
    startDate = startOfMonth(new Date());
    endDate = endOfMonth(new Date());
  }

  // Get previous period dates for comparison
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevStartDate = subDays(startDate, periodDays);
  const prevEndDate = subDays(startDate, 1);

  // Get current period sales
  const currentSales = await prisma.pOSSale.findMany({
    where: {
      posConfigId: posConfig.id,
      status: "COMPLETED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Get previous period sales for comparison
  const prevSales = await prisma.pOSSale.findMany({
    where: {
      posConfigId: posConfig.id,
      status: "COMPLETED",
      createdAt: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    },
    include: {
      items: true,
    },
  });

  // Get last 30 days of sales for chart
  const last30DaysStart = subDays(new Date(), 29);
  const last30DaysStart00 = new Date(last30DaysStart.getFullYear(), last30DaysStart.getMonth(), last30DaysStart.getDate());

  const salesLast30Days = await prisma.pOSSale.findMany({
    where: {
      posConfigId: posConfig.id,
      status: "COMPLETED",
      createdAt: {
        gte: last30DaysStart00,
      },
    },
    include: {
      items: true,
    },
  });

  // Calculate metrics
  const totalSalesAmount = currentSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const prevTotalSalesAmount = prevSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  // Calculate unique customers (by clientNit or clientName)
  const uniqueCustomers = new Set(
    currentSales
      .filter((s) => s.clientNit || s.clientName)
      .map((s) => s.clientNit || s.clientName)
  ).size;

  // Calculate average margin
  let totalMargin = 0;
  let itemsWithCost = 0;

  currentSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const revenue = Number(item.subtotal);
      const cost = Number(item.unitCostPrice || 0) * Number(item.quantity);
      if (cost > 0) {
        const margin = ((revenue - cost) / revenue) * 100;
        totalMargin += margin;
        itemsWithCost++;
      }
    });
  });

  const averageMargin = itemsWithCost > 0 ? totalMargin / itemsWithCost : 0;

  // Calculate growth percentage
  const growthPercent = prevTotalSalesAmount > 0 ? ((totalSalesAmount - prevTotalSalesAmount) / prevTotalSalesAmount) * 100 : 0;

  // Group sales by day for the 30-day chart
  const salesByDay: { [key: string]: number } = {};
  const salesByDayDate: { [key: string]: Date } = {};

  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = date.toISOString().split("T")[0];
    salesByDay[dateStr] = 0;
    salesByDayDate[dateStr] = date;
  }

  salesLast30Days.forEach((sale) => {
    const dateStr = sale.createdAt.toISOString().split("T")[0];
    if (salesByDay.hasOwnProperty(dateStr)) {
      salesByDay[dateStr] += Number(sale.totalAmount);
    }
  });

  const salesLast30DaysFormatted = Object.keys(salesByDay)
    .sort()
    .map((dateStr) => ({
      date: dateStr,
      sales: Math.round(salesByDay[dateStr] * 100) / 100,
    }));

  // Get top 5 products by quantity sold in current period
  const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

  currentSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const productName = item.productName || `Producto ${item.productId.substring(0, 8)}`;
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].quantity += Number(item.quantity);
      productSales[item.productId].revenue += Number(item.subtotal);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      name: p.name.substring(0, 20), // Truncate long names
      quantity: Math.round(p.quantity * 100) / 100,
      revenue: Math.round(p.revenue * 100) / 100,
    }));

  return NextResponse.json({
    success: true,
    data: {
      currentMonth: {
        totalSales: Math.round(totalSalesAmount * 100) / 100,
        averageMargin: Math.round(averageMargin * 100) / 100,
        uniqueCustomers,
        growthPercent: Math.round(growthPercent * 100) / 100,
      },
      salesLast30Days: salesLast30DaysFormatted,
      topProducts,
    },
  });
}
