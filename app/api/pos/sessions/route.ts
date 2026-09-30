import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError, summarizeSales } from "@/lib/pos/server";
import { currencyDecimals, roundMoney } from "@/lib/pos/money";

async function findOpenSession(posConfigId: string) {
  return prisma.pOSCashSession.findFirst({
    where: { posConfigId, status: "OPEN" },
    include: { sales: { include: { payments: true } } },
  });
}

export async function GET() {
  const ctx = await getPosContext();
  if (!ctx.ok) return ctx.response;

  const session = await findOpenSession(ctx.config.id);
  if (!session) return NextResponse.json({ success: true, data: null });

  const summary = summarizeSales(session.sales, currencyDecimals(ctx.config.currency));
  const { sales, ...rest } = session;
  return NextResponse.json({
    success: true,
    data: {
      ...rest,
      summary: {
        ...summary,
        expectedCash: roundMoney(Number(session.openingAmount) + (summary.byMethod.CASH ?? 0), currencyDecimals(ctx.config.currency)),
      },
    },
  });
}

export async function POST(req: Request) {
  const ctx = await getPosContext();
  if (!ctx.ok) return ctx.response;
  const { config } = ctx;

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 0) return posError("Monto inválido");

  if (action === "OPEN") {
    const existing = await findOpenSession(config.id);
    if (existing) return posError("Ya hay una caja abierta");
    const openSession = await prisma.pOSCashSession.create({
      data: { posConfigId: config.id, openingAmount: amount, status: "OPEN" },
    });
    return NextResponse.json({ success: true, data: openSession });
  }

  if (action === "CLOSE") {
    const activeSession = await findOpenSession(config.id);
    if (!activeSession) return posError("No active session found");

    const decimals = currencyDecimals(config.currency);
    const summary = summarizeSales(activeSession.sales, decimals);
    const expected = roundMoney(Number(activeSession.openingAmount) + (summary.byMethod.CASH ?? 0), decimals);

    const closedSession = await prisma.pOSCashSession.update({
      where: { id: activeSession.id },
      data: {
        closingAmount: amount,
        expectedAmount: expected,
        difference: roundMoney(amount - expected, decimals),
        salesByMethod: summary.byMethod,
        status: "CLOSED",
        closedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, data: closedSession });
  }

  return posError("Invalid action");
}
// creado por pato dev y askforvini
