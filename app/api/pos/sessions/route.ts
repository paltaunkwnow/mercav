import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorFields, getPosContext, getPosScope, posError, summarizeSales } from "@/lib/pos/server";
import { currencyDecimals, roundMoney } from "@/lib/pos/money";
import { checkPin, publicStaffSelect } from "@/lib/pos/staff";

// Voided sales never count toward the till: not in totals, not in expected cash.
async function findOpenSession(posConfigId: string) {
  return prisma.pOSCashSession.findFirst({
    where: { posConfigId, status: "OPEN" },
    include: {
      sales: { where: { status: { not: "VOIDED" } }, include: { payments: true } },
      staff: { select: publicStaffSelect },
    },
  });
}

export async function GET(req: Request) {
  const res = await getPosScope(req, "pos.sell");
  if (!res.ok) return res.response;
  // Sin caja configurada no hay caja abierta: la pantalla ya muestra "Configurá tu caja".
  const config = res.scope.config;
  if (!config) return NextResponse.json({ success: true, data: null });

  const session = await findOpenSession(config.id);
  if (!session) return NextResponse.json({ success: true, data: null });

  const summary = summarizeSales(session.sales, currencyDecimals(config.currency));
  const { sales, ...rest } = session;
  return NextResponse.json({
    success: true,
    data: {
      ...rest,
      summary: {
        ...summary,
        expectedCash: roundMoney(Number(session.openingAmount) + (summary.byMethod.CASH ?? 0), currencyDecimals(config.currency)),
      },
    },
  });
}

export async function POST(req: Request) {
  const ctx = await getPosContext(req, "pos.sell");
  if (!ctx.ok) return ctx.response;
  const { config } = ctx;

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 0) return posError("Monto inválido");

  if (action === "OPEN") {
    const existing = await findOpenSession(config.id);
    if (existing) return posError("Ya hay una caja abierta");
    // Owner opens without a PIN; staff members confirm theirs.
    let staffId: string | null = null;
    if (typeof body?.staffId === "string" && body.staffId) {
      const check = await checkPin(config.id, body?.pin, { staffId: body.staffId });
      if (!check.ok) return check.response;
      staffId = check.staff.id;
    }
    try {
      const openSession = await prisma.pOSCashSession.create({
        data: { posConfigId: config.id, openingAmount: amount, status: "OPEN", staffId, openedByUserId: actorFields(ctx) },
        include: { staff: { select: publicStaffSelect } },
      });
      return NextResponse.json({ success: true, data: openSession });
    } catch (error) {
      // Dos personas abriendo a la vez: el índice parcial deja una sola caja abierta.
      if ((error as { code?: string })?.code === "P2002") return posError("Ya hay una caja abierta", 409);
      throw error;
    }
  }

  if (action === "CLOSE") {
    const result = await prisma.$transaction(async (tx) => {
      const activeSession = await tx.pOSCashSession.findFirst({
        where: { posConfigId: config.id, status: "OPEN" },
        include: {
          sales: { where: { status: { not: "VOIDED" } }, include: { payments: true } },
        },
      });
      if (!activeSession) return { error: "No active session found", status: 404 };

      const decimals = currencyDecimals(config.currency);
      const summary = summarizeSales(activeSession.sales, decimals);
      const expected = roundMoney(Number(activeSession.openingAmount) + (summary.byMethod.CASH ?? 0), decimals);

      const closed = await tx.pOSCashSession.updateMany({
        where: { id: activeSession.id, status: "OPEN" },
        data: {
          closingAmount: amount,
          expectedAmount: expected,
          difference: roundMoney(amount - expected, decimals),
          salesByMethod: summary.byMethod,
          closedByUserId: actorFields(ctx),
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      if (closed.count === 0) return { error: "La caja ya fue cerrada por otro usuario", status: 409 };

      return { data: await tx.pOSCashSession.findUniqueOrThrow({ where: { id: activeSession.id } }) };
    });

    if (result.error) return posError(result.error, result.status);
    return NextResponse.json({ success: true, data: result.data });
  }

  return posError("Invalid action");
}
// creado por pato dev y askforvini
