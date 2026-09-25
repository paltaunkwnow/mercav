"use client";

import { Zap, CheckCircle2, Shield, Rocket, Target, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PremiumPage() {
  const plans = [
    {
      name: "Profesional",
      price: "$9.99",
      desc: "Para freelancers y profesionales que buscan destacar.",
      features: [
        "Postulaciones ilimitadas",
        "Hasta 5 servicios/espacios",
        "Perfil destacado en búsquedas",
        "Mensajería ilimitada",
        "Analytics básico del perfil"
      ],
      color: "border-blue-500/20 bg-blue-500/5",
      icon: Target
    },
    {
      name: "Empresa",
      price: "$29",
      desc: "La solución completa para agencias y reclutadores.",
      features: [
        "Vacantes ilimitadas",
        "Badge Empresa verificada",
        "Gestión avanzada de candidatos",
        "Soporte dedicado",
        "Analytics avanzado"
      ],
      color: "border-gold/30 bg-gold/5 shadow-gold/5",
      icon: Rocket,
      featured: true
    },
    {
      name: "Elite",
      price: "$79",
      desc: "Dominio total del mercado con herramientas exclusivas.",
      features: [
        "Todo lo de Empresa",
        "Aparición destacada en Home",
        "IA para generación de contratos",
        "API de integración completa",
        "Soporte 24/7 prioritario"
      ],
      color: "border-purple-500/20 bg-purple-500/5",
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-white pt-32 pb-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-gold/10 to-transparent opacity-30 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <header className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-black uppercase tracking-widest mb-6">
            <Zap className="h-4 w-4" /> Mercav Premium
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight">
            Lleva tu negocio al <span className="text-gold italic">Siguiente Nivel</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Impulsa tus publicaciones, encuentra el mejor talento y domina el mercado publicitario en toda Bolivia.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`p-10 rounded-[3rem] border transition-all hover:scale-[1.02] flex flex-col ${plan.color} ${plan.featured ? 'scale-105 shadow-2xl z-20' : 'z-10'}`}
            >
              <div className="mb-8">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 ${plan.featured ? 'bg-gold text-primary-foreground' : 'bg-white/5 text-gold'}`}>
                  <plan.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{plan.desc}</p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-mono font-black">{plan.price}</span>
                  <span className="text-gray-500 font-bold">/ mes</span>
                </div>
              </div>

              <ul className="space-y-4 mb-12 flex-1">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={18} className="text-gold flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => {
                  const numericPrice = plan.price.replace('$', '');
                  window.location.href = `/checkout?amount=${numericPrice}&plan=${plan.name}&interval=monthly`;
                }}
                className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  plan.featured ? 'bg-gold text-primary-foreground hover:bg-gold-light shadow-xl shadow-gold/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                Comenzar Ahora <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          ))}
        </div>

        <div className="p-12 rounded-[4rem] bg-white/[0.02] border border-white/5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Shield size={150} />
          </div>
          <h2 className="text-3xl font-bold mb-4">¿Necesitas un plan personalizado?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto italic">
            "Si representas a una gran corporación o tienes necesidades específicas de volumen, nuestro equipo Elite está listo para ayudarte."
          </p>
          <Button variant="outline" className="h-14 px-10 border-white/10 text-white rounded-2xl font-bold hover:bg-white/5">
            Contactar Ventas
          </Button>
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
