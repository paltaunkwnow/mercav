/**
 * Utilidades para la liberación de fondos por milestone
 *
 * Esta librería maneja la lógica de liberación automática de fondos cuando
 * un cliente aprueba un milestone completado por el freelancer.
 *
 * Flujo:
 * 1. Freelancer marca milestone como COMPLETED
 * 2. Cliente aprueba y libera fondos
 * 3. Se crea una transacción registrando la liberación
 * 4. Los administradores pueden procesar payouts a través de:
 *    - Stripe Connected Accounts (cuenta bancaria del freelancer)
 *    - Sistema de payout manual
 *    - API de transferencias de Stripe
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * Obtiene milestones pendientes de pagar para un freelancer
 */
export async function getPendingMilestonePayouts(providerId: string) {
  const milestones = await prisma.milestone.findMany({
    where: {
      released: true,
      order: {
        service: {
          providerId,
        },
      },
    },
    include: {
      order: {
        select: {
          id: true,
          service: { select: { title: true } },
        },
      },
    },
    orderBy: { approvedAt: "desc" },
  });

  return milestones;
}

/**
 * Obtiene todas las transacciones de liberación de fondos por milestone
 * (útil para panel de administración)
 */
export async function getMilestoneReleaseTransactions(
  limit: number = 50,
  offset: number = 0
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      metadata: {
        path: ["type"],
        equals: "milestone_release",
      },
    },
    include: {
      order: {
        select: {
          id: true,
          service: { select: { title: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return transactions;
}

/**
 * Calcula el total de fondos pendientes por pagar a un freelancer
 */
export async function getTotalPendingPayout(providerId: string): Promise<Prisma.Decimal> {
  const result = await prisma.milestone.aggregate({
    where: {
      released: true,
      order: {
        service: {
          providerId,
        },
      },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount || new Prisma.Decimal(0);
}

/**
 * Futuro: Procesador de payouts via Stripe
 *
 * Cuando Stripe Connected Accounts esté configurado:
 * 1. Cada freelancer tendrá una cuenta de Stripe connected
 * 2. Los fondos se transferirán automáticamente a su cuenta
 * 3. El stripe_id del freelancer se guardará en el modelo User
 *
 * export async function processStripeTransfer(
 *   stripeConnectedAccountId: string,
 *   amountCents: number,
 *   metadata: Record<string, string>
 * ) {
 *   return stripe.transfers.create({
 *     amount: amountCents,
 *     currency: "usd",
 *     destination: stripeConnectedAccountId,
 *     metadata,
 *   });
 * }
 */
