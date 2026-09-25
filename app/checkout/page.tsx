import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import StripeWrapper from '@/components/checkout/StripeWrapper';
import { Metadata } from 'next';
import { planChargeUsd } from '@/lib/billing/plans';

export const metadata: Metadata = {
  title: 'Checkout | Mercav',
  description: 'Completa tu transacción de forma segura en Mercav.',
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { amount?: string; reservationId?: string; plan?: string; interval?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=/checkout?amount=${searchParams.amount}&plan=${searchParams.plan}&interval=${searchParams.interval}`);
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect('/precios');

  let amount: number | null = null;
  if (searchParams.reservationId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: searchParams.reservationId },
      select: { totalPrice: true, advertiserId: true },
    });
    if (!reservation || reservation.advertiserId !== userId) redirect('/precios');
    amount = Number(reservation.totalPrice);
  } else {
    amount = planChargeUsd(searchParams.plan, searchParams.interval);
  }
  if (amount == null || !Number.isFinite(amount) || amount < 0.5) {
    redirect('/precios');
  }
  const currency = 'usd';

  try {
    // Create PaymentIntent server-side
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        userId: (session.user as any).id,
        reservationId: searchParams.reservationId || '',
        plan: searchParams.plan || 'PROFESSIONAL',
        interval: searchParams.interval || 'monthly',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save transaction as PENDING
    await prisma.transaction.create({
      data: {
        stripeId: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'PENDING',
        userId: (session.user as any).id,
        metadata: {
          reservationId: searchParams.reservationId,
          plan: searchParams.plan,
          interval: searchParams.interval,
        },
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create PaymentIntent client secret');
    }

    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Checkout <span className="text-gold">Premium</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Estás a un paso de potenciar tu presencia en el ecosistema Mercav.
            </p>
          </div>

          <StripeWrapper 
            clientSecret={paymentIntent.client_secret} 
            amount={amount} 
          />
          
          <div className="mt-12 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error);
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center p-8 glassmorphism rounded-2xl border border-red-500/20 max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error al iniciar el pago</h2>
          <p className="text-gray-400 mb-6">No pudimos procesar la solicitud de pago en este momento. Por favor, intenta de nuevo.</p>
          <a href="/" className="inline-block px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light transition-colors">
            Volver al Inicio
          </a>
        </div>
      </main>
    );
  }
}
// creado por Patodev y Invertilo
