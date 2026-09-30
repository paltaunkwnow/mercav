import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const status = paymentIntent.status;

  if (status === 'succeeded') {
    // Check if we already processed this
    const transaction = await prisma.transaction.findUnique({
      where: { stripeId: paymentIntentId }
    });

    if (transaction && transaction.status === 'PENDING') {
      const metadata = paymentIntent.metadata as any;
      const userId = transaction.userId;

      if (metadata.type === 'servicio' || metadata.type === 'service') {
        // Fetch service to get provider
        const service = await prisma.service.findUnique({
          where: { id: metadata.id },
          include: { packages: true }
        });

        if (service) {
          // Create Service Order
          await prisma.serviceOrder.create({
            data: {
              serviceId: service.id,
              packageId: service.packages[0]?.id || "", // Default to first package
              clientId: userId!,
              providerId: service.providerId,
              status: "IN_PROGRESS",
              totalPrice: transaction.amount,
              platformFee: 0, // Simplified for now
              providerPayout: transaction.amount,
              briefing: "Pedido realizado vía Checkout"
            }
          });
        }
      } else if (metadata.type === 'anuncio' || metadata.type === 'space') {
         // Fetch space to get owner
         const space = await prisma.space.findUnique({
           where: { id: metadata.id }
         });
         
         if (space) {
           await prisma.reservation.create({
             data: {
               spaceId: space.id,
               advertiserId: userId!,
               startDate: new Date(),
               endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
               basePrice: transaction.amount,
               advertiserFee: 0,
               ownerFee: 0,
               totalPrice: transaction.amount,
               status: "CONFIRMED",
               briefing: "Reserva realizada vía Checkout"
             }
           });
         }
      } else if (metadata.plan) {
        // Handle Plan Upgrades
        await prisma.user.update({
          where: { id: userId! },
          data: { 
            plan: metadata.plan as any,
            planExpiresAt: metadata.interval === 'annual' 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        
        // Also create a subscription record for history
        await prisma.subscription.create({
          data: {
            userId: userId!,
            plan: metadata.plan as any,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: metadata.interval === 'annual' 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentId: paymentIntentId
          }
        });
      }

      // Mark transaction as PAID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID' }
      });
    }
  }

  const statusConfig = {
    succeeded: {
      icon: <CheckCircle2 className="w-20 h-20 text-gold" />,
      title: '¡Pago Exitoso!',
      description: 'Tu transacción ha sido procesada correctamente. Ya puedes disfrutar de los beneficios de Mercav.',
      color: 'text-gold',
    },
    processing: {
      icon: <Clock className="w-20 h-20 text-blue-400" />,
      title: 'Pago en Procesamiento',
      description: 'Estamos verificando tu pago. Te notificaremos en cuanto se complete.',
      color: 'text-blue-400',
    },
    requires_payment_method: {
      icon: <XCircle className="w-20 h-20 text-red-500" />,
      title: 'Pago Fallido',
      description: 'Hubo un problema al procesar tu tarjeta. Por favor, intenta de nuevo.',
      color: 'text-red-500',
    },
    default: {
      icon: <XCircle className="w-20 h-20 text-gray-400" />,
      title: 'Estado Desconocido',
      description: 'No pudimos determinar el estado de tu pago.',
      color: 'text-gray-400',
    },
  };

  const currentStatus = (statusConfig as any)[status] || statusConfig.default;

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full glassmorphism rounded-[2rem] border border-white/5 p-12 text-center relative overflow-hidden">
        {/* Cinematic Scanline effect from existing patterns */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent h-1/2 w-full animate-scanline opacity-20" />
        </div>

        <div className="flex justify-center mb-8 relative z-10">
          <div className="p-4 rounded-full bg-gold/10 border border-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.15)]">
            {currentStatus.icon}
          </div>
        </div>

        <h1 className={`text-3xl font-display font-bold mb-4 relative z-10 ${currentStatus.color}`}>
          {currentStatus.title}
        </h1>
        
        <p className="text-gray-400 mb-10 relative z-10">
          {currentStatus.description}
        </p>

        <div className="space-y-4 relative z-10">
          <Link 
            href="/dashboard/pedidos"
            className="flex items-center justify-center gap-2 w-full h-14 bg-gold hover:bg-gold-light text-black font-bold rounded-xl transition-all duration-300"
          >
            Ver mis Pedidos
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            href="/"
            className="block text-gray-500 hover:text-white transition-colors text-sm font-medium"
          >
            Volver al Inicio
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">
          Mercav Transaction Protocol v1.0
        </div>
      </div>
    </main>
  );
}
// creado por pato dev y askforvini
