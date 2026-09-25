import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Or the latest stable version
  typescript: true,
});
// creado por pato dev y askforvini
