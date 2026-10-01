'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StripePaymentFormProps {
  amount: number;
  disabled?: boolean;
}

export default function StripePaymentForm({ amount, disabled }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "Ocurrió un error con la tarjeta.");
    } else {
      setMessage("Ocurrió un error inesperado al procesar el pago.");
    }

    setIsLoading(false);
  };

  const formatted = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(amount || 0);

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
      <div className="mv-panel p-5 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Datos de pago</h3>
          <span className="mv-data text-lg font-medium text-gold">{formatted}</span>
        </div>
        
        <div className="stripe-element-container mb-6 min-h-[12rem]">
          <PaymentElement 
            // El tema/variables visuales van en `appearance` de <Elements> (StripeWrapper)
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !stripe || !elements || disabled}
          id="submit"
          className="mv-btn mv-btn-primary mv-btn-lg w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Procesando pago…</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden />
              <span>Pagar <span className="mv-data">{formatted}</span></span>
            </>
          )}
        </button>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              id="payment-message"
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <p className="px-1 text-xs leading-relaxed text-[var(--text-secondary)]">
        El pago lo procesa Stripe; Mercav no almacena los datos de tu tarjeta. Al pagar aceptás los{' '}
        <a href="/terminos" className="mv-link font-medium">Términos del servicio</a>.
      </p>
    </form>
  );
}
// creado por pato dev y askforvini
