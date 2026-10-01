import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_build';

// El SDK instalado solo tipa su versión más reciente de la API. Mantenemos fijada la
// versión con la que se construyó la integración (webhooks, PaymentIntents, montos) para no
// cambiar el comportamiento en producción; por eso se castea explícitamente.
// Para migrar: revisar el changelog de Stripe y cambiar este valor a conciencia.
type StripeApiVersion = NonNullable<NonNullable<ConstructorParameters<typeof Stripe>[1]>['apiVersion']>;

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as unknown as StripeApiVersion,
  typescript: true,
});
// creado por pato dev y askforvini
