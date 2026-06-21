'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl">
        <h3 className="text-xl font-display font-bold text-white mb-6 flex justify-between items-center">
          Detalles de Pago
          <span className="text-gold text-2xl">${(amount || 0).toLocaleString()}</span>
        </h3>
        
        <div className="stripe-element-container mb-6">
          <PaymentElement 
            options={{
              layout: 'tabs',
              theme: 'night',
              variables: {
                colorPrimary: '#D4AF37',
                colorBackground: '#111111',
                colorText: '#ffffff',
                colorDanger: '#ff3333',
                fontFamily: 'var(--font-sans)',
                spacingUnit: '4px',
                borderRadius: '8px',
              },
            }}
          />
        </div>

        <Button
          disabled={isLoading || !stripe || !elements || disabled}
          id="submit"
          className="w-full h-14 bg-gold hover:bg-gold-light text-black font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando...</span>
            </div>
          ) : (
            `Pagar $${(amount || 0).toLocaleString()}`
          )}
        </Button>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              id="payment-message"
              className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <p className="text-center text-xs text-gray-500">
        Tus pagos están protegidos con encriptación SSL de grado bancario. 
        Al pagar, aceptas nuestros <a href="/terminos" className="text-gold hover:underline">Términos de Servicio</a>.
      </p>
    </form>
  );
}
