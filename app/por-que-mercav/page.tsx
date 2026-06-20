"use client";

import { CheckCircle2, Globe2, Shield, Zap, TrendingUp, Users, Wallet, BarChart3, ArrowRight, Sparkles, Heart, Target, Award, Clock, DollarSign, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
};

export default function PorQueMercavPage() {
  return (
    <div className="w-full min-h-screen bg-bg-primary overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-sm text-gold"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Manifiesto Mercav
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
          >
            Por qué <span className="text-gold italic">Mercav</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 mb-6 max-w-3xl mx-auto leading-relaxed"
          >
            Latinoamérica está llena de talento y negocios increíbles, pero las herramientas para conectarlos siempre han estado diseñadas para otros mercados.
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gold/80 font-medium max-w-2xl mx-auto"
          >
            Mercav nace para cambiar eso. Para siempre.
          </motion.p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="w-full py-24 bg-bg-secondary border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">El problema que nadie resolvía</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Durante décadas, Latinoamérica operó con herramientas pensadas para otros continentes.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Globe2, 
                title: "Publicidad Fragmentada", 
                desc: "Alquilar un espacio publicitario en Latam requiere conocer al dueño personalmente. No hay infraestructura digital para conectar anunciantes con propietarios de espacios.",
                stat: "85%",
                statLabel: "opera sin plataforma"
              },
              { 
                icon: Users, 
                title: "Talento Aislado", 
                desc: "Freelancers latinoamericanos compiten en plataformas extranjeras con comisiones del 20-30%, precios en dólares y sin soporte en español real.",
                stat: "30%",
                statLabel: "en comisiones abusivas"
              },
              { 
                icon: TrendingUp, 
                title: "Empleo Desconectado", 
                desc: "Las bolsas de empleo en la región están desactualizadas, con mala UX y sin integración con perfiles profesionales verificados.",
                stat: "70%",
                statLabel: "abandona el proceso"
              }
            ].map((problem, i) => (
              <motion.div 
                key={i}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative overflow-hidden rounded-2xl bg-bg-tertiary border border-border p-8 group hover:border-red-500/20 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <problem.icon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{problem.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{problem.desc}</p>
                <div className="pt-4 border-t border-border">
                  <span className="text-2xl font-bold text-red-400 font-mono">{problem.stat}</span>
                  <span className="text-xs text-gray-500 ml-2 uppercase tracking-wider">{problem.statLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution - Core Features */}
      <section className="w-full py-24 bg-bg-primary">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">La solución: <span className="text-gold">un ecosistema completo</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Mercav integra todo lo que un negocio o profesional latinoamericano necesita bajo un solo techo.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: CheckCircle2, title: "Hecho para Latam", desc: "Métodos de pago locales, precios acordes a nuestra realidad y soporte en español nativo. No adaptamos herramientas gringas: construimos desde cero para nosotros.", color: "gold" },
              { icon: Shield, title: "Cero Intermediarios Abusivos", desc: "No cobramos márgenes del 30%. No escondemos información de contacto. No ponemos trabas artificiales. Tu primer alquiler de espacio es 100% libre de comisión.", color: "gold" },
              { icon: Zap, title: "Ecosistema Todo en Uno", desc: "Publicidad offline, talento digital, bolsa de empleo y herramientas de gestión empresarial. Todo integrado, todo bajo una misma cuenta y perfil profesional.", color: "gold" },
              { icon: Lock, title: "Transparencia Absoluta", desc: "Precios claros desde el primer clic. Perfiles verificados con datos reales. Reseñas auténticas. Reglas justas para todos los usuarios de la plataforma sin excepciones.", color: "gold" },
              { icon: DollarSign, title: "Precios Justos para la Región", desc: "Entendemos que $10 USD no significa lo mismo en cada país. Nuestros planes están diseñados pensando en la realidad económica de cada mercado latinoamericano.", color: "gold" },
              { icon: Target, title: "Enfoque en Resultados", desc: "Cada funcionalidad existe para generar valor real. Sin features de relleno, sin métricas vanidosas. Medimos éxito por conexiones reales y transacciones completadas.", color: "gold" },
              { icon: Clock, title: "Rapidez sin Sacrificios", desc: "Publicar un servicio toma menos de 3 minutos. Encontrar un profesional, segundos. Contratar con garantía, un par de clics. El tiempo es tu recurso más valioso.", color: "gold" },
              { icon: Heart, title: "Construido con Pasión", desc: "Mercav no es un proyecto de venture capital. Es una misión personal de un fundador que creció viendo los problemas de primera mano. Cada pixel tiene intención.", color: "gold" }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-bg-secondary p-8 rounded-2xl border border-border hover:border-gold/30 transition-all group hover:shadow-lg hover:shadow-gold/5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 group-hover:scale-110 transition-all">
                    <feature.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How we're different */}
      <section className="w-full py-24 bg-bg-secondary border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Lo que nos hace diferentes</h2>
          </motion.div>

          <div className="grid gap-4 max-w-3xl mx-auto">
            {[
              { them: "Comisiones del 20-30% por transacción", us: "Tu primer alquiler sin comisión. Después, comisiones justas y transparentes." },
              { them: "Plataformas en inglés traducidas con Google", us: "Construido en español nativo desde la primera línea de código." },
              { them: "Soporte automatizado con bots genéricos", us: "Soporte humano real, rápido y en tu idioma." },
              { them: "Herramientas separadas para cada necesidad", us: "Un solo ecosistema con todo integrado bajo tu perfil profesional." },
              { them: "Precios en USD sin contexto regional", us: "Precios locales adaptados a la realidad de cada país." },
            ].map((comp, i) => (
              <motion.div 
                key={i}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 rounded-2xl overflow-hidden border border-border"
              >
                <div className="p-5 bg-red-500/5 border-b md:border-b-0 md:border-r border-border flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500/60 flex-shrink-0" />
                  <span className="text-sm text-gray-400 line-through decoration-red-500/30">{comp.them}</span>
                </div>
                <div className="p-5 bg-gold/5 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-gold flex-shrink-0" />
                  <span className="text-sm text-white font-medium">{comp.us}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Highlight */}
      <section className="w-full py-20 bg-bg-primary">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Países en Latam", val: "15+" },
              { label: "Módulos Integrados", val: "4" },
              { label: "Comisión Primer Alquiler", val: "$0" },
              { label: "Idioma Nativo", val: "ES" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
                className="flex flex-col items-center"
              >
                <span className="font-display text-3xl md:text-4xl font-bold text-gold mb-2">{stat.val}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="w-full py-24 bg-bg-secondary border-t border-border">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
            <Award className="h-12 w-12 text-gold mx-auto mb-8" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
              Nuestra visión
            </h2>
            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                Imaginamos un continente donde cualquier emprendedor, freelancer o empresa pequeña tiene acceso a las mismas herramientas profesionales que las grandes corporaciones.
              </p>
              <p>
                Donde contratar talento, alquilar publicidad o encontrar empleo no depende de quién conoces, sino de la calidad de lo que ofreces.
              </p>
              <p className="text-gold font-medium text-xl">
                Mercav es esa visión hecha realidad. Y recién estamos empezando.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 bg-bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 max-w-3xl relative z-10 text-center">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              ¿Listo para ser parte del <span className="text-gold">cambio</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Únete a miles de empresas y profesionales que ya confían en Mercav para crecer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gold text-black hover:bg-gold-light h-14 px-8 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-gold/20">
                <Link href="/register">
                  Empezar gratis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gold/40 text-gold hover:bg-gold/10 h-14 px-8 rounded-xl font-medium text-lg bg-transparent">
                <Link href="/nosotros">Conocer al fundador</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
