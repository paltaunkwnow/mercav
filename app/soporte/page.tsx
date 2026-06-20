"use client";

import { useSession } from "next-auth/react";
import { Mail, MessageSquare, LifeBuoy, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SupportPage() {
  const { data: session } = useSession();

  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "Usuario de Mercav";
  
  const supportEmail = "soporte@mercav.lat";
  const subject = encodeURIComponent("Solicitud de Soporte - Mercav");
  const body = encodeURIComponent(`Hola equipo de Soporte Mercav,

Necesito ayuda con lo siguiente:
[Describe tu duda o problema aquí]

Mis datos:
- Nombre de Usuario: ${userEmail}
- Nombre Completo: ${userName}

Saludos.`);

  const mailtoLink = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  return (
    <div className="min-h-screen bg-bg-primary text-white pt-32 pb-20 overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <LifeBuoy size={14} /> Centro de Soporte Mercav
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-6">
            ¿Cómo podemos <span className="text-gold">ayudarte?</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Nuestro equipo técnico está listo para resolver tus dudas y ayudarte a potenciar tu negocio en la plataforma.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-8 group-hover:scale-110 transition-transform">
              <Mail size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Soporte vía Email</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Envíanos un correo detallando tu situación. Incluiremos automáticamente tu usuario para agilizar el proceso.
            </p>
            <Button asChild className="w-full h-14 bg-gold text-primary-foreground hover:bg-gold-light rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-gold/20">
              <a href={mailtoLink}>Redactar Correo</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Preguntas Frecuentes</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Revisa nuestra base de conocimientos para encontrar soluciones rápidas a los problemas más comunes.
            </p>
            <Button asChild className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
              <Link href="/faq">Ir a Preguntas Frecuentes</Link>
            </Button>
          </motion.div>
        </div>

        {/* Requirements Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-bg-secondary border border-border p-10 rounded-[3rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <ShieldCheck size={120} className="text-gold" />
          </div>
          
          <div className="relative z-10">
            <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <ShieldCheck className="text-gold" /> Información Importante
            </h4>
            <p className="text-gray-500 mb-8">
              Para brindarte una mejor atención, al escribir a <span className="text-white font-bold">soporte@mercav.lat</span>, asegúrate de que tu mensaje contenga:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Nombre de usuario completo",
                "Descripción detallada de la duda",
                "Capturas de pantalla (si aplica)",
                "Número de contacto directo"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <Clock size={16} className="text-gold" /> Tiempo estimado: 24-48 hrs
              </div>
              <Link href="/dashboard" className="text-gold text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                Volver al Panel <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
