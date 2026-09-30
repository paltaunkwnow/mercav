import { User, Settings, Shield, Bell, ChevronRight, LogOut, Edit3, MapPin, Globe2, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/perfil");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full min-h-screen bg-bg-primary pb-24 pt-24 overflow-hidden section-transition">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-[20%] w-[400px] h-[400px] bg-gold/[0.02] blur-[150px] rounded-full" />
        <div className="absolute bottom-20 left-[15%] w-[300px] h-[300px] bg-gold/[0.015] blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight">Mi Perfil</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona tu identidad en Mercav</p>
          </div>
          <Button asChild variant="outline" className="h-10 border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 rounded-xl px-5 transition-all duration-300 hover:scale-105">
            <Link href="/perfil/editar">
              <Edit3 className="w-4 h-4 mr-2" /> Editar Perfil
            </Link>
          </Button>
        </div>
        
        {/* Profile Card */}
        <div className="bg-bg-secondary/70 backdrop-blur-xl border border-white/[0.06] p-7 md:p-8 rounded-3xl flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 relative overflow-hidden group glassmorphism card-hover-premium">
          {/* Gold glow effect */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-gold/10 transition-all duration-700" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          
          <div className="w-24 h-24 bg-bg-tertiary rounded-2xl border-2 border-gold/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xl shadow-black/20 group-hover:border-gold/50 transition-all duration-300">
            {user.avatar ? (
              <img src={user.avatar} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-gray-500" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              {user.isVerified && (
                user.username === "admin" ? (
                  <span className="bg-gold/10 text-gold text-[10px] font-black px-3 py-1 rounded-full border border-gold/30 w-fit mx-auto md:mx-0 tracking-[0.1em]">ADMINISTRADOR</span>
                ) : (
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20 w-fit mx-auto md:mx-0">VERIFICADO</span>
                )
              )}
            </div>
            <p className="text-gray-400 mb-4">@{user.username || 'usuario'}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
              {user.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gold/60" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-gold/60" />
                {user.profile?.profileType === 'COMPANY' ? 'Empresa' : 'Profesional'}
              </div>
            </div>
          </div>
          
          <Button asChild variant="secondary" className="bg-bg-tertiary/50 text-gray-300 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/15 backdrop-blur-sm transition-all duration-300">
            <Link href={`/perfil/${user.username}`}>
              Ver perfil público
            </Link>
          </Button>
        </div>

        {/* Settings Menu */}
        <div className="bg-bg-secondary/70 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl shadow-black/10 glassmorphism">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Gestión de cuenta</span>
            </div>
          </div>
          {[
            { icon: Settings, label: "Configuración de Cuenta", desc: "Email, contraseña, apariencia y preferencias", href: "/perfil/configuracion" },
            { icon: Shield, label: "Privacidad y Seguridad", desc: "Quién puede ver tu perfil y contenido", href: "/privacidad" },
            { icon: Bell, label: "Notificaciones", desc: "Alertas de mensajes y actividad", href: "/notificaciones-settings" },
            { icon: Briefcase, label: "Mis Publicaciones", desc: "Gestiona tus anuncios, servicios y empleos", href: "/dashboard" }
          ].map((item, i) => (
            <Link href={item.href} key={i}>
              <div className={`p-5 flex items-center gap-4 md:gap-5 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group ${i !== 3 ? 'border-b border-white/5' : ''}`}>
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-bg-primary/80 border border-white/5 flex items-center justify-center group-hover:border-gold/20 group-hover:bg-gold/5 transition-all duration-300">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-gold transition-colors duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-white font-bold group-hover:text-gold transition-colors duration-300">{item.label}</span>
                  <span className="text-xs text-gray-500 block truncate">{item.desc}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
