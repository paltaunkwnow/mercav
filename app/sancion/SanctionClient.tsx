"use client";

import { useState } from "react";
import { ShieldAlert, Clock, LogOut, Mail, ChevronRight, Scale, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface SanctionClientProps {
  user: any;
  days: number | null;
  hours: number | null;
  timeLeft: number | null;
}

export default function SanctionClient({ user, days, hours, timeLeft }: SanctionClientProps) {
  const [showAppeal, setShowAppeal] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
          <ShieldAlert size={800} className="text-red-500 absolute -top-40 -left-40 rotate-12" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-black/40 border border-red-500/10 rounded-[4rem] p-12 md:p-20 relative z-10 shadow-[0_0_100px_rgba(239,68,68,0.05)] backdrop-blur-3xl text-center"
      >
        <AnimatePresence mode="wait">
          {!showAppeal ? (
            <motion.div
              key="sanction-info"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-center mb-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-red-500/20 rounded-[2.5rem] blur-2xl group-hover:bg-red-500/40 transition-all duration-700" />
                  <div className="relative w-28 h-28 bg-black/50 rounded-[2.5rem] flex items-center justify-center border border-red-500/30 shadow-2xl">
                    <ShieldAlert className="text-red-500 w-14 h-14" />
                  </div>
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-8 uppercase text-white leading-none">
                ACCESO <span className="text-red-500 block">RESTRINGIDO</span>
              </h1>
              
              <div className="flex items-center justify-center gap-2 mb-10">
                <div className="h-[1px] w-12 bg-red-500/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/50">Mercav Security Protocol v4.0.1</span>
                <div className="h-[1px] w-12 bg-red-500/30" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] text-left group hover:bg-white/[0.04] transition-all">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
                     <Scale size={12} className="text-red-500" /> Motivo del Procedimiento
                  </p>
                  <p className="text-lg text-white font-bold leading-relaxed italic">
                    "{user.sanctionReason || "Violación de los términos de servicio de la plataforma."}"
                  </p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] text-left group hover:bg-white/[0.04] transition-all">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
                     <Clock size={12} className="text-gold" /> Tiempo Restante
                  </p>
                  <p className="text-white font-mono text-5xl font-black tracking-tighter">
                    {timeLeft === null ? "INF" : `${days}D ${hours}H`}
                  </p>
                  <p className="text-[9px] text-gray-600 mt-2 font-black uppercase tracking-widest">
                    {timeLeft === null ? "Suspensión Permanente" : "Cuenta en revisión temporal"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <Button 
                  onClick={() => setShowAppeal(true)}
                  className="flex-1 h-20 bg-white/5 border border-white/10 hover:bg-white text-white hover:text-black rounded-3xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 group"
                >
                  <Mail className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" /> Apelar Sanción
                </Button>
                
                <Button 
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  variant="ghost" 
                  className="flex-1 h-20 text-gray-600 hover:text-red-500 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center transition-all"
                >
                  <LogOut className="w-5 h-5 mr-4" /> Desconectar
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="appeal-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-left"
            >
              <button 
                onClick={() => setShowAppeal(false)}
                className="inline-flex items-center text-gray-500 hover:text-white transition-colors mb-12 text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Volver a los detalles
              </button>

              <h2 className="text-4xl font-display font-black tracking-tighter mb-8 uppercase text-white">
                Procedimiento de <span className="text-red-500">Apelación</span>
              </h2>

              <div className="space-y-10">
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
                  <p className="text-gray-400 text-lg leading-relaxed mb-10">
                    Si consideras que esta sanción es un error, debes iniciar un proceso de revisión formal enviando un correo electrónico a nuestro departamento legal y de soporte técnico.
                  </p>

                  <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                      <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Correo Electrónico</p>
                        <p className="text-xl font-bold text-white">soporte@mercav.lat</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                      <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Instrucciones</p>
                        <ul className="text-sm text-gray-400 space-y-2 list-disc ml-4">
                          <li>Menciona tu nombre de usuario y correo de registro.</li>
                          <li>Explica detalladamente el contexto de tu sanción.</li>
                          <li>Proporciona pruebas si consideras que la sanción es injusta.</li>
                          <li>Explica por qué deberíamos remover la restricción.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-green-500/5 border border-green-500/10 p-6 rounded-3xl">
                   <ShieldCheck className="text-green-500 w-6 h-6 shrink-0" />
                   <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
                      Tu solicitud será revisada en un plazo máximo de 48 a 72 horas hábiles.
                   </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-20 flex flex-col items-center gap-2">
           <p className="text-[10px] text-gray-800 font-black uppercase tracking-[0.5em] mb-4">Case ID: {user.id.slice(0, 12).toUpperCase()}</p>
           <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

function FileText({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
