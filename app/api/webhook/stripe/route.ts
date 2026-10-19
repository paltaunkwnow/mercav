import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { fulfillPaidTransaction } from '@/lib/billing/fulfill';

export async function POST(req: Request) {
  // Cuerpo crudo: la firma se calcula sobre los bytes exactos
  const body = await req.text();
  const signature = headers().get('Stripe-Signature');

  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[STRIPE_WEBHOOK_CONFIG_ERROR] Falta STRIPE_WEBHOOK_SECRET');
    return new NextResponse('Server Configuration Error', { status: 500 });
  }

  if (!signature) {
    return new NextResponse('Falta la cabecera Stripe-Signature', { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error(`[STRIPE_WEBHOOK_ERROR]: ${error?.message}`);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Idempotente: si la página de confirmación ya lo procesó, devuelve already_processed.
      const { result, transaction } = await fulfillPaidTransaction(paymentIntent.id);

      if (result === 'fulfilled' && transaction && Number(transaction.amount) >= 500) {
        // Avisar a los admins de transacciones grandes (>= 500 USD); no bloquea el webhook
        try {
          const admins = await prisma.user.findMany({
            where: { roles: { some: { role: 'ADMIN' } } },
            select: { id: true },
          });
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: 'LARGE_TRANSACTION',
              title: 'Transacción Grande Detectada',
              body: `Se ha procesado una transacción de $${Number(transaction.amount)} USD por el usuario con ID ${transaction.userId || 'N/A'}.`,
              link: '/admin/dashboard?tab=overview',
              isRead: false,
            })),
          });
        } catch (e) {
          console.error('Error creating large transaction notification:', e);
        }
      }
    } catch (error: any) {
      // Antes este error se tragaba y se respondía 200: el pago quedaba cobrado sin cumplir.
      // Ahora la transacción se revierte y devolvemos 500 para que Stripe reintente.
      console.error(`[STRIPE_WEBHOOK] Error procesando ${paymentIntent.id}:`, error?.message);
      return new NextResponse('Error procesando el pago', { status: 500 });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    // updateMany condicional: no falla si la transacción no existe y no pisa un pago ya acreditado
    await prisma.transaction.updateMany({
      where: { stripeId: paymentIntent.id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
  }

  return new NextResponse(null, { status: 200 });
}
// creado por pato dev y askforvini
