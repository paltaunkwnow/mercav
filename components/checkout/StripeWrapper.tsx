'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface StripeWrapperProps {
  clientSecret: string;
  amount: number;
}

export default function StripeWrapper({ clientSecret, amount }: StripeWrapperProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#D4AF37',
          },
        },
      }}
    >
      <StripePaymentForm amount={amount} />
    </Elements>
  );
}
// creado por Patodev y Invertilo
