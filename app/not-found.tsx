"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.03] blur-[180px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="h-24 w-24 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-8 float-gentle">
          <AlertCircle className="h-12 w-12 text-gold" />
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-black mb-4 text-white tracking-tight">
          <span className="gradient-text-gold">404</span>
        </h2>
        <h3 className="font-display text-xl md:text-2xl font-bold mb-4 text-white">
          Esta página no existe o fue eliminada.
        </h3>
        <p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
          Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido movida o que la dirección sea incorrecta.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button type="button" variant="outline" onClick={() => history.back()} className="border-white/10 text-gray-300 hover:text-white hover:border-white/20 rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver atrás
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
// creado por pato dev y askforvini
