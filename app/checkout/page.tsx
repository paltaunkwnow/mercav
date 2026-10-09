import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import StripeWrapper from '@/components/checkout/StripeWrapper';
import { Metadata } from 'next';
import { planChargeUsd } from '@/lib/billing/plans';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Lock } from '@/components/icons';
import { Container, buttonClass } from '@/components/site/primitives';

const PLAN_LABEL: Record<string, string> = { PROFESSIONAL: 'Professional', EMPRESA: 'Empresa', ELITE: 'Elite' };

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
    const back = new URLSearchParams();
    for (const key of ['amount', 'plan', 'interval', 'reservationId'] as const) {
      const value = searchParams[key];
      if (value) back.set(key, value);
    }
    const query = back.toString();
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout${query ? `?${query}` : ''}`)}`);
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect('/precios');

  let amount: number | null = null;
  if (searchParams.reservationId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: searchParams.reservationId },
      select: { totalPrice: true, advertiserId: true, status: true },
    });
    // Solo reservas propias y pendientes de pago
    if (!reservation || reservation.advertiserId !== userId || reservation.status !== 'PENDING') redirect('/precios');
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
      // Un pago es de reserva O de plan, nunca ambos (antes el default 'PROFESSIONAL' hacía que
      // pagar una reserva también activara un plan).
      metadata: searchParams.reservationId
        ? { userId, reservationId: searchParams.reservationId }
        : {
            userId,
            plan: (searchParams.plan || '').toUpperCase(),
            interval: searchParams.interval === 'annual' ? 'annual' : 'monthly',
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
        userId,
        metadata: searchParams.reservationId
          ? { reservationId: searchParams.reservationId }
          : {
              plan: (searchParams.plan || '').toUpperCase(),
              interval: searchParams.interval === 'annual' ? 'annual' : 'monthly',
            },
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create PaymentIntent client secret');
    }

    const planKey = (searchParams.plan || '').toUpperCase();
    const planName = searchParams.reservationId ? 'Reserva de espacio publicitario' : PLAN_LABEL[planKey] ? `Plan ${PLAN_LABEL[planKey]}` : 'Plan Mercav';
    const intervalLabel = searchParams.reservationId ? null : searchParams.interval === 'annual' ? 'Facturación anual' : 'Facturación mensual';
    const formattedAmount = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(amount);

    return (
      <div className="relative w-full bg-bg-primary pb-16 pt-24 md:pb-24 md:pt-28">
        <div className="mv-aura" aria-hidden />
        <Container className="relative max-w-[64rem]">
          <Link href="/precios" className="mv-focus mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a precios
          </Link>

          <header className="mb-8 md:mb-10">
            <p className="mv-kicker">Pago seguro</p>
            <h1 className="mv-h2 mt-3">Completá tu pago</h1>
            <p className="mv-body mt-2 max-w-xl">Revisá el resumen y pagá con tarjeta. El cobro lo procesa Stripe.</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
            <section aria-labelledby="pago-titulo" className="order-2 lg:order-1">
              <h2 id="pago-titulo" className="sr-only">Datos de pago</h2>
              <StripeWrapper 
                clientSecret={paymentIntent.client_secret} 
                amount={amount} 
              />
            </section>

            <aside aria-labelledby="resumen-titulo" className="order-1 lg:sticky lg:top-28 lg:order-2">
              <div className="mv-panel p-5 sm:p-6">
                <h2 id="resumen-titulo" className="text-sm font-semibold text-[var(--text-secondary)]">Resumen del pedido</h2>
                <p className="mt-3 font-display text-xl font-semibold text-[var(--text-primary)]">{planName}</p>
                {intervalLabel && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{intervalLabel}</p>}
                <dl className="mt-5 space-y-2.5 border-t border-[var(--mv-hairline)] pt-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--text-secondary)]">Subtotal</dt>
                    <dd className="mv-data text-[var(--text-primary)]">{formattedAmount}</dd>
                  </div>
                  <div className="flex items-end justify-between gap-4 border-t border-[var(--mv-hairline)] pt-4">
                    <dt className="font-semibold text-[var(--text-primary)]">Total a pagar</dt>
                    <dd className="mv-data text-2xl font-medium text-gold">{formattedAmount}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-right text-xs text-[var(--text-tertiary)]">Montos en USD</p>
              </div>
              <p className="mt-4 flex items-start gap-2.5 px-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                Los datos de tu tarjeta van directo a Stripe. Mercav no los almacena.
              </p>
            </aside>
          </div>
        </Container>
      </div>
    );
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error);
    return (
      <div className="relative flex min-h-[80svh] w-full items-center justify-center bg-bg-primary px-4 pb-16 pt-28">
        <div className="mv-panel w-full max-w-md p-8 text-center" role="alert">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mv-h3 mt-5">No pudimos iniciar el pago</h1>
          <p className="mv-body mt-2">No se generó ningún cobro. Probá de nuevo en unos minutos.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/precios" className={buttonClass('primary', 'md', 'w-full sm:w-auto')}>Volver a precios</Link>
            <Link href="/" className={buttonClass('ghost', 'md', 'w-full sm:w-auto')}>Ir al inicio</Link>
          </div>
        </div>
      </div>
    );
  }
}
// creado por pato dev y askforvini
