"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Lightbulb, 
  Flag, 
  Copy, 
  Check, 
  Mail, 
  ExternalLink,
  MessageCircle,
  Globe,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_CHANNELS = [
  {
    id: "fraud",
    title: "Reportes de Fraude",
    email: "fraud@mercav.lat",
    description: "Si detectas actividad sospechosa, estafas o suplantación de identidad en la plataforma.",
    icon: ShieldAlert,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  {
    id: "suggestions",
    title: "Sugerencias e Ideas",
    email: "sugerencias@mercav.lat",
    description: "Queremos mejorar contigo. Envíanos tus ideas para nuevas funciones o mejoras visuales.",
    icon: Lightbulb,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/20"
  },
  {
    id: "reports",
    title: "Reportes Generales",
    email: "reportes@mercav.lat",
    description: "Para problemas técnicos, errores en el feed o comportamiento inapropiado de usuarios.",
    icon: Flag,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  }
];

export default function ContactoPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-32 pb-32 overflow-hidden selection:bg-gold/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-gold/3 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <header className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-bg-secondary border border-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-8 shadow-xl shadow-black/40"
          >
            <Mail className="h-3 w-3" /> Canales de Soporte
          </motion.div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Estamos para <span className="text-gold italic font-light pr-4">Ayudarte</span>
          </h1>
          
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Selecciona el canal adecuado para tu solicitud. Nuestro equipo revisa cada comunicación manualmente.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {CONTACT_CHANNELS.map((channel, i) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[2.5rem] bg-bg-secondary/40 backdrop-blur-xl border ${channel.borderColor} flex flex-col group hover:bg-bg-secondary/60 transition-all duration-500`}
            >
              <div className={`h-14 w-14 rounded-2xl ${channel.bgColor} ${channel.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <channel.icon className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-gold transition-colors">{channel.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
                {channel.description}
              </p>

              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-bg-primary/50 border border-white/5">
                  <span className="text-xs font-mono text-gray-300 truncate">{channel.email}</span>
                  <button 
                    onClick={() => copyToClipboard(channel.email, channel.id)}
                    className="shrink-0 text-gray-500 hover:text-gold transition-colors"
                  >
                    {copiedId === channel.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                
                <Button asChild variant="outline" className="w-full border-white/5 hover:border-gold/30 hover:bg-gold/5 text-xs font-black uppercase tracking-widest h-12 rounded-xl">
                  <a href={`mailto:${channel.email}`}>
                    Escribir Ahora <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informational Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-bg-secondary/20 rounded-[3rem] p-12 border border-white/5 backdrop-blur-sm">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Compromiso con la Seguridad</h2>
            <p className="text-gray-400 leading-relaxed mb-8 font-medium">
              En Mercav nos tomamos muy en serio la integridad de nuestra comunidad. Todos los reportes de fraude son escalados de inmediato a nuestro equipo legal y técnico para proteger a los usuarios y sus transacciones.
            </p>
            <ul className="space-y-4">
              {[
                "Respuesta en menos de 24 horas hábiles",
                "Anonimato garantizado en reportes de fraude",
                "Seguimiento detallado de cada caso"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300 italic">
                  <Check className="h-4 w-4 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-white/10 group">
             <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent z-10" />
             <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="p-8 text-center">
                   <Globe className="h-16 w-16 text-gold mx-auto mb-6 group-hover:scale-110 transition-transform duration-700" />
                   <div className="text-xl font-bold text-white mb-2">Red Global Mercav</div>
                   <div className="text-sm text-gray-400 uppercase tracking-widest font-black">Latinoamérica</div>
                </div>
             </div>
             <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" alt="Mercav Network" />
          </div>
        </div>

        <footer className="mt-24 text-center">
           <p className="text-gray-600 text-xs font-bold uppercase tracking-[0.4em]">
             Mercav © {new Date().getFullYear()} · Infraestructura para el futuro
           </p>
        </footer>
      </div>
    </div>
  );
}
