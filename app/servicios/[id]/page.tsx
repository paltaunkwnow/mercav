import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Star, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  RotateCcw, 
  Package, 
  User as UserIcon,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Target,
  Trophy,
  History,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/SaveButton";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { ReportButton } from "@/components/ui/ReportButton";

function formatCategory(cat: string) {
  if (!cat) return "Profesional";
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default async function ServicioDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let service: any = null;
  
  try {
    service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        provider: { 
          include: { 
            roles: { select: { role: true } }
          } 
        },
        packages: true,
        reviews: true,
        images: { orderBy: { order: 'asc' } }
      }
    });
  } catch (e) {
    console.error(e);
  }

  if (!service) {
    notFound();
  }

  // Fetch completed orders separately to avoid schema relation issues
  const completedOrdersCount = await prisma.serviceOrder.count({
    where: {
      service: { providerId: service.provider?.id },
      status: 'COMPLETED'
    }
  });

  const isOwner = session?.user?.email === service.provider?.email || (session?.user as any)?.id === service.providerId;

  const mainPackage = service.packages?.[0] || { 
    name: "Plan Estándar",
    price: 0, 
    deliveryDays: service.deliveryDays || 5, 
    revisions: service.revisions || 3,
    description: "Servicio completo según la descripción especificada.",
    features: []
  };

  return (
    <div className="w-full min-h-screen bg-[#080808] pb-32">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10 pt-28">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <Link href="/servicios" className="inline-flex items-center text-gray-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform" /> Explorar Servicios
          </Link>
          {!isOwner && (
            <ReportButton targetId={service.id} targetType="SERVICE" />
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-black text-gold uppercase tracking-widest">{formatCategory(service.category)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="flex items-center gap-1 text-gold">
                  <Star className="w-3.5 h-3.5 fill-gold" />
                  <span className="text-[10px] font-black tracking-widest">PRO SERVICE</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-black text-white mb-10 tracking-tighter leading-[0.9]">{service.title}</h1>
              
              {/* Service Gallery */}
              <div className="w-full aspect-video relative rounded-[3rem] overflow-hidden bg-white/[0.02] border border-white/10 mb-12 group shadow-2xl">
                {service.images?.length > 0 ? (
                  <img 
                    src={service.images[0].url} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={service.title} 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                    <MonitorPlay size={64} className="mb-4 text-gold" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay previsualización visual</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
              
              {/* Provider Header Card */}
              <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-md mb-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                  <img 
                    src={service.provider?.avatar || `https://ui-avatars.com/api/?name=${service.provider?.name || 'User'}`} 
                    className="w-16 h-16 rounded-2xl relative z-10 border border-white/10 object-cover" 
                    alt="Provider" 
                  />
                  {service.provider?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-lg border-2 border-[#121212] z-20 shadow-xl">
                      <ShieldCheck size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-lg font-black text-white">{service.provider?.name || "Profesional Experto"}</p>
                    {service.provider?.roles?.some((r: any) => r.role === 'ADMIN') || service.provider?.username === 'ice' ? (
                      <div className="flex items-center gap-1 bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                        <Crown className="w-2.5 h-2.5 text-gold" />
                        <span className="text-[8px] text-gold font-black uppercase tracking-tighter">CEO</span>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-gray-500 font-bold uppercase tracking-tighter">Level 2</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs gap-4 text-gray-500 font-bold">
                    <div className="flex items-center text-gold">
                      <Star className="w-4 h-4 fill-gold mr-1" />
                      <span>5.0</span>
                      <span className="ml-1 opacity-50">({service.reviews?.length || 0})</span>
                    </div>
                    <span>•</span>
                    <span className="uppercase tracking-widest text-[9px]">Disponible ahora</span>
                  </div>
                </div>
                <div className="ml-auto hidden md:block">
                  <Button variant="ghost" asChild className="rounded-xl hover:bg-white/5 text-gray-400 group">
                    <Link href={`/perfil/${service.provider?.id || '#'}`} className="flex items-center gap-2">
                      Ver Portfolio <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <section className="space-y-8">
               <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                  <Target size={20} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Descripción del Servicio</h3>
              </div>
              <div className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap font-medium bg-[#121212]/40 rounded-[3rem] p-10 border border-white/5">
                {service.description}
              </div>
            </section>

            {/* Premium Provider Profile Section */}
            <div className="bg-gradient-to-br from-[#121212] to-black rounded-[4rem] p-12 border border-white/10 relative overflow-hidden shadow-3xl">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <UserIcon className="w-64 h-64 text-white" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-black text-white mb-10 uppercase tracking-widest text-[12px] flex items-center gap-2">
                  <Trophy size={16} className="text-gold" /> Perfil del Profesional
                </h3>
                
                <div className="flex flex-col md:flex-row gap-12 items-start">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full" />
                      <img 
                        src={service.provider?.avatar || `https://ui-avatars.com/api/?name=${service.provider?.name || 'User'}`} 
                        className="w-32 h-32 rounded-[2.5rem] border-4 border-[#121212] shadow-2xl relative z-10 object-cover" 
                        alt="Provider Large" 
                      />
                    </div>
                    <Button variant="outline" asChild className="rounded-2xl border-white/10 bg-white/5 h-12 px-8 font-black uppercase text-[10px] tracking-widest hover:bg-gold hover:text-black transition-all">
                      <Link href={`/perfil/${service.provider?.id || '#'}`}>Contactar</Link>
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="text-3xl font-black text-white tracking-tighter mb-2">{service.provider?.name}</h4>
                      <div className="flex gap-4">
                        <p className="text-[10px] text-gold font-black uppercase tracking-[0.2em]">Mercav Verified Partner</p>
                        {service.provider?.roles?.some((r: any) => r.role === 'ADMIN') || service.provider?.username === 'ice' ? (
                          <div className="flex items-center gap-1 bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                            <Crown className="w-3 h-3 text-gold" />
                            <span className="text-[9px] text-gold font-black uppercase tracking-tighter">CEO</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">Full Time Pro</p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-lg leading-relaxed italic font-medium">
                      "{service.provider?.bio || 'Comprometido con la excelencia técnica y la innovación constante en cada proyecto entregado.'}"
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <History size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Miembro</p>
                        </div>
                        <p className="text-white text-sm font-black">{service.provider?.createdAt ? new Date(service.provider.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Mayo 2024'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Zap size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Respuesta</p>
                        </div>
                        <p className="text-white text-sm font-black">&lt; 1 hora</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <CheckCircle size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Entregas</p>
                        </div>
                        <p className="text-white text-sm font-black">{completedOrdersCount} Proyectos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Purchase Area */}
          <div className="lg:col-span-4">
            <div className="bg-[#121212]/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] sticky top-28 overflow-hidden shadow-3xl">
              <div className="p-10 border-b border-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-white text-xl tracking-tight mb-1">{mainPackage.name}</h3>
                    <p className="text-[10px] text-gold font-black uppercase tracking-[0.2em]">Paquete Recomendado</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black font-mono text-white tracking-tighter">${mainPackage.price}</span>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">PAGO ÚNICO</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed font-medium">{mainPackage.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-all">
                    <Clock className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Entrega</p>
                      <p className="text-xs font-black text-white">{mainPackage.deliveryDays} Días</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-all">
                    <RotateCcw className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Revisiones</p>
                      <p className="text-xs font-black text-white">{mainPackage.revisions} Veces</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {!isOwner ? (
                    <>
                      <Button asChild className="w-full h-20 bg-gold text-black hover:bg-yellow-500 font-black uppercase tracking-[0.3em] text-[12px] rounded-3xl shadow-2xl shadow-gold/10 hover:scale-[1.02] transition-all">
                        <Link href={`/checkout/servicio/${service.id}`}>Contratar Ahora</Link>
                      </Button>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <SaveButton itemId={service.id} type="service" initialSaved={false} />
                        </div>
                        <Button asChild variant="outline" className="w-16 h-16 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center p-0">
                          <Link href={`/mensajes?to=${service.providerId}`}>
                            <MessageSquare className="w-6 h-6 text-white" />
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button asChild variant="outline" className="w-full h-20 border-gold/30 text-gold hover:bg-gold/10 font-black uppercase tracking-[0.3em] text-[12px] rounded-3xl backdrop-blur-md">
                      <Link href={`/servicios/editar/${service.id}`}>Editar Mi Servicio</Link>
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-6 bg-white/[0.02] text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Garantía Mercav Escrow</p>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed max-w-[200px] mx-auto">Protegemos tus fondos hasta que el servicio sea entregado satisfactoriamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
