"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  MonitorPlay, 
  Megaphone, 
  MessageSquare, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Search,
  Users,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  Settings,
  Bell,
  Store,
  Sparkles,
  Zap,
  DollarSign,
  Bookmark
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function DashboardClient({ 
  user, 
  totalApplicants, 
  totalViews,
  totalEarnings,
  totalSaved
}: { 
  user: any, 
  totalApplicants: number,
  totalViews: number,
  totalEarnings: number,
  totalSaved: number
}) {
  const [loading, setLoading] = useState(false);

  const categories = [
    {
      title: "Empleos y Vacantes",
      desc: "Gestiona tus búsquedas de talento o revisa tus postulaciones activas.",
      icon: Briefcase,
      color: "bg-gold/10 text-gold",
      gradientAccent: "from-amber-500/10 to-orange-500/10",
      link: "/empleos/mis-empleos",
      stats: `${user.jobPosts?.length || 0} Activos`,
      action: "Mis Vacantes"
    },
    {
      title: "Servicios Freelance",
      desc: "Controla tus ofertas de servicios o haz seguimiento a tus pedidos contratados.",
      icon: MonitorPlay,
      color: "bg-blue-500/10 text-blue-400",
      gradientAccent: "from-blue-500/10 to-violet-500/10",
      link: "/servicios/mis-servicios",
      stats: `${user.services?.length || 0} Activos`,
      action: "Mis Servicios"
    },
    {
      title: "Espacios de Publicidad",
      desc: "Administra tus vallas, pantallas y letreros disponibles para reserva.",
      icon: Megaphone,
      color: "bg-emerald-500/10 text-emerald-400",
      gradientAccent: "from-emerald-500/10 to-teal-500/10",
      link: "/anuncios/mis-espacios",
      stats: `${user.spaces.length} Espacios`,
      action: "Gestionar"
    },
    {
      title: "Mensajería Directa",
      desc: "Comunícate de forma segura con profesionales y empresas en toda Latinoamérica.",
      icon: MessageSquare,
      color: "bg-purple-500/10 text-purple-400",
      gradientAccent: "from-purple-500/10 to-pink-500/10",
      link: "/mensajes",
      stats: "Chat Seguro",
      action: "Abrir Chats"
    },
    {
      title: "Punto de Venta (POS)",
      desc: "Gestiona las ventas físicas de tu local, el inventario y genera tickets profesionales.",
      icon: Store,
      color: "bg-orange-500/10 text-orange-400",
      gradientAccent: "from-orange-500/10 to-red-500/10",
      link: user.posConfig ? "/dashboard/pos" : "/dashboard/pos/config",
      stats: user.posConfig ? "Configurado" : "Pendiente",
      action: user.posConfig ? "Abrir Terminal" : "Configurar Local"
    }
  ];

  const statCards = [
    { label: "Postulantes", value: totalApplicants, sub: "En tus vacantes", icon: Users, accent: "text-blue-400" },
    { label: "Visualizaciones", value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews, sub: "Impacto total", icon: TrendingUp, accent: "text-emerald-400" },
    { label: "Ingresos", value: `$${totalEarnings.toLocaleString()}`, sub: "Pagos recibidos", icon: DollarSign, accent: "text-gold" },
    { label: "Guardados", value: totalSaved, sub: "Usuarios interesados", icon: Bookmark, accent: "text-purple-400" },
  ];

  return (
    <div className="w-full min-h-screen bg-bg-primary text-white pt-24 pb-32 overflow-hidden section-transition">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-black tracking-tighter">
                Bienvenido, <span className="gradient-text-gold">{user.name.split(' ')[0]}</span>
              </h1>
              {user.badges && user.badges.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {user.badges.map((badge: any) => (
                    <div key={badge.id} className="group relative flex items-center justify-center">
                      <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                        <img src={badge.icon} alt={badge.name} className="max-w-full max-h-full object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gold text-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                        {badge.name}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gold" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-gray-500 text-base md:text-lg max-w-xl leading-relaxed">
              Tu centro de mando para todo lo que sucede en Mercav. Gestiona, explora y crece.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-3"
          >
            <Button asChild className="bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-white rounded-2xl h-12 md:h-14 px-6 md:px-8 font-bold transition-all glassmorphism hover:border-white/15">
              <Link href="/perfil/editar"><Settings className="w-5 h-5 mr-2" /> Ajustes</Link>
            </Button>
            <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-2xl h-12 md:h-14 px-8 md:px-10 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-gold/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-gold/30">
              <Link href="/dashboard/crear"><Plus className="w-5 h-5 mr-2" /> Nueva Publicación</Link>
            </Button>
          </motion.div>
        </div>

        {/* Quick Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              className="bg-bg-secondary/50 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group glassmorphism card-hover-premium"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`w-4 h-4 ${stat.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
              <div className="text-xl md:text-2xl font-mono font-black text-white mb-1">{stat.value}</div>
              <div className="text-gray-600 text-[9px] font-bold uppercase tracking-wider">{stat.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Categories Hub */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Tu Ecosistema de Gestión</h2>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className="group relative"
              >
                <Link href={cat.link} className="block bg-bg-secondary/50 border border-white/5 p-8 md:p-10 rounded-3xl hover:border-gold/30 hover:bg-white/[0.03] transition-all duration-500 overflow-hidden glassmorphism card-hover-premium relative">
                  {/* Gradient accent on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradientAccent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  
                  <div className="absolute top-0 right-0 p-8 md:p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <cat.icon size={160} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${cat.color} flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-300 border border-white/5`}>
                      <cat.icon size={28} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-gold transition-colors duration-300">{cat.title}</h3>
                      <span className="bg-white/5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors border border-white/5">{cat.stats}</span>
                    </div>
                    <p className="text-gray-500 max-w-md leading-relaxed mb-8 md:mb-10 text-sm">{cat.desc}</p>
                    <div className="flex items-center text-xs font-black uppercase tracking-widest text-gold">
                      {cat.action} <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Shortcuts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8"
        >
          <div className="lg:col-span-8">
             <div className="bg-bg-secondary/50 border border-white/5 rounded-3xl p-8 md:p-10 glassmorphism">
                <div className="flex justify-between items-center mb-8 md:mb-10">
                   <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                      <Zap className="text-gold h-5 w-5" /> Accesos Rápidos
                   </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {[
                    { label: "Mis Clientes", link: "/dashboard/clientes", icon: Users, sub: "Pedidos y reservas" },
                    { label: "Seguimiento", link: "/dashboard/pedidos", icon: Clock, sub: "Estado de entregas" },
                    { label: "Ajustes del POS", link: "/dashboard/pos/config", icon: Settings, sub: "Local y moneda" },
                    { label: "Premium", link: "/premium", icon: Star, sub: "Mejora tu visibilidad" },
                  ].map((item, i) => (
                    <Link key={i} href={item.link} className="flex items-center justify-between p-5 md:p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-gold/20 hover:bg-white/[0.04] transition-all duration-300 group">
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="p-2.5 md:p-3 bg-white/5 rounded-xl text-gray-400 group-hover:text-gold group-hover:bg-gold/5 transition-all duration-300">
                             <item.icon size={22} />
                          </div>
                          <div>
                             <div className="font-bold text-white text-sm md:text-base group-hover:text-gold transition-colors duration-300">{item.label}</div>
                             <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{item.sub}</div>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-4">
             <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/10 rounded-3xl p-8 md:p-10 h-full flex flex-col justify-between relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 blur-[80px] rounded-full -mr-10 -mt-10" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                
                <div className="relative z-10">
                   <h3 className="text-xl md:text-2xl font-bold text-white mb-4">¿Necesitas Ayuda?</h3>
                   <p className="text-gray-500 leading-relaxed mb-8 text-sm">Nuestro equipo de soporte está disponible para ayudarte a escalar tu negocio en Mercav.</p>
                </div>
                <Button asChild className="w-full h-12 md:h-14 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] relative z-10 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                   <Link href="/soporte">
                      Contactar Soporte
                   </Link>
                </Button>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
