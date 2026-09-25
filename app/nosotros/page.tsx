"use client";

import { Briefcase, Code, MapPin, Rocket, Heart, Globe2, Lightbulb, Target, Award, UtensilsCrossed, Check, Camera, ChevronRight, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

function FloatingCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(y, [-150, 150], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-15, 15]), { stiffness: 300, damping: 30 });
  const scale = useSpring(isHovered ? 1.08 : 1, { stiffness: 300, damping: 30 });

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <div className="perspective-[1500px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-sm mx-auto cursor-pointer"
      >
        {/* Advanced Glow effect */}
        <motion.div 
          animate={{ 
            opacity: isHovered ? 0.8 : 0.3,
            scale: isHovered ? 1.1 : 1
          }}
          className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-gold/30 via-gold/10 to-transparent blur-3xl -z-10 transition-all duration-500"
        />
        
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/60 group">
          {/* Animated border line */}
          <div className="absolute inset-0 rounded-[2.5rem] p-[1px] bg-gradient-to-br from-gold/50 via-transparent to-white/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative h-full w-full bg-bg-secondary/80 rounded-[2.5rem] overflow-hidden">
            {/* Photo with scanline effect */}
            <div className="aspect-[4/5] relative overflow-hidden">
              <img 
                src="/images/vinicius.jpg" 
                alt="Vinicius - Fundador de Mercav" 
                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/10 to-transparent" />
              
              {/* Scanline light effect */}
              <motion.div 
                animate={{ top: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[20%] bg-gradient-to-b from-transparent via-gold/10 to-transparent pointer-events-none"
              />
              
              {/* Badge overlay */}
              <div className="absolute top-6 right-6" style={{ transform: "translateZ(60px)" }}>
                <motion.div 
                  className="bg-black/60 backdrop-blur-xl border border-gold/40 text-gold text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl"
                >
                  <Rocket className="h-3 w-3" />
                  Visionary
                </motion.div>
              </div>
            </div>
            
            {/* Card info */}
            <div className="p-8 -mt-20 relative z-10" style={{ transform: "translateZ(40px)" }}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="font-display text-3xl font-bold text-white tracking-tight">Vinicius</h3>
                  <p className="text-gold text-xs font-black uppercase tracking-[0.2em] mt-1">Founder & CEO</p>
                </div>
                <div className="h-10 w-10 rounded-full border border-gold/20 flex items-center justify-center bg-gold/5">
                   <Sparkles className="h-4 w-4 text-gold" />
                </div>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                18 años. Autodidacta. Redefiniendo la infraestructura digital de Latinoamérica a través de la tecnología y la comunidad.
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                  <div className="h-6 w-6 rounded-lg bg-gold/5 border border-gold/10 flex items-center justify-center text-gold">
                    <MapPin className="h-3 w-3" />
                  </div>
                  Bolivia → Latam
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                  <div className="h-6 w-6 rounded-lg bg-gold/5 border border-gold/10 flex items-center justify-center text-gold">
                    <Globe2 className="h-3 w-3" />
                  </div>
                  Building in Public
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Nosotros() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="w-full min-h-screen bg-[#030303] text-white selection:bg-gold/30 selection:text-gold pt-24 pb-32 overflow-hidden relative">
      {/* Cinematic background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gold/3 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
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
              Manifesto
            </motion.div>
            
            <h1 className="font-display text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
              DETRÁS DE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gold/80 to-gold">LA VISIÓN.</span>
            </h1>
            
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              Mercav no es una empresa, es la evolución digital de una región que siempre tuvo el talento pero nunca tuvo la plataforma.
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-20 items-start">
          {/* Left: Founder Card */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <FloatingCard />
            
            {/* Social Links - Reimagined as elegant chips */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {[
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
                <h2 className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">El Origen</h2>
                <p className="text-3xl md:text-4xl font-display font-medium text-white leading-tight">
                  "El conocimiento verdadero no se recibe, se construye."
                </p>
                <div className="h-px w-24 bg-gradient-to-r from-gold to-transparent" />
              </div>

              <div className="space-y-8 text-gray-400 text-lg leading-relaxed font-light">
                <p>
                  Me llamo <span className="text-white font-bold">Vinicius</span>, y a los 18 años decidí que el sistema tradicional de aprendizaje no era suficiente para los desafíos que enfrentaba mi generación. 
                </p>
                <p>
                  No aprendí en un aula llena de teorías. Aprendí en la trinchera del código, construyendo soluciones reales para personas reales. Esa es la esencia de Mercav: una infraestructura nacida de la necesidad tangible, no de la especulación académica.
                </p>
                
                <div className="relative py-10 px-8 rounded-3xl bg-gold/5 border-l-4 border-gold group overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                      <Rocket className="h-20 w-20 text-gold" />
                   </div>
                   <p className="text-xl text-white font-medium italic relative z-10">
                     "Construí Mercav porque vi de cerca lo difícil que es para una empresa pequeña en Latinoamérica conseguir visibilidad sin que los intermediarios se lleven todo el valor."
                   </p>
                </div>

                <p>
                  Empezamos en Bolivia, pero nuestro ADN es regional. Estamos diseñando la red que conectará a todo un continente, eliminando las fricciones y democratizando el acceso a las herramientas que antes solo las grandes corporaciones podían costear.
                </p>
              </div>
            </div>

            {/* Core Values - Elegant Grid */}
            <div className="pt-16 space-y-12">
               <h3 className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">Pilares Fundamentales</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: Target, title: "Propósito Directo", desc: "Eliminamos el ruido. Cada línea de código es una solución directa a un problema de mercado." },
                    { icon: Lightbulb, title: "Innovación Pura", desc: "No iteramos sobre lo viejo, reimaginamos lo posible desde la arquitectura base." },
                    { icon: Award, title: "Excelencia Sin Fin", desc: "El estándar 'suficiente' no existe en Mercav. Buscamos la perfección en la experiencia." },
                    { icon: Sparkles, title: "Visión Global", desc: "Nacidos en Bolivia, pensados para el mundo. Latam es solo el primer paso." }
                  ].map((v, i) => (
                    <motion.div 
                      key={v.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-gold/[0.03] hover:border-gold/20 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-gold/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <v.icon className="h-5 w-5 text-gold" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{v.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                    </motion.div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>

        {/* Kerem by Mercav - Culinary Excellence Section */}
        <div className="mt-48">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[4rem] bg-[#080808] border border-white/5 overflow-hidden group shadow-3xl"
          >
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] opacity-[0.03] grayscale mix-blend-screen scale-110 group-hover:scale-100 transition-transform duration-[3s]" />
            
            <div className="flex flex-col lg:flex-row min-h-[600px]">
              <div className="flex-1 p-12 md:p-20 flex flex-col justify-center space-y-10 relative z-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[9px] font-black uppercase tracking-[0.3em] text-gold">
                    Haute Cuisine Evolution
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter">
                    KEREM <br />
                    <span className="italic font-light text-gold tracking-normal normal-case">by Mercav</span>
                  </h2>
                </div>

                <div className="space-y-6 text-gray-400 text-lg font-light leading-relaxed">
                  <p>
                    Mercav trasciende lo digital para tocar la realidad cotidiana. <span className="text-white font-medium">Kerem</span> es nuestra respuesta a una necesidad vital: gastronomía Kosher de clase mundial en Bolivia.
                  </p>
                  <p className="p-8 border-l-2 border-gold/30 bg-gold/5 italic text-white/90 rounded-r-3xl">
                    "La pureza no es un ingrediente, es nuestra ley fundamental."
                  </p>
                  <p>
                    Una propuesta 100% saludable, libre de derivados de cerdo y procesamientos industriales innecesarios. Es la excelencia nutricional al servicio de la comunidad.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                   {[
                     { label: "CERTIFICACIÓN", val: "Kosher Estricta" },
                     { label: "FILOSOFÍA", val: "100% Saludable" },
                     { label: "INGREDIENTES", val: "Cero Cerdo" },
                     { label: "ALCANCE", val: "Regional Latam" }
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-transparent hidden lg:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent lg:hidden" />
                
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
        </div>

        {/* Timeline: Project Milestones - Reimagined as "Growth Map" */}
        <div className="mt-48 space-y-24">
          <div className="text-center space-y-4">
             <h2 className="font-display text-4xl font-bold tracking-tight">MAPA DE CRECIMIENTO</h2>
             <p className="text-gray-500 font-light">La evolución constante de un ecosistema en expansión.</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto px-10">
            {/* Center Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent -translate-x-1/2" />
            
            <div className="space-y-32">
              {[
                { time: "Day 01", title: "Conceptualización", desc: "Nace el manifiesto de Mercav: conectar Latam sin fricciones." },
                { time: "Phase 01", title: "Core Engine", desc: "Desarrollo de la infraestructura base y algoritmos de conexión." },
                { time: "Phase 02", title: "Beta Deploy", desc: "Lanzamiento controlado en Bolivia para validar métricas reales." },
                { time: "Phase 03", title: "Regional Expansion", desc: "Apertura del ecosistema a toda Latinoamérica." }
              ].map((milestone, index) => (
                <motion.div 
                  key={milestone.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  className={`flex items-center gap-10 md:gap-20 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <span className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">{milestone.time}</span>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{milestone.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs ml-auto mr-0 md:mx-0">{milestone.desc}</p>
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

        {/* Exclusive CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-48 relative p-16 md:p-24 rounded-[3.5rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 text-center overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-50" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-12">
            <div className="space-y-6">
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-white">
                ¿LISTO PARA <br /> <span className="text-gold italic font-light">REESCRIBIR</span> LA HISTORIA?
              </h2>
              <p className="text-gray-400 text-lg font-light">
                Estamos construyendo algo que trasciende el software. Estamos construyendo comunidad. Únete al movimiento.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/register" className="group relative px-10 py-5 bg-gold text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95">
                <span className="relative z-10 flex items-center gap-3">
                  Unirse Ahora <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-20" />
              </Link>
              
              <Link href="/inversores" className="px-10 py-5 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:border-gold/50 hover:bg-gold/5 transition-all">
                Inversores
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer Minimalist Tag */}
        <div className="mt-32 text-center text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">
           Mercav © {new Date().getFullYear()} — Built for Latin America.
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
