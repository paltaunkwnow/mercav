'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/[0.03] blur-[180px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="h-24 w-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 float-gentle">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-black mb-4 text-white tracking-tight">
          Algo salió mal de nuestro lado.
        </h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
          Ya estamos trabajando en ello. Por favor, intenta de nuevo más tarde o vuelve a la página principal.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => reset()} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 rounded-xl transition-all">
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </Button>
          <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-xl hover:scale-105 transition-transform hover:shadow-lg hover:shadow-gold/20">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" /> Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
