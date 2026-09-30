import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Building, 
  ArrowLeft, 
  CheckCircle,
  Globe,
  Zap,
  Target,
  Award,
  ShieldCheck,
  Building2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/SaveButton";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { ReportButton } from "@/components/ui/ReportButton";

function formatEnumValue(val: string) {
  if (!val) return "";
  return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default async function EmpleoDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let job: any = null;
  
  try {
    job = await prisma.jobPost.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true, avatar: true, isVerified: true, email: true } }
      }
    });
  } catch (e) {
    console.error(e);
  }

  if (!job) {
    notFound();
  }

  const isOwner = session?.user?.email === job.company?.email || (session?.user as any)?.id === job.companyId;

  return (
    <div className="w-full min-h-screen bg-[#080808] pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
      </div>

      {/* Decorative Header Glow */}
      <div className="h-[400px] w-full bg-gradient-to-b from-blue-500/10 via-transparent to-transparent absolute top-0 left-0" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10 pt-28">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <Link href="/empleos" className="inline-flex items-center text-gray-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform" /> Volver a la Bolsa de Trabajo
          </Link>
          {!isOwner && (
            <ReportButton targetId={job.id} targetType="JOB" />
          )}
        </div>
        
        {/* Main Header Card */}
        <div className="bg-[#121212]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 mb-12 relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0" />
          
          <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-32 h-32 bg-[#1A1A1A] rounded-[2.5rem] p-1.5 shadow-2xl relative z-10 border border-white/10 overflow-hidden ring-4 ring-white/5 group-hover:ring-blue-500/20 transition-all duration-500">
                  <img 
                    src={job.logo || job.company?.avatar || `https://ui-avatars.com/api/?name=${job.company?.name || 'M'}&background=random`} 
                    alt={job.company?.name} 
                    className="w-full h-full object-cover rounded-[2.2rem] transition-transform duration-700 group-hover:scale-110" 
                  />
                </div>
                {job.company?.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-2xl border-4 border-[#121212] shadow-xl z-20">
                    <ShieldCheck size={20} />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">{formatEnumValue(job.employmentType)}</span>
                  <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-black text-gold uppercase tracking-widest">{formatEnumValue(job.experienceLevel || "MID")}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter leading-none">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <span className="flex items-center text-gray-300 font-bold"><Building2 className="w-4 h-4 mr-2 text-blue-400" /> {job.company?.name || "Empresa Confidencial"}</span>
                  <span className="flex items-center text-gray-400"><MapPin className="w-4 h-4 mr-2 text-blue-400" /> {job.city}, {job.country}</span>
                  <span className="flex items-center text-gray-500"><Calendar className="w-4 h-4 mr-2" /> {job.postedAt || 'Publicado recientemente'}</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
              {!isOwner ? (
                <>
                  <Button asChild className="flex-1 lg:flex-none bg-blue-600 text-white hover:bg-blue-500 font-black uppercase tracking-[0.2em] px-10 h-16 rounded-[1.8rem] text-sm shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.02]">
                    <Link href={`/empleos/${job.id}/postular`}>Postular Ahora</Link>
                  </Button>
                  <SaveButton itemId={job.id} type="job" initialSaved={false} />
                </>
              ) : (
                <Button asChild variant="outline" className="flex-1 lg:flex-none border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-black uppercase tracking-[0.2em] px-10 h-16 rounded-[1.8rem] text-sm backdrop-blur-md">
                  <Link href={`/empleos/editar/${job.id}`}>Editar Vacante</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Detailed Content */}
          <div className="lg:col-span-8 space-y-12">
            <section className="bg-[#121212]/40 rounded-[3rem] p-10 border border-white/5 space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Target size={20} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Descripción del Rol</h3>
              </div>
              <div className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {job.description}
              </div>
            </section>

            <section className="bg-[#121212]/40 rounded-[3rem] p-10 border border-white/5 space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                  <Award size={20} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Requisitos y Aptitudes</h3>
              </div>
              <div className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {job.requirements}
              </div>
            </section>

            {(job.responsibilities || job.benefits) && (
              <div className="grid md:grid-cols-2 gap-8">
                {job.responsibilities && (
                  <section className="bg-[#121212]/40 rounded-[2.5rem] p-8 border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest text-[12px] flex items-center gap-2">
                      <Zap size={16} className="text-blue-400" /> Responsabilidades
                    </h3>
                    <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                      {job.responsibilities}
                    </div>
                  </section>
                )}
                {job.benefits && (
                  <section className="bg-[#121212]/40 rounded-[2.5rem] p-8 border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest text-[12px] flex items-center gap-2">
                      <Sparkles size={16} className="text-gold" /> Beneficios
                    </h3>
                    <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                      {job.benefits}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4">
            <div className="bg-[#121212]/80 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 sticky top-28 shadow-3xl">
              <h3 className="font-black text-white text-xl mb-10 tracking-tight flex items-center justify-between">
                Resumen del Puesto
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </h3>
              
              <div className="space-y-10">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-blue-400 border border-white/5 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Compensación</p>
                    <p className="font-mono text-xl font-black text-white">
                      {job.salaryCurrency === "USD" ? "$" : job.salaryCurrency} {job.salaryMin} - {job.salaryMax}
                    </p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Estimado Mensual</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-blue-400 border border-white/5 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Modalidad</p>
                    <p className="font-bold text-white text-lg">{formatEnumValue(job.employmentType)}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Dedicación Profesional</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-blue-400 border border-white/5 group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Entorno</p>
                    <p className="font-bold text-white text-lg">{formatEnumValue(job.workMode || "PRESENCIAL")}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Ubicación del Talento</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-white/5">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">¿Cumples con el perfil?</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Asegúrate de tener tu perfil de Mercav actualizado antes de postularte.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkles({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
// creado por pato dev y askforvini
