import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { fulfillPaidTransaction } from '@/lib/billing/fulfill';
import { CheckCircle2, XCircle, Clock, ArrowRight } from '@/components/icons';
import Link from 'next/link';
import { buttonClass } from '@/components/site/primitives';

export const metadata = {
  title: 'Confirmación de Pago | Mercav',
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { payment_intent?: string; payment_intent_client_secret?: string };
}) {
  const paymentIntentId = searchParams.payment_intent;

  if (!paymentIntentId) {
    redirect('/');
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    // ID inválido o ajeno a nuestra cuenta de Stripe
    redirect('/');
  }
  const status = paymentIntent.status;

  if (status === 'succeeded') {
    // Mismo cumplimiento idempotente que el webhook (lib/billing/fulfill.ts). Antes esta página
    // duplicaba la lógica usando la metadata del PaymentIntent: creaba un pedido nuevo en vez de
    // confirmar el existente y podía activar un plan con el pago de una reserva.
    try {
      await fulfillPaidTransaction(paymentIntent.id);
    } catch (error) {
      // El webhook lo reintentará; no rompemos la página de confirmación
      console.error('[CHECKOUT_CONFIRMATION] Error al cumplir el pago:', error);
    }
  }

  const piMeta = (paymentIntent.metadata || {}) as Record<string, string>;
  const retryHref = piMeta.type && piMeta.id ? `/checkout/${piMeta.type}/${piMeta.id}` : '/precios';
  // La compra de Mercav Pro no deja un pedido: se confirma el plan y se vuelve a la app.
  const isPlan = !!piMeta.plan;
  const ordersOrApp = isPlan ? { href: '/inicio', label: 'Ir a la app' } : { href: '/dashboard/pedidos', label: 'Ver mis pedidos' };

  const statusConfig = {
    succeeded: {
      icon: <CheckCircle2 className="h-7 w-7" aria-hidden />,
      tone: 'bg-[var(--mv-gold-wash)] text-gold border-[var(--color-border-gold)]',
      kicker: 'Pago confirmado',
      title: isPlan ? 'Ya tenés Mercav Pro' : 'Listo, recibimos tu pago',
      description: isPlan
        ? 'Tu plan está activo: los límites del plan Gratis ya no se aplican a tu cuenta.'
        : 'Tu pago se procesó correctamente. Ya podés ver el pedido y su estado en Pedidos.',
      next: ordersOrApp,
    },
    processing: {
      icon: <Clock className="h-7 w-7" aria-hidden />,
      tone: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
      kicker: 'En proceso',
      title: 'Estamos confirmando tu pago',
      description: 'Stripe todavía está procesando el pago. Te avisamos apenas se complete; no hace falta que pagues de nuevo.',
      next: ordersOrApp,
    },
    requires_payment_method: {
      icon: <XCircle className="h-7 w-7" aria-hidden />,
      tone: 'bg-red-500/10 text-red-400 border-red-500/25',
      kicker: 'Pago rechazado',
      title: 'No se pudo completar el pago',
      description: 'Hubo un problema con el medio de pago y no se realizó ningún cobro. Probá de nuevo con otra tarjeta.',
      next: { href: retryHref, label: 'Volver a intentar' },
    },
    default: {
      icon: <XCircle className="h-7 w-7" aria-hidden />,
      tone: 'bg-[var(--mv-panel-hover)] text-[var(--text-secondary)] border-[var(--mv-hairline-strong)]',
      kicker: 'Estado desconocido',
      title: 'No pudimos confirmar el estado del pago',
      description: isPlan ? 'Revisá tu plan en unos minutos. Si el problema sigue, escribinos a soporte.' : 'Revisá tus pedidos en unos minutos. Si el problema sigue, escribinos a soporte.',
      next: ordersOrApp,
    },
  };

  const currentStatus = (statusConfig as any)[status] || statusConfig.default;
  const amountLabel =
    typeof paymentIntent.amount === 'number'
      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: (paymentIntent.currency || 'usd').toUpperCase() }).format(paymentIntent.amount / 100)
      : null;

  return (
    <div className="relative flex min-h-[85svh] w-full items-center justify-center overflow-hidden bg-bg-primary px-4 pb-16 pt-28">
      <section aria-labelledby="confirm-title" className="mv-panel relative w-full max-w-lg p-6 text-center sm:p-10">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border ${currentStatus.tone}`}>
          {currentStatus.icon}
        </span>
        <p className="mv-kicker mt-6 justify-center">{currentStatus.kicker}</p>
        <h1 id="confirm-title" className="mv-h2 mt-3 text-[2rem] sm:text-[2.25rem]">{currentStatus.title}</h1>
        <p className="mv-body mx-auto mt-3 max-w-sm">{currentStatus.description}</p>

        <dl className="mt-8 space-y-2.5 rounded-[1.25rem] border border-[var(--mv-hairline)] p-4 text-left text-sm">
          {amountLabel && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-secondary)]">Monto</dt>
              <dd className="mv-data font-medium text-[var(--text-primary)]">{amountLabel}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-[var(--text-secondary)]">Referencia</dt>
            <dd className="mv-data truncate text-[var(--text-primary)]">{paymentIntentId}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-2">
          <Link href={currentStatus.next.href} className={buttonClass('primary', 'lg', 'w-full')}>
            {currentStatus.next.label}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/inicio" className={buttonClass('ghost', 'md', 'w-full')}>
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
