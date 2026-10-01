"use client";

import { MapPin, Heart, Globe2, Target, ChevronRight, Sparkles, BookOpen, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TiltCard } from '@/components/motion/TiltCard';

// Custom Elegant SVGs for Social Icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

function StarOfDavid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" className={className} aria-hidden>
      <path d="M12 3.2 20.2 17.4H3.8Z" />
      <path d="M12 20.8 3.8 6.6h16.4Z" />
    </svg>
  );
}

function FounderCard() {
  return (
    <div className="group relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-gold/0 via-gold/15 to-gold/0 opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />
      <TiltCard className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-bg-secondary/60 shadow-xl glassmorphism transition-colors duration-500 hover:border-gold/30">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-bg-tertiary">
          <img
            src="/images/vinicius.jpg"
            alt="Vinicius, fundador de Mercav, en Santa Cruz"
            className="h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-secondary to-transparent blur-md" />
          <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl md:left-5 md:top-5 md:px-4 md:py-2">
            Santa Cruz
          </div>
          <div className="absolute right-4 top-4 rounded-xl bg-gold/90 p-2 text-black shadow-xl shadow-gold/20 md:right-5 md:top-5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 md:p-8">
          <div className="mb-4">
            <h3 className="font-display text-xl font-bold leading-tight text-white transition-colors duration-300 group-hover:text-gold md:text-2xl">
              Vinicius
            </h3>
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              <BookOpen className="h-3 w-3 text-gold/60" aria-hidden />
              Fundador de Mercav
            </p>
          </div>

          <p className="mb-6 text-pretty text-sm leading-relaxed text-gray-400">
            19 años. Santa Cruz de la Sierra. Sistemas, ciberseguridad y un producto que tiene que poder usarse entero.
          </p>

          <div className="mt-auto space-y-3 border-t border-white/5 pt-5 md:pt-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              <MapPin className="h-3 w-3 text-gold/60" aria-hidden />
              Santa Cruz, Bolivia
            </div>
            <a
              href="https://askforvini.pw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              <Globe2 className="h-3 w-3 text-gold/60" aria-hidden />
              askforvini.pw
            </a>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

export default function Nosotros() {
  return (
    <div className="relative w-full min-h-dvh overflow-x-hidden bg-bg-primary pt-[calc(6.5rem+env(safe-area-inset-top,0px))] pb-16 text-white selection:bg-gold/30 selection:text-gold">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-32 bg-gradient-to-b from-bg-primary via-bg-primary/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-gold/5 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[180px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Section Header: Minimalist & Elegant */}
        <div className="mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] text-gold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              Quién soy
            </motion.div>
            
            <h1 className="max-w-full break-words font-display text-[clamp(2.4rem,14vw,6rem)] font-black leading-[0.9] tracking-tighter text-white">
              VINICIUS
            </h1>
            
            <p className="max-w-2xl text-pretty text-base font-light leading-relaxed text-gray-500 md:text-xl">
              Fundador de Mercav. 19 años. Santa Cruz de la Sierra. Sistemas, ciberseguridad y una plataforma que se pueda usar de verdad.
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
          {/* Left: Founder Card */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <FounderCard />
            
            {/* Social Links - Reimagined as elegant chips */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {[
                { name: 'askforvini.pw', icon: Globe2, href: 'https://askforvini.pw' },
                { name: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/askforvini/' },
                { name: 'LinkedIn', icon: LinkedinIcon, href: 'https://www.linkedin.com/in/vinicius-salazar-54700938a/' },
                { name: 'GitHub', icon: GithubIcon, href: 'https://github.com/invertilo' }
              ].map((social, i) => (
                <motion.a 
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all group"
                >
                  <social.icon className="h-4 w-4 text-gray-500 group-hover:text-gold transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{social.name}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Right: The Story */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-7 space-y-16"
          >
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">Presentación</h2>
                <p className="max-w-full break-words font-display text-2xl font-medium leading-snug text-white sm:text-3xl md:text-4xl" lang="he" dir="rtl">
                  בעזרת השם, כל עכבה לטובה.
                </p>
                <p className="text-sm text-gray-500 font-light">
                  Con la ayuda del Creador, cada demora es para bien.
                </p>
                <div className="h-px w-24 bg-gradient-to-r from-gold to-transparent" />
              </div>

              <div className="space-y-8 text-gray-400 text-lg leading-relaxed font-light">
                <p>
                  Me llamo <span className="text-white font-semibold">Vinicius</span>. Tengo 19 años y vivo en Santa Cruz de la Sierra, Bolivia. Soy el fundador de Mercav: diseño la lógica de los sistemas —APIs, autenticación, datos, reglas de negocio— y trabajo ciberseguridad: pentesting autorizado, defensa, auditoría y respuesta post-incidente. El perfil técnico está en{" "}
                  <a href="https://askforvini.pw" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline underline-offset-4">
                    askforvini.pw
                  </a>
                  .
                </p>
                <p>
                  Aprendí el oficio construyendo software para negocios reales, no recitando teoría. Mercav es el resultado de ese trabajo: anuncios, servicios, empleo, herramientas y ciberinteligencia en una sola plataforma, hecha desde Bolivia para quien necesita usarla de verdad.
                </p>
                
                <aside className="rounded-3xl border border-gold/25 bg-gold/[0.06] p-6 md:p-8">
                  <div className="flex items-start gap-4 md:gap-5">
                    <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                      <StarOfDavid className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 space-y-3">
                      <p className="font-sans text-base leading-7 tracking-normal text-white md:text-lg">
                        Agradezco a Hashem el conocimiento con el que puedo desarrollar este sistema.
                      </p>
                      <p className="font-sans text-base leading-7 tracking-normal text-gray-300 md:text-[17px]">
                        Mis creencias y valores piden que no quede a medias: que se entienda, esté completo y cualquiera pueda usarlo.
                      </p>
                    </div>
                  </div>
                </aside>

                <p>
                  La observancia ordena el día con la misma seriedad con la que reviso un sistema. Ante el Creador, el trabajo tiene que ser limpio, ayudar a otras personas y no usar a nadie como medio.
                </p>
                <p>
                  Quiero ayudar. Mercav tiene que ser usable de punta a punta: publicar, contratar, buscar empleo o consultar una herramienta sin perderse. Kerem y Mercav Kosher siguen el mismo criterio: un estándar verificable y un servicio que se pueda usar.
                </p>
              </div>
            </div>

          </motion.div>
        </div>

        <section className="blend-from-primary relative mx-auto mt-28 max-w-5xl section-transition" aria-labelledby="como-trabajo-title">
          <h3 id="como-trabajo-title" className="mb-3 text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Cómo trabajo
          </h3>
          <p className="mx-auto mb-8 max-w-2xl text-center font-sans text-sm leading-6 tracking-normal text-gray-400">
            Backend, ciberseguridad y un producto que tiene que cerrar bien. El detalle está en askforvini.pw.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Sistemas",
                body: "Diseño el servicio, lo pruebo y lo cierro. APIs, autenticación y datos que tienen que sostener carga.",
              },
              {
                icon: Shield,
                title: "Ciberseguridad",
                body: "Pentesting autorizado, seguridad defensiva, auditoría y respuesta post-incidente: qué pasó, qué quedó expuesto y qué hay que cerrar.",
              },
              {
                icon: StarOfDavid,
                title: "Fe",
                body: "Agradezco a Hashem el conocimiento para construir. Ante el Creador, el trabajo pide la misma seriedad que el resto del día.",
              },
              {
                icon: Heart,
                title: "Valores",
                body: "Ayudar a otras personas. Si el producto no sirve a alguien concreto, no vale.",
              },
              {
                icon: BookOpen,
                title: "Uso",
                body: "Claro, completo y al alcance. Nadie debería perderse para publicar, contratar o consultar.",
              },
              {
                icon: Sparkles,
                title: "Cierre",
                body: "No publica recetas de ataque. Documenta el fallo y el arreglo. El informe tiene que servir para defender.",
              },
            ].map((item, i) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-transparent bg-bg-secondary/40 p-6 sm:p-7 backdrop-blur-xl transition-colors duration-500 hover:border-gold/20 hover:bg-gold/[0.03]"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
                  <item.icon className="h-5 w-5" />
                </div>
                <h4 className="font-sans text-base font-semibold tracking-normal text-white">{item.title}</h4>
                <p className="mt-2 font-sans text-sm leading-6 tracking-normal text-gray-300">{item.body}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </div>

      <section className="blend-from-primary blend-to-primary relative mt-48 overflow-hidden bg-bg-secondary section-transition">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] opacity-[0.03] grayscale mix-blend-screen scale-110 group-hover:scale-100 transition-transform duration-[3s]" />
            
            <div className="container relative mx-auto flex min-h-[600px] max-w-7xl flex-col px-6 lg:flex-row">
              <div className="relative z-10 flex flex-1 flex-col justify-center space-y-10 py-12 md:p-16 lg:py-20">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[9px] font-black uppercase tracking-[0.3em] text-gold">
                    Hospitalidad · Santa Cruz
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter">
                    KEREM <br />
                    <span className="italic font-light text-gold tracking-normal normal-case">by Mercav</span>
                  </h2>
                </div>

                <div className="space-y-6 font-sans text-lg font-normal leading-7 tracking-normal text-pretty text-gray-400">
                  <p>
                    <span className="font-medium text-white">Kerem</span> es un proyecto de hospitalidad en Santa Cruz de la Sierra. El estándar es kashrut: ingredientes, cocina y servicio con el mismo rigor que aplico a un sistema.
                  </p>
                  <p className="rounded-r-3xl border-l-2 border-gold/30 bg-gold/5 p-8 font-sans text-base leading-7 tracking-normal text-pretty text-white/90 md:text-[17px]">
                    El criterio es el mismo en la cocina y en el código: que el estándar se pueda verificar y que el servicio se pueda usar.
                  </p>
                  <p>
                    <Link href="/kosher" className="text-gold underline-offset-4 hover:underline">Mercav Kosher</Link> es la capa digital: un directorio de lugares y servicios. No emite certificación ni sustituye a una agencia. Informa, con fuente, para quien necesita decidir.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                   {[
                     { label: "ESTÁNDAR", val: "Kashrut" },
                     { label: "SEDE", val: "Santa Cruz" },
                     { label: "ALCANCE", val: "Bolivia" },
                     { label: "DIRECTORIO", val: "Mercav Kosher" }
                   ].map(item => (
                     <div key={item.label} className="space-y-1">
                        <p className="text-[8px] font-black text-gold/60 tracking-widest uppercase">{item.label}</p>
                        <p className="text-sm font-bold text-white uppercase tracking-tighter">{item.val}</p>
                     </div>
                   ))}
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden h-[400px] lg:h-auto">
                <img 
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" 
                  className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 scale-105 group-hover:scale-100" 
                  alt="Kerem Gastronomía" 
                />
                <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-bg-secondary via-bg-secondary/55 to-transparent lg:block" />
                <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-bg-secondary/80 blur-2xl lg:block" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/40 to-transparent lg:hidden" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-bg-secondary/70 blur-xl lg:hidden" />
                
                {/* Floating Elements on Image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="w-64 h-64 border border-gold/20 rounded-full opacity-30 flex items-center justify-center"
                   >
                      <div className="w-48 h-48 border border-gold/10 rounded-full" />
                   </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
      </section>

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="mt-48 space-y-24">
          <div className="text-center space-y-4">
             <h2 className="font-display text-4xl font-bold tracking-tight">El trabajo, en orden</h2>
             <p className="text-gray-500 font-light">Sistemas, ciberseguridad, fe y un producto que tiene que servir.</p>
          </div>
          
          <div className="relative mx-auto max-w-5xl px-2 sm:px-10">
            <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/30 to-transparent md:block" />
            
            <div className="space-y-16 md:space-y-32">
              {[
                { time: "Oficio", title: "Sistemas y seguridad", desc: "Backend, pentesting autorizado, defensa y respuesta post-incidente. El detalle está en askforvini.pw." },
                { time: "Fe", title: "Observancia", desc: "El día se ordena ante el Creador. El trabajo se mide con esa misma seriedad." },
                { time: "Comunidad", title: "Santa Cruz", desc: "Devolver la generosidad es construir algo que cualquiera pueda usar entero." },
                { time: "Servicio", title: "Mercav", desc: "Anuncios, servicios, empleo, herramientas y lo kosher: una plataforma para ayudar." }
              ].map((milestone, index) => (
                <motion.div 
                  key={milestone.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  className={`flex flex-col items-center gap-4 text-center md:gap-20 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-gold">{milestone.time}</span>
                    <h3 className="mb-3 text-2xl font-bold tracking-tight text-white">{milestone.title}</h3>
                    <p className="mx-auto max-w-xs text-pretty text-sm leading-relaxed text-gray-500 md:mx-0">{milestone.desc}</p>
                  </div>
                  
                  <div className="relative flex-shrink-0 z-10">
                    <div className="h-10 w-10 rounded-full bg-black border-2 border-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                       <div className="h-2 w-2 rounded-full bg-gold animate-ping" />
                    </div>
                  </div>
                  
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="blend-from-primary blend-to-primary relative mt-48 overflow-hidden bg-bg-secondary px-6 py-16 text-center section-transition md:px-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-50" />
        <div className="pointer-events-none absolute left-[15%] top-16 h-32 w-32 rounded-full bg-gold/[0.03] blur-[80px]" />
        <div className="pointer-events-none absolute bottom-16 right-[20%] h-24 w-24 rounded-full bg-gold/[0.04] blur-[60px]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-3xl space-y-12"
        >
            <div className="space-y-6">
              <h2 className="max-w-full break-words font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
                Si quieres <span className="font-light italic text-gold">hablar</span>
              </h2>
              <p className="font-sans text-lg font-normal leading-7 tracking-normal text-pretty text-gray-400">
                Puedes usar Mercav, leer el oficio en askforvini.pw o escribirme. El trabajo se toma en serio.
              </p>
            </div>
            
            <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link href="/register" className="group relative w-full max-w-xs overflow-hidden rounded-full bg-gold px-10 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95 sm:w-auto">
                <span className="relative z-10 flex items-center gap-3">
                  Crear cuenta <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 translate-y-full bg-white opacity-20 transition-transform duration-300 group-hover:translate-y-0" />
              </Link>
              
              <a href="https://askforvini.pw" target="_blank" rel="noopener noreferrer" className="w-full max-w-xs rounded-full border border-white/10 px-10 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 transition-all hover:border-gold/50 hover:bg-gold/5 hover:text-white sm:w-auto">
                askforvini.pw
              </a>
            </div>
        </motion.div>
      </section>

      <div className="mt-32 text-center text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">
           Mercav © {new Date().getFullYear()} — Santa Cruz de la Sierra.
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
