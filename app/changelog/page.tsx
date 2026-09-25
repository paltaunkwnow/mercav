"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  Calendar, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Rocket, 
  Bug, 
  Wrench,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const UPDATES = [
  {
    version: "v1.2.0",
    date: "7 de Mayo, 2026",
    title: "Ecosistema de Moderación y Feed Inteligente",
    description: "Una actualización masiva centrada en el control del contenido y la experiencia de usuario premium.",
    type: "MAJOR",
    tags: ["Moderación", "Feed", "UI/UX"],
    changes: [
      { type: "feature", text: "Sistema de edición y eliminación de publicaciones para autores." },
      { type: "feature", text: "Panel de moderación avanzado para administradores." },
      { type: "improvement", text: "Nuevas notificaciones Toast personalizadas con animaciones físicas." },
      { type: "fix", text: "Corrección de persistencia en la compleción del perfil (F5 bug)." },
      { type: "improvement", text: "Filtros inteligentes por ubicación y tipo de módulo en el feed." }
    ]
  },
  {
    version: "v1.1.5",
    date: "5 de Mayo, 2026",
    title: "Arquitectura de Perfil Profesional",
    description: "Transformamos los perfiles para que actúen como tu carta de presentación ante el mundo.",
    type: "FEATURE",
    tags: ["Perfiles", "LinkedIn-Style"],
    changes: [
      { type: "feature", text: "Sección de experiencia laboral con validación de fechas." },
      { type: "feature", text: "Sistema de habilidades con niveles de maestría." },
      { type: "improvement", text: "Optimización de carga para imágenes de alta resolución." }
    ]
  },
  {
    version: "v1.1.0",
    date: "1 de Mayo, 2026",
    title: "Lanzamiento Oficial de Mercav",
    description: "El nacimiento del ecosistema definitivo para profesionales y empresas en Latinoamérica.",
    type: "RELEASE",
    tags: ["Lanzamiento", "Seguridad"],
    changes: [
      { type: "feature", text: "Lanzamiento del Feed General Multimodal." },
      { type: "feature", text: "Autenticación de dos factores (2FA) via App." },
      { type: "feature", text: "Módulos base de Empleos y Servicios activos." }
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-bg-primary pt-32 pb-32 overflow-hidden selection:bg-gold/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-gold/3 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <header className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-bg-secondary border border-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-8 shadow-xl shadow-black/40"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
            Product Updates
          </motion.div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Nuestra <span className="text-gold italic font-light pr-4">Evolución</span>
          </h1>
          
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Documentamos cada paso que damos para construir el futuro de la red profesional en Latinoamérica.
          </p>
        </header>

        <div className="relative">
          {/* Main Timeline Axis */}
          <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/50 via-white/5 to-transparent" />

          <div className="space-y-24">
            {UPDATES.map((update, i) => (
              <motion.div
                key={update.version}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex flex-col md:flex-row gap-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Center Node */}
                <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-0 z-20">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-gold blur-lg opacity-20" />
                    <div className="h-4 w-4 rounded-full bg-gold border-4 border-bg-primary ring-8 ring-gold/5 shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                  </div>
                </div>

                <div className="flex-1 pl-16 md:pl-0">
                  <div className="group relative">
                    {/* Version Badge Float */}
                    <div className={`absolute -top-12 ${i % 2 === 0 ? 'md:left-0' : 'md:right-0'} hidden md:block`}>
                       <span className="text-5xl font-display font-black text-white/5 select-none">{update.version}</span>
                    </div>

                    <div className="p-8 md:p-10 rounded-[3rem] border border-white/5 bg-bg-secondary/40 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-gold/20 hover:bg-bg-secondary/60 group-hover:shadow-gold/5">
                      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <Calendar className="h-4 w-4 text-gold" />
                             <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">{update.date}</span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-gold transition-colors duration-500">{update.title}</h2>
                        </div>
                        
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                          update.type === 'MAJOR' ? 'bg-gold text-black' : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}>
                          {update.type}
                        </div>
                      </div>

                      <p className="text-gray-400 text-lg leading-relaxed mb-8 font-medium italic">
                        "{update.description}"
                      </p>

                      <div className="flex flex-wrap gap-2 mb-10">
                        {update.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-lg bg-bg-tertiary border border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-4 border-t border-white/5 pt-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-6">Detalles del cambio</h4>
                        {update.changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-4 group/item">
                            <div className={`mt-1 h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border border-white/5 transition-colors ${
                              change.type === 'feature' ? 'bg-gold/10 text-gold group-hover/item:bg-gold group-hover/item:text-black' : 
                              change.type === 'fix' ? 'bg-red-500/10 text-red-500 group-hover/item:bg-red-500 group-hover/item:text-white' :
                              'bg-blue-500/10 text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white'
                            }`}>
                              {change.type === 'feature' ? <Rocket className="h-3 w-3" /> : 
                               change.type === 'fix' ? <Bug className="h-3 w-3" /> : 
                               <Wrench className="h-3 w-3" />}
                            </div>
                            <span className="text-sm md:text-base text-gray-300 leading-relaxed group-hover/item:text-white transition-colors">
                              {change.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Side Info (Desktop Only) */}
                <div className="flex-1 hidden md:flex flex-col justify-center">
                   <div className={`${i % 2 === 0 ? 'text-left pr-20' : 'text-right pl-20'}`}>
                      <div className="inline-block px-6 py-4 rounded-[2rem] bg-bg-secondary/20 border border-white/5 backdrop-blur-sm">
                        <div className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-1">Status</div>
                        <div className="flex items-center gap-2 text-white font-bold">
                           <CheckCircle2 className="h-4 w-4 text-green-500" /> Desplegado
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enhanced Footer CTA */}
        <motion.footer 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-40 relative group"
        >
          <div className="absolute inset-0 bg-gold/5 blur-[100px] rounded-full group-hover:bg-gold/10 transition-all duration-1000" />
          
          <div className="relative p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-bg-secondary to-bg-primary border border-white/5 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 -mr-10 -mt-10 group-hover:rotate-12 transition-transform duration-700">
              <Zap className="h-64 w-64 text-gold" />
            </div>
            
            <div className="max-w-2xl">
              <div className="h-14 w-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-8">
                <Sparkles className="h-6 w-6 text-gold" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Moldeemos Mercav <br/> <span className="text-gold italic font-light pr-4">Juntos.</span>
              </h2>
              <p className="text-gray-400 text-lg md:text-xl mb-12 leading-relaxed font-medium">
                Tu feedback es el motor de nuestra innovación. Si tienes una idea que pueda potenciar el ecosistema, queremos escucharla ahora mismo.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-[1.5rem] h-16 px-10 font-black uppercase tracking-[0.2em] shadow-2xl shadow-gold/10 group/btn">
                  <Link href="/contacto">
                    Enviar Sugerencia 
                    <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="text-gray-400 hover:text-white rounded-[1.5rem] h-16 px-8 font-black uppercase tracking-[0.2em]">
                  <Link href="/nosotros">Nuestro Manifiesto</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
