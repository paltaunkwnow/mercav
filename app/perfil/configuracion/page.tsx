"use client";

import { 
  Settings, 
  Shield, 
  Lock, 
  Bell, 
  User, 
  CreditCard, 
  ArrowLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Palette,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { motion } from "framer-motion";

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();

  const sections = [
    { icon: User, label: "Información de la Cuenta", desc: "Cambia tu email, teléfono y datos básicos", href: "/perfil/editar" },
    { icon: Shield, label: "Privacidad", desc: "Gestiona qué información es pública", href: "/perfil/privacidad" },
    { icon: Lock, label: "Seguridad", desc: "Cambiar contraseña y 2FA", href: "/perfil/configuracion/seguridad" },
    { icon: Bell, label: "Notificaciones", desc: "Configura tus alertas y correos", href: "/perfil/notificaciones" },
    { icon: CreditCard, label: "Métodos de Pago", desc: "Tus tarjetas y cuentas de cobro", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-20 section-transition">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-[20%] w-[400px] h-[400px] bg-gold/[0.02] blur-[150px] rounded-full" />
        <div className="absolute bottom-20 left-[10%] w-[300px] h-[300px] bg-gold/[0.015] blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
          </Link>
        </motion.div>

        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-white">Configuración</h1>
              <p className="text-gray-400 text-sm">Personaliza tu experiencia y gestiona la seguridad de tu cuenta.</p>
            </div>
          </div>
        </motion.header>

        {/* Theme Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-4 h-4 text-gold" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Apariencia</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setTheme("dark")}
              className={`relative flex items-center gap-4 p-6 rounded-2xl border transition-all duration-500 group overflow-hidden ${
                theme === "dark"
                  ? "bg-gold/5 border-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                  : "bg-bg-secondary/50 border-white/5 hover:border-white/15"
              }`}
            >
              {/* Active indicator */}
              {theme === "dark" && (
                <div className="absolute top-3 right-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                </div>
              )}
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                theme === "dark" 
                  ? "bg-gold/10 text-gold" 
                  : "bg-white/5 text-gray-500 group-hover:text-gray-300"
              }`}>
                <Moon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-lg transition-colors ${theme === "dark" ? "text-white" : "text-gray-400"}`}>
                  Modo Oscuro
                </h4>
                <p className="text-sm text-gray-500">Reducción de fatiga visual</p>
              </div>
            </button>

            <button
              onClick={() => setTheme("light")}
              className={`relative flex items-center gap-4 p-6 rounded-2xl border transition-all duration-500 group overflow-hidden ${
                theme === "light"
                  ? "bg-gold/5 border-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                  : "bg-bg-secondary/50 border-white/5 hover:border-white/15"
              }`}
            >
              {theme === "light" && (
                <div className="absolute top-3 right-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                </div>
              )}
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                theme === "light" 
                  ? "bg-gold/10 text-gold" 
                  : "bg-white/5 text-gray-500 group-hover:text-gray-300"
              }`}>
                <Sun className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-lg transition-colors ${theme === "light" ? "text-white" : "text-gray-400"}`}>
                  Modo Claro
                </h4>
                <p className="text-sm text-gray-500">Más luminosidad y contraste</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-gold" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Cuenta</h3>
          </div>
          
          {sections.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
            >
              <Link 
                href={item.href}
                className="flex items-center justify-between p-5 md:p-6 bg-bg-secondary/50 border border-white/5 rounded-2xl hover:border-gold/30 hover:bg-white/[0.05] transition-all duration-300 group glassmorphism card-hover-premium"
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-bg-primary/80 border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-gold group-hover:border-gold/20 group-hover:bg-gold/5 transition-all duration-300">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base md:text-lg group-hover:text-gold transition-colors">{item.label}</h3>
                    <p className="text-xs md:text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-white/5"
        >
          <Button 
            variant="ghost" 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full h-14 md:h-16 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-400/5 border border-transparent hover:border-red-400/20 font-black uppercase tracking-widest transition-all"
          >
            <LogOut className="w-5 h-5 mr-3" /> Cerrar Sesión
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
