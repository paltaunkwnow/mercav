"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthHeroButton } from '@/components/ui/AuthHeroButton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Precios() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "FREE",
      displayName: "Free",
      price: 0,
      desc: "Para explorar la plataforma.",
      features: [
        "Perfil completo",
        "10 postulaciones por mes",
        "1 espacio o servicio publicado",
        "1 vacante por mes",
        "Feed y perfiles públicos",
        "Hasta 5 chats activos"
      ]
    },
    {
      name: "PROFESSIONAL",
      displayName: "Profesional",
      price: 9.99,
      desc: "Para freelancers y profesionales.",
      features: [
        "Postulaciones ilimitadas",
        "Hasta 5 espacios o servicios",
        "Hasta 5 vacantes por mes",
        "Mensajes ilimitados",
        "Perfil destacado en búsquedas",
        "Analytics básico del perfil"
      ]
    },
    {
      name: "EMPRESA",
      displayName: "Empresa",
      price: 29,
      desc: "Para agencias y negocios.",
      popular: true,
      features: [
        "Vacantes ilimitadas",
        "Gestión avanzada de candidatos",
        "Preguntas de postulación",
        "Analytics avanzado",
        "Badge Empresa verificada",
        "Soporte dedicado"
      ]
    },
    {
      name: "ELITE",
      displayName: "Elite",
      price: 79,
      desc: "La suite completa para escalar.",
      features: [
        "Hasta 20 espacios o servicios",
        "Aparición destacada en el inicio",
        "Mercav Tools sin límites",
        "Generación de contratos con IA",
        "API de integración completa",
        "Soporte 24/7 prioritario"
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen pt-24 pb-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">
            Planes claros. Sin sorpresas.
          </h1>
          <p className="text-gray-400 text-lg mb-8 text-balance">
            Empezá gratis y mejora tu plan solo cuando lo necesites.
            Ahorrá 20% pagando anualmente.
          </p>
          
          <div className="inline-flex items-center p-1 bg-bg-tertiary rounded-xl border border-border">
            <button 
              onClick={() => setIsAnnual(false)}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-colors", !isAnnual ? "bg-bg-secondary text-white shadow" : "text-gray-400 hover:text-white")}
            >
              Mensual
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-colors", isAnnual ? "bg-bg-secondary text-white shadow" : "text-gray-400 hover:text-white")}
            >
              Anual <span className="ml-1 text-gold text-xs font-bold">-20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24 max-w-7xl mx-auto">
          {plans.map((plan, i) => {
            const displayPrice = isAnnual ? (plan.price * 0.8).toFixed(2) : plan.price;
            return (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn("flex flex-col p-8 rounded-2xl border bg-bg-secondary relative transition-all duration-300", plan.popular ? "border-gold shadow-2xl shadow-gold/10 lg:-translate-y-4" : "border-border hover:border-gray-600")}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Más popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.displayName}</h3>
                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">{plan.desc}</p>
                
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-gray-400 font-medium pb-1">$</span>
                    <span className="text-4xl font-bold text-white font-mono">{displayPrice}</span>
                    <span className="text-gray-400 text-sm pb-1">/mes</span>
                  </div>
                  {isAnnual && plan.price > 0 && (
                    <div className="text-sm text-gray-500 line-through mt-1">${plan.price}/mes</div>
                  )}
                  {plan.price === 0 && <div className="text-sm text-transparent mt-1">-</div>}
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-gold mr-3 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => {
                    if (plan.price === 0) {
                      window.location.href = '/dashboard';
                      return;
                    }
                    const url = `/checkout?amount=${displayPrice}&plan=${plan.name}${isAnnual ? '&interval=annual' : '&interval=monthly'}`;
                    window.location.href = url;
                  }}
                  className={cn("w-full h-12 rounded-xl font-medium transition-transform hover:scale-[1.02]", plan.popular ? "bg-gold text-black hover:bg-gold-light" : "bg-bg-tertiary text-white border border-border hover:border-gold hover:text-gold")}
                >
                  {plan.price === 0 ? "Comenzar Gratis" : "Elegir " + plan.displayName}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center pt-16 border-t border-border"
        >
          <h2 className="font-display text-3xl font-bold text-white mb-6">Comenzá hoy mismo</h2>
          <p className="text-gray-400 mb-8">Empezar es gratis, sin tarjeta de crédito. Descubrí por qué miles de profesionales confían en Mercav.</p>
          <AuthHeroButton label="Empezar gratis, sin tarjeta" className="w-full sm:w-auto px-8" />
        </motion.div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
