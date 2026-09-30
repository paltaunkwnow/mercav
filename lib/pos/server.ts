import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { POSConfig } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roundMoney } from "./money";

type PosContext =
  | { ok: true; userId: string; config: POSConfig }
  | { ok: false; response: NextResponse };

export function posError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function getPosContext(): Promise<PosContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, response: posError("Unauthorized", 401) };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { posConfig: true },
  });
  if (!user?.posConfig) return { ok: false, response: posError("POS not configured") };
  return { ok: true, userId: user.id, config: user.posConfig };
}

interface SaleForSummary {
  totalAmount: unknown;
  payments?: { method: string; amount: unknown }[];
}

export function summarizeSales(sales: SaleForSummary[], decimals = 2) {
  const byMethod: Record<string, number> = {};
  let total = 0;
  for (const sale of sales) {
    total += Number(sale.totalAmount);
    const payments = sale.payments?.length ? sale.payments : [{ method: "CASH", amount: sale.totalAmount }];
    for (const p of payments) byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
  }
  for (const k of Object.keys(byMethod)) byMethod[k] = roundMoney(byMethod[k], decimals);
  return { total: roundMoney(total, decimals), count: sales.length, byMethod };
}
