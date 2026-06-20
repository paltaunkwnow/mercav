import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const currency = body.currency || 'usd';
    const metadata = body.metadata || {};

    if (!amount || amount < 0.5) {
      return new NextResponse('El monto debe ser al menos $0.50', { status: 400 });
    }

    // Create PaymentIntent in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      metadata: {
        ...metadata,
        userId: (session.user as any).id,
      },
      payment_method_types: ['card'],
    });

    // Save transaction in database as PENDING
    await prisma.transaction.create({
      data: {
        stripeId: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'PENDING',
        userId: (session.user as any).id,
        metadata: metadata,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('[STRIPE_CREATE_INTENT]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
