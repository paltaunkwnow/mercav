import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.text(); // Use req.text() as requested
  const signature = headers().get('Stripe-Signature') as string;

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error(`[STRIPE_WEBHOOK_ERROR]: ${error.message}`);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntentId = session.id;

    try {
      // 1. Update transaction to PAID. Use a where clause to ensure we only process it once.
      // If result is null, it means it was already processed (or doesn't exist).
      const transaction = await prisma.transaction.update({
        where: { 
          stripeId: paymentIntentId,
          status: 'PENDING' 
        },
        data: {
          status: 'PAID',
        },
      });
      
      if (transaction) {
        console.log(`Transaction ${paymentIntentId} updated to PAID by Webhook`);
        
        // Notify admin if it's a large transaction (>= 500 USD)
        if (Number(transaction.amount) >= 500) {
          try {
            const admins = await prisma.user.findMany({
              where: { roles: { some: { role: "ADMIN" } } }
            });
            for (const admin of admins) {
              await prisma.notification.create({
                data: {
                  userId: admin.id,
                  type: "LARGE_TRANSACTION",
                  title: "Transacción Grande Detectada",
                  body: `Se ha procesado una transacción de $${Number(transaction.amount)} USD por el usuario con ID ${transaction.userId || "N/A"}.`,
                  link: "/admin/dashboard?tab=overview",
                  isRead: false
                }
              });
            }
          } catch (e) {
            console.error("Error creating large transaction notification:", e);
          }
        }
        
        // 2. Create the order/reservation or upgrade plan based on metadata
        const metadata = transaction.metadata as any;
        if (!metadata) return;

        if (metadata.type && metadata.id) {
          if (metadata.type === 'service') {
            const { calculateServicesCommission } = await import('@/lib/commissions');
            const svcPackage = await prisma.servicePackage.findUnique({ where: { id: metadata.packageId } });
            const service = await prisma.service.findUnique({ where: { id: metadata.id } });
            
            if (svcPackage && service) {
              const pricing = calculateServicesCommission(Number(svcPackage.price));
              
              if (metadata.orderId) {
                // Update existing order
                await prisma.serviceOrder.update({
                  where: { id: metadata.orderId },
                  data: {
                    status: "IN_PROGRESS",
                    briefing: metadata.briefing || "Pago confirmado vía Webhook"
                  }
                });
                console.log(`Service Order ${metadata.orderId} updated to IN_PROGRESS`);
              } else {
                // Legacy: Create new order if no ID provided
                await prisma.serviceOrder.create({
                  data: {
                    serviceId: service.id,
                    packageId: svcPackage.id,
                    clientId: transaction.userId!,
                    providerId: service.providerId,
                    status: "IN_PROGRESS",
                    totalPrice: pricing.totalPrice,
                    platformFee: pricing.platformFee,
                    providerPayout: pricing.providerPayout,
                    briefing: "Pago procesado automáticamente vía Webhook (Legacy)"
                  }
                });
                console.log(`New Service Order created (Legacy) for transaction ${paymentIntentId}`);
              }
            }
          } else if (metadata.type === 'anuncio' || metadata.type === 'space') {
            const space = await prisma.space.findUnique({ where: { id: metadata.id } });
            
            if (space) {
              if (metadata.orderId) {
                // Update existing reservation
                await prisma.reservation.update({
                  where: { id: metadata.orderId },
                  data: {
                    status: "CONFIRMED",
                    briefing: metadata.briefing || "Reserva confirmada vía Webhook"
                  }
                });
                console.log(`Reservation ${metadata.orderId} updated to CONFIRMED`);
              } else {
                const { calculateAdsCommission } = await import('@/lib/commissions');
                const pricing = calculateAdsCommission(Number(transaction.amount), space.isFirstRentalFree);
                // Legacy: Create new reservation
                await prisma.reservation.create({
                  data: {
                    spaceId: space.id,
                    advertiserId: transaction.userId!,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    basePrice: pricing.basePrice,
                    advertiserFee: pricing.advertiserFee,
                    ownerFee: pricing.ownerFee,
                    totalPrice: pricing.totalPrice,
                    isFirstRentalFree: space.isFirstRentalFree,
                    status: "CONFIRMED",
                    briefing: "Reserva procesada automáticamente vía Webhook (Legacy)"
                  }
                });
                console.log(`New Reservation created (Legacy) for transaction ${paymentIntentId}`);
              }
            }
          }
        }
 else if (metadata.plan) {
          // 3. Handle Plan Upgrades
          await prisma.user.update({
            where: { id: transaction.userId! },
            data: { 
              plan: metadata.plan as any,
              planExpiresAt: metadata.interval === 'annual' 
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          });
          
          // 4. Create subscription record
          await prisma.subscription.create({
            data: {
              userId: transaction.userId!,
              plan: metadata.plan as any,
              status: "ACTIVE",
              startDate: new Date(),
              endDate: metadata.interval === 'annual' 
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentId: paymentIntentId
            }
          });
          console.log(`Plan ${metadata.plan} activated for user ${transaction.userId}`);
        }
      }
      // It's possible the transaction was already updated by the confirmation page.
      // That's fine, we just skip order creation.
    } catch (error: any) {
      console.log(`Transaction ${paymentIntentId} already processed or error:`, error?.message);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntentId = session.id;
    await prisma.transaction.update({
      where: { stripeId: paymentIntentId },
      data: {
        status: 'FAILED',
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
// creado por pato dev y askforvini
