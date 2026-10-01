import { Plan, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { planChargeUsd } from "@/lib/billing/plans";

/**
 * Cumplimiento de un pago de Stripe, compartido por el webhook y la página de confirmación.
 *
 * - Idempotente: el paso PENDING -> PAID es un update condicional dentro de una transacción;
 *   si dos procesos llegan a la vez, solo uno lo "reclama" y el otro ve count = 0.
 * - Todo (marcar pagado + confirmar pedido/reserva/plan) ocurre en la misma transacción:
 *   si algo falla se revierte y el webhook devuelve 500 para que Stripe reintente.
 * - Solo confía en la metadata guardada en NUESTRA base (escrita por el servidor), nunca en
 *   la metadata del PaymentIntent ni en datos del cliente.
 */
export type FulfillResult = "fulfilled" | "already_processed" | "not_found";

const DAY_MS = 24 * 60 * 60 * 1000;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function fulfillPaidTransaction(stripeId: string): Promise<{ result: FulfillResult; transaction?: { amount: Prisma.Decimal; userId: string | null } }> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.transaction.updateMany({
      where: { stripeId, status: "PENDING" },
      data: { status: "PAID" },
    });

    if (claimed.count === 0) {
      const exists = await tx.transaction.findUnique({ where: { stripeId }, select: { id: true } });
      return { result: exists ? "already_processed" : "not_found" };
    }

    const transaction = await tx.transaction.findUniqueOrThrow({ where: { stripeId } });
    const metadata = (transaction.metadata && typeof transaction.metadata === "object" && !Array.isArray(transaction.metadata)
      ? transaction.metadata
      : {}) as Record<string, unknown>;
    const userId = transaction.userId;

    // 1) Pedido de servicio o reserva creados antes del pago (flujo /checkout/[type]/[id]).
    //    `reservationId` lo usa el flujo /checkout?reservationId=...
    const orderId = str(metadata.orderId) || str(metadata.reservationId);
    if (orderId && userId) {
      const order = await tx.serviceOrder.findUnique({
        where: { id: orderId },
        select: { id: true, clientId: true },
      });
      if (order) {
        if (order.clientId !== userId) throw new Error(`Pedido ${orderId} no pertenece al pagador`);
        // Condicional: no "revivir" pedidos cancelados/terminados
        await tx.serviceOrder.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "IN_PROGRESS" },
        });
        if (!transaction.orderId) {
          await tx.transaction.update({ where: { id: transaction.id }, data: { orderId } });
        }
        return { result: "fulfilled", transaction };
      }

      const reservation = await tx.reservation.findUnique({
        where: { id: orderId },
        select: { id: true, advertiserId: true },
      });
      if (reservation) {
        if (reservation.advertiserId !== userId) throw new Error(`Reserva ${orderId} no pertenece al pagador`);
        await tx.reservation.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CONFIRMED", paymentId: stripeId },
        });
        return { result: "fulfilled", transaction };
      }

      console.error(`[FULFILL] Pago ${stripeId} referencia un pedido inexistente: ${orderId}`);
      return { result: "fulfilled", transaction };
    }

    // 2) Mejora de plan (flujo /checkout?plan=...)
    const planKey = str(metadata.plan).toUpperCase();
    if (planKey && userId) {
      const interval = str(metadata.interval) === "annual" ? "annual" : "monthly";
      const expected = planChargeUsd(planKey, interval);
      const isPaidPlan = (Object.values(Plan) as string[]).includes(planKey) && planKey !== "FREE";
      // El monto cobrado tiene que corresponder al plan: evita activar un plan caro con un pago menor
      if (!isPaidPlan || expected == null || Math.abs(Number(transaction.amount) - expected) > 0.01) {
        console.error(`[FULFILL] Pago ${stripeId}: plan/monto inconsistentes (${planKey}, ${String(transaction.amount)})`);
        return { result: "fulfilled", transaction };
      }

      const endDate = new Date(Date.now() + (interval === "annual" ? 365 : 30) * DAY_MS);
      await tx.user.update({
        where: { id: userId },
        data: { plan: planKey as Plan, planExpiresAt: endDate },
      });
      await tx.subscription.create({
        data: {
          userId,
          plan: planKey as Plan,
          status: "ACTIVE",
          startDate: new Date(),
          endDate,
          paymentId: stripeId,
        },
      });
      return { result: "fulfilled", transaction };
    }

    console.warn(`[FULFILL] Pago ${stripeId} sin metadata reconocible; marcado como pagado sin cumplimiento.`);
    return { result: "fulfilled", transaction };
  });
}
// creado por pato dev y askforvini
