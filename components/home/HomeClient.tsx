"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeroBackground3D } from '@/components/ui/HeroBackground3D';
import { ArrowRight, Megaphone, MonitorPlay, Briefcase, Wrench, CheckCircle2, Star, MapPin, Clock, Sparkles, Zap, Globe, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthHeroButton } from '@/components/ui/AuthHeroButton';
import { TiltCard } from '@/components/motion/TiltCard';

interface ActivityItem {
  id: string;
  type: 'SERVICE' | 'SPACE' | 'JOB';
  title: string;
  location: string;
  price?: string;
  category: string;
  createdAt: Date;
  image?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    }
  }
};

export function HomeHero() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-28 [justify-content:safe_center]">
      <HeroBackground3D />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-32 bg-gradient-to-b from-bg-primary via-bg-primary/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-b from-transparent to-bg-primary" />

      <div className="container mx-auto px-6 z-10 flex flex-col items-center text-center relative">
        {/* Top badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 mt-4 inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.4em] text-gold/90 backdrop-blur-md md:mt-8"
        >
          Construido para Latinoamérica
        </motion.div>
        
        {/* Main heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white max-w-5xl mb-8 leading-[0.85] text-balance"
        >
          Todo el ecosistema en un{' '}
          <span className="relative inline-block">
            <span className="gradient-text-gold italic font-black">solo lugar</span>
            {/* Decorative underline */}
            <motion.span 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent origin-left"
            />
          </span>.
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-gray-400 text-base sm:text-lg md:text-2xl max-w-2xl mb-14 text-balance font-medium leading-relaxed"
        >
          Publicidad <span className="text-white font-semibold">offline</span>, servicios digitales, empleo y herramientas de élite.
          La infraestructura que tu negocio necesita para escalar.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full justify-center max-w-2xl mx-auto"
        >
          <AuthHeroButton className="flex-1" />
          <Button asChild variant="outline" size="lg" className="flex-1 border-border text-foreground/70 hover:text-foreground hover:bg-foreground/5 hover:border-foreground/20 h-16 md:h-20 px-8 md:px-10 rounded-[2rem] font-black uppercase tracking-widest text-[11px] md:text-sm bg-transparent transition-all duration-500 backdrop-blur-sm shadow-sm">
            <Link href="/por-que-mercav" className="flex items-center justify-center gap-3">
               <MonitorPlay className="h-5 w-5 opacity-60" />
               Ver cómo funciona
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export function HomeModules() {
  const modules = [
    { icon: Megaphone, title: "Mercav Ads", desc: "Alquilá espacios publicitarios físicos. Vallas, pantallas, vidrieras.", href: "/anuncios", accent: "from-amber-500/20 to-orange-500/20", iconBg: "bg-amber-500/10", iconColor: "text-amber-500" },
    { icon: MonitorPlay, title: "Mercav Services", desc: "Contratá talento digital con pagos seguros y contratos por hitos.", href: "/servicios", accent: "from-violet-500/20 to-purple-500/20", iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
    { icon: Briefcase, title: "Mercav Jobs", desc: "Publicá vacantes y encontrá al candidato ideal sin fricción.", href: "/empleos", accent: "from-emerald-500/20 to-teal-500/20", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { icon: Wrench, title: "Mercav Tools", desc: "Herramientas con IA, calculadoras de ROI y contratos.", href: "/herramientas", accent: "from-blue-500/20 to-cyan-500/20", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { icon: Shield, title: "Mercav Pwn", desc: "Consultá exposición, filtraciones y alertas. Ciberinteligencia para tu negocio.", href: "/pwn", accent: "from-red-500/20 to-rose-500/20", iconBg: "bg-red-500/10", iconColor: "text-red-400" },
    { icon: Star, title: "Mercav Kosher", desc: "Mapa de lugares, stock kosher y tu kehilá. Entras con tu cuenta Mercav.", href: "/kosher", accent: "from-sky-400/20 to-indigo-500/20", iconBg: "bg-techelet/15", iconColor: "text-techelet" },
  ];

  return (
    <section className="w-full py-24 md:py-32 bg-bg-primary relative overflow-hidden section-transition">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-[15%] h-[520px] w-[520px] rounded-full bg-gold/[0.08] blur-[160px]" />
        <div className="absolute bottom-1/4 right-[10%] h-[420px] w-[420px] rounded-full bg-violet-500/[0.07] blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.04] blur-[180px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Módulos del ecosistema
          </motion.span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight">
            Un universo de{' '}
            <span className="gradient-text-gold">posibilidades</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
            Seis módulos del ecosistema, de publicidad a comunidad y ciberinteligencia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <TiltCard className="h-full rounded-2xl">
              <Link href={mod.href} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-7 transition-colors duration-500 hover:border-gold/40 md:p-8 glassmorphism">
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                
                <div className="relative z-10">
                  <div className={`h-14 w-14 rounded-2xl ${mod.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 border border-white/5`}>
                    <mod.icon className={`h-6 w-6 ${mod.iconColor} group-hover:text-gold transition-colors duration-500`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold transition-colors duration-300">{mod.title}</h3>
                  <p className="text-gray-400 text-sm mb-8 flex-1 leading-relaxed">{mod.desc}</p>
                  <div className="flex items-center text-gold text-sm font-semibold group-hover:gap-4 transition-all duration-500">
                    Explorar módulo <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeLatestActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="blend-from-secondary w-full py-24 md:py-32 bg-bg-primary relative section-transition">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4"
        >
          <div>
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-4"
            >
              <Zap className="h-3.5 w-3.5" />
              Actividad en tiempo real
            </motion.span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Lo último en Mercav</h2>
            <p className="text-gray-400">Nuevas oportunidades en todo el ecosistema.</p>
          </div>
          <Link href="/explorar" className="hidden md:flex text-gold hover:text-gold-light items-center text-sm font-semibold group border border-gold/20 rounded-full px-5 py-2.5 hover:bg-gold/5 transition-all duration-300">
            Ver todo el feed <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-16 md:p-24 rounded-3xl bg-bg-secondary/50 border border-white/5 text-center glassmorphism"
          >
            <div className="h-24 w-24 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-8 float-gentle">
              <Megaphone className="h-12 w-12 text-gold/30" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Por el momento no hay anuncios</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
              Sé el primero en publicar tu servicio, valla publicitaria o vacante y llega a toda Latinoamérica.
            </p>
            <Button asChild className="bg-gold text-black font-bold h-12 px-8 rounded-xl hover:scale-105 transition-transform hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <Link href="/dashboard">Empezar a publicar</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-2xl overflow-hidden bg-bg-secondary/80 border border-border group hover:border-gold/40 transition-all duration-500 hover:shadow-lg hover:shadow-gold/5 flex flex-col h-full glassmorphism card-hover-premium"
              >
                <div className="aspect-video bg-bg-tertiary relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform duration-700">
                      {item.type === 'SPACE' && <Megaphone className="h-12 w-12 opacity-20" />}
                      {item.type === 'SERVICE' && <MonitorPlay className="h-12 w-12 opacity-20" />}
                      {item.type === 'JOB' && <Briefcase className="h-12 w-12 opacity-20" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent z-10 opacity-80" />
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                      item.type === 'SPACE' ? 'bg-blue-500/50' : 
                      item.type === 'SERVICE' ? 'bg-purple-500/50' : 'bg-green-500/50'
                    }`}>
                      {item.type === 'SPACE' ? 'Anuncio' : item.type === 'SERVICE' ? 'Servicio' : 'Vacante'}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-gold font-bold uppercase tracking-widest">{item.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-gold transition-colors line-clamp-2">{item.title}</h3>
                  <div className="flex flex-col gap-2 mb-6">
                    <p className="text-sm text-gray-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gold/60" /> {item.location}
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Hace {Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="font-mono text-gold font-bold text-lg">{item.price || 'Consultar'}</span>
                    <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white border border-transparent hover:border-border rounded-lg">
                      <Link href={
                        item.type === 'SPACE' ? `/anuncios/${item.id}` :
                        item.type === 'SERVICE' ? `/servicios/${item.id}` :
                        `/empleos/${item.id}`
                      }>Ver más</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HomeStats() {
  const stats = [
    { label: "Espacios Disponibles", val: "2,500+", icon: Globe },
    { label: "Servicios Activos", val: "10k+", icon: Zap },
    { label: "Empresas", val: "500+", icon: Shield },
    { label: "Países", val: "15", icon: TrendingUp },
  ];

  return (
    <section className="w-full py-24 md:py-28 bg-bg-primary relative overflow-hidden section-transition">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/[0.02] blur-[180px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl border border-transparent hover:border-gold/20 hover:bg-gold/[0.02] transition-all duration-500 group"
            >
              <div className="h-12 w-12 rounded-xl bg-gold/5 flex items-center justify-center mb-4 group-hover:bg-gold/10 group-hover:scale-110 transition-all duration-500">
                <stat.icon className="h-5 w-5 text-gold/60 group-hover:text-gold transition-colors duration-300" />
              </div>
              <span className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-gold mb-2 tracking-tight">{stat.val}</span>
              <span className="text-[11px] sm:text-sm text-gray-400 uppercase tracking-wider font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeCTA() {
  return (
    <section className="blend-from-primary blend-to-primary w-full py-28 md:py-36 bg-bg-secondary relative overflow-hidden section-transition">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-50" />
        {/* Floating orbs */}
        <div className="absolute top-20 left-[15%] w-32 h-32 bg-gold/[0.03] rounded-full blur-[80px] float-gentle" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 right-[20%] w-24 h-24 bg-gold/[0.04] rounded-full blur-[60px] float-gentle" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold"
          >
            <Star className="h-3.5 w-3.5" />
            Únete al ecosistema
          </motion.span>
          
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">
            Es hora de subir el{' '}
            <span className="gradient-text-gold">nivel.</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Únete a miles de empresas y profesionales en toda Latinoamérica que ya usan Mercav para crecer y conectar sin límites.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <AuthHeroButton label="Crear cuenta gratis" className="w-full max-w-xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
