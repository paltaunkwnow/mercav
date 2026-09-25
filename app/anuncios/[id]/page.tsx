import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  MonitorPlay, 
  Maximize, 
  Calendar, 
  ArrowLeft, 
  Star, 
  User as UserIcon,
  ShieldCheck,
  Zap,
  Clock,
  Compass,
  Hammer,
  Edit3,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/SaveButton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import BookingCalendar from "@/components/anuncios/BookingCalendar";
import { ReportButton } from "@/components/ui/ReportButton";

export default async function AnuncioDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let space: any = null;
  
  try {
    space = await prisma.space.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, avatar: true, isVerified: true } },
        images: true,
        reservations: {
          where: {
            status: { in: ["CONFIRMED", "ACTIVE"] },
            endDate: { gte: new Date() }
          },
          orderBy: { startDate: "asc" }
        }
      }
    });
  } catch (e) {
    console.error(e);
  }

  if (!space) {
    notFound();
  }

  const isOwner = session?.user?.email && space.owner.id === (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id;

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-20 pb-24">
      <div className="container mx-auto px-4 max-w-7xl mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link href="/anuncios" className="inline-flex items-center text-gray-400 hover:text-gold transition-all text-sm font-bold uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Ecosistema
          </Link>
          
          <div className="flex items-center gap-3">
            {isOwner ? (
              <Button asChild className="bg-white/5 hover:bg-gold hover:text-black text-white border border-white/10 hover:border-gold rounded-xl px-6 font-bold transition-all">
                <Link href={`/anuncios/editar/${space.id}`}>
                  <Edit3 className="w-4 h-4 mr-2" /> Editar Anuncio
                </Link>
              </Button>
            ) : (
              <ReportButton targetId={space.id} targetType="SPACE" />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Image Gallery (Simplificada) */}
            <div className="w-full aspect-[16/9] relative rounded-[3rem] overflow-hidden bg-bg-secondary border border-white/5 shadow-2xl group">
              <img 
                src={space.images[0]?.url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000"} 
                alt={space.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />
              <div className="absolute top-6 left-6 flex gap-3">
                <span className="bg-black/60 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl">
                  {space.type}
                </span>
                {space.hasLighting && (
                  <span className="bg-gold text-black text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl flex items-center">
                    <Zap className="w-3 h-3 mr-2 fill-current" /> Iluminado
                  </span>
                )}
              </div>
            </div>

            <div className="bg-bg-secondary border border-white/5 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4 leading-tight">{space.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-gray-500 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-gold" /> {space.city}, {space.country}</span>
                    <span className="flex items-center"><MonitorPlay className="w-4 h-4 mr-2 text-gold" /> {space.trafficEstimate?.toLocaleString() || 0} Vistas/Mes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl">
                  <Star className="w-5 h-5 text-gold fill-gold" />
                  <span className="text-white font-black text-lg tracking-tighter">4.9</span>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4">Sobre este espacio</h3>
                <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">{space.description}</p>
              </div>

              <div className="mt-12 pt-12 border-t border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6">Ficha Técnica Avanzada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-bg-primary border border-white/5 p-5 rounded-2xl transition-all hover:border-gold/20">
                    <Maximize className="w-4 h-4 text-gold mb-3" />
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Dimensiones</p>
                    <p className="font-mono text-white font-bold">{space.width}x{space.height} {space.unit}</p>
                  </div>
                  <div className="bg-bg-primary border border-white/5 p-5 rounded-2xl transition-all hover:border-gold/20">
                    <Compass className="w-4 h-4 text-gold mb-3" />
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Orientación</p>
                    <p className="text-white font-bold">{space.orientation || "Horizontal"}</p>
                  </div>
                  <div className="bg-bg-primary border border-white/5 p-5 rounded-2xl transition-all hover:border-gold/20">
                    <Hammer className="w-4 h-4 text-gold mb-3" />
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Soporte/Material</p>
                    <p className="text-white font-bold">{space.material || "Lona Vinílica"}</p>
                  </div>
                  <div className="bg-bg-primary border border-white/5 p-5 rounded-2xl transition-all hover:border-gold/20">
                    <Clock className="w-4 h-4 text-gold mb-3" />
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Contrato Mín.</p>
                    <p className="text-white font-bold">{space.minContractMonths || 1} Mes{space.minContractMonths > 1 ? 'es' : ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disponibilidad (Airbnb Style) */}
            <div className="space-y-6">
               <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center px-4">
                 <Calendar className="w-5 h-5 mr-3 text-gold" /> Calendario de Disponibilidad
               </h3>
               <BookingCalendar 
                 occupiedDates={space.reservations.map((r: any) => ({ start: r.startDate, end: r.endDate }))} 
               />
            </div>
          </div>

          {/* Sidebar / Checkout */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="bg-bg-secondary border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <DollarSign size={80} className="text-gold" />
                </div>
                
                <div className="mb-8 relative z-10">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Tarifa Mensual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-mono font-black text-white leading-none">
                      <span className="text-gold text-2xl mr-1">$</span>{space.pricePerMonth || 0}
                    </span>
                    <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">/ Mes</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                  {!isOwner ? (
                    <>
                      <Button asChild className="w-full h-16 bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 transition-all hover:scale-[1.02]">
                        <Link href={`/checkout/anuncio/${space.id}`}>Reservar Ahora</Link>
                      </Button>
                      <SaveButton itemId={space.id} type="space" initialSaved={false} />
                      <Button asChild variant="outline" className="w-full h-16 border-white/5 text-white hover:border-gold hover:text-gold rounded-2xl bg-bg-primary font-bold transition-all">
                        <Link href={`/mensajes?to=${space.ownerId}`}>
                          <Calendar className="w-4 h-4 mr-2" /> Consultar Disponibilidad
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="outline" className="w-full h-16 border-gold/50 text-gold hover:bg-gold/5 font-black uppercase tracking-widest rounded-2xl transition-all">
                      <Link href="/dashboard">Gestionar Mi Espacio</Link>
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-4 bg-bg-primary p-5 rounded-3xl border border-white/5 relative z-10">
                  <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-relaxed">Protección Mercav: Tu inversión está segura hasta la confirmación de la campaña.</p>
                </div>
              </div>

              {/* Owner Info */}
              <div className="bg-bg-secondary border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Socio de Mercav</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-white/5 flex items-center justify-center overflow-hidden shadow-xl">
                    {space.owner?.avatar ? (
                      <img src={space.owner.avatar} alt="Owner" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-white text-base flex items-center gap-2">
                      {space.owner?.name}
                      {space.owner?.isVerified && (
                         <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/10" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">Dueño de Espacio</p>
                  </div>
                </div>
                <Button asChild variant="link" className="w-full mt-8 text-gold p-0 h-auto font-black uppercase tracking-widest text-[10px] justify-start hover:no-underline hover:opacity-70 transition-opacity">
                  <Link href={`/perfil/${space.ownerId}`}>Ver Portafolio Completo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DollarSign({ size, className }: { size: number, className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
// creado por Patodev y Invertilo
