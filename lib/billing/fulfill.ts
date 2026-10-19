import { Plan, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LEGACY_PLAN_CHARGES_USD, billingInterval, planChargeUsd, planPeriodEnd } from "@/lib/billing/plans";

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
      throw new Error(`[FULFILL] Pedido no encontrado para transacción ${stripeId}: ${orderId}`);
    }

    // 2) Mercav Pro (flujo /checkout?plan=PROFESSIONAL&interval=...)
    const planKey = str(metadata.plan).toUpperCase();
    if (planKey && userId) {
      const interval = billingInterval(str(metadata.interval));
      const paid = Number(transaction.amount);
      const matches = (expected: number | null | undefined) => expected != null && Math.abs(paid - expected) <= 0.01;
      const isPaidPlan = (Object.values(Plan) as string[]).includes(planKey) && planKey !== "FREE";
      // El monto cobrado tiene que corresponder al plan: evita activar un plan caro con un pago menor.
      // Se aceptan también los montos de antes del cambio para pagos que ya estaban iniciados.
      if (!isPaidPlan || !(matches(planChargeUsd(planKey, interval)) || matches(LEGACY_PLAN_CHARGES_USD[planKey]?.[interval]))) {
        console.error(`[FULFILL] Pago ${stripeId}: plan/monto inconsistentes (${planKey}, ${String(transaction.amount)})`);
        throw new Error(`[FULFILL] Inconsistencia en monto de suscripción para transacción ${stripeId} (${planKey})`);
      }

      // Si renueva con un plan pago todavía vigente, el período nuevo empieza cuando termina el actual.
      const now = new Date();
      const current = await tx.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } });
      const startDate = current && current.plan !== "FREE" && current.planExpiresAt && current.planExpiresAt > now ? current.planExpiresAt : now;
      const endDate = planPeriodEnd(startDate, interval);
      await tx.user.update({
        where: { id: userId },
        data: { plan: planKey as Plan, planExpiresAt: endDate },
      });
      await tx.subscription.create({
        data: {
          userId,
          plan: planKey as Plan,
          status: "ACTIVE",
          startDate,
          endDate,
          paymentId: stripeId,
        },
      });
      return { result: "fulfilled", transaction };
    }

    console.error(`[FULFILL] Pago ${stripeId} sin metadata reconocible; no se puede procesar.`);
    throw new Error(`[FULFILL] Transacción ${stripeId} carece de metadatos de cumplimiento reconocibles`);
  });
}
// creado por pato dev y askforvini
