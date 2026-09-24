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
    const currency = typeof body.currency === "string" && body.currency.length === 3 ? body.currency.toLowerCase() : "usd";
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const userId = (session.user as { id?: string }).id;
    const orderId = typeof metadata.orderId === "string" ? metadata.orderId : "";
    if (!orderId || !userId) {
      return new NextResponse("Pedido no verificable", { status: 400 });
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: { totalPrice: true, clientId: true },
    });
    const reservation = order
      ? null
      : await prisma.reservation.findUnique({
          where: { id: orderId },
          select: { totalPrice: true, advertiserId: true },
        });
    const owned =
      (order && order.clientId === userId) || (reservation && reservation.advertiserId === userId);
    if (!owned) {
      return new NextResponse("No autorizado para este pedido", { status: 403 });
    }

    const amount = Number(order?.totalPrice ?? reservation?.totalPrice);
    if (!Number.isFinite(amount) || amount < 0.5 || amount > 100_000) {
      return new NextResponse("Monto del pedido inválido", { status: 400 });
    }

    const safeMetadata = {
      type: typeof metadata.type === "string" ? metadata.type.slice(0, 40) : "",
      id: typeof metadata.id === "string" ? metadata.id.slice(0, 80) : "",
      orderId,
      userId,
    };

    // Create PaymentIntent in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      metadata: safeMetadata,
      payment_method_types: ['card'],
    });

    // Save transaction in database as PENDING
    await prisma.transaction.create({
      data: {
        stripeId: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'PENDING',
        userId,
        metadata: safeMetadata,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('[STRIPE_CREATE_INTENT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
