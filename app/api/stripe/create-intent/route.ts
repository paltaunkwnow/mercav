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
    // Los precios de pedidos/reservas están en USD: aceptar otra moneda del cliente cambiaba el valor
    // cobrado (p. ej. 10 USD -> 10 JPY).
    const currency = "usd";
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const userId = (session.user as { id?: string }).id;
    const orderId = typeof metadata.orderId === "string" ? metadata.orderId : "";
    if (!orderId || !userId) {
      return new NextResponse("Pedido no verificable", { status: 400 });
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: { totalPrice: true, clientId: true, status: true, serviceId: true },
    });
    const reservation = order
      ? null
      : await prisma.reservation.findUnique({
          where: { id: orderId },
          select: { totalPrice: true, advertiserId: true, status: true, spaceId: true },
        });
    const owned =
      (order && order.clientId === userId) || (reservation && reservation.advertiserId === userId);
    if (!owned) {
      return new NextResponse("No autorizado para este pedido", { status: 403 });
    }

    // Solo se cobran pedidos/reservas pendientes de pago (evita cobrar dos veces o pedidos cancelados)
    if ((order && order.status !== "PENDING") || (reservation && reservation.status !== "PENDING")) {
      return new NextResponse("El pedido ya no está pendiente de pago", { status: 409 });
    }

    const amount = Number(order?.totalPrice ?? reservation?.totalPrice);
    if (!Number.isFinite(amount) || amount < 0.5 || amount > 100_000) {
      return new NextResponse("Monto del pedido inválido", { status: 400 });
    }

    // Tipo e id derivados del pedido real, no de lo que manda el cliente
    const safeMetadata = {
      type: order ? "service" : "anuncio",
      id: order ? order.serviceId : reservation!.spaceId,
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
        // Vincular al pedido de servicio (lo usan disputas/reembolsos y el panel del pedido)
        ...(order ? { orderId } : {}),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      // Monto real cobrado (incluye comisiones), para que la UI muestre lo mismo que se cobra
      amount,
    });
  } catch (error: any) {
    console.error('[STRIPE_CREATE_INTENT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
// creado por pato dev y askforvini
