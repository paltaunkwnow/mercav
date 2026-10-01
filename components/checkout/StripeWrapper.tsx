'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { useTheme } from '@/components/ui/ThemeProvider';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface StripeWrapperProps {
  clientSecret: string;
  amount: number;
}

export default function StripeWrapper({ clientSecret, amount }: StripeWrapperProps) {
  // Respetar el tema del sitio (claro/oscuro) en el Payment Element
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: isLight ? 'stripe' : 'night',
          variables: {
            colorPrimary: '#D4AF37',
            colorBackground: isLight ? '#ffffff' : '#111111',
            colorText: isLight ? '#111111' : '#ffffff',
            colorDanger: isLight ? '#d92d20' : '#ff3333',
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
// creado por pato dev y askforvini
