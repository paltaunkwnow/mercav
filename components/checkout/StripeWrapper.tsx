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
            colorBackground: '#111111',
            colorText: '#ffffff',
            colorDanger: '#ff3333',
            fontFamily: 'var(--font-sans)',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      }}
    >
      <StripePaymentForm amount={amount} />
    </Elements>
  );
}
