"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2,
  Plus,
  Trash2,
  Globe,
  Building2,
  Send,
  Zap,
  Target,
  ShieldCheck,
  Building,
  GraduationCap,
  Users,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicarEmpleoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [createPost, setCreatePost] = useState(true);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    employmentType: "TIEMPO_COMPLETO",
    workMode: "PRESENCIAL",
    city: "",
    country: "Bolivia",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    salaryVisible: true,
    experienceLevel: "JUNIOR",
    officialCompanyId: "",
  });

  useState(() => {
    fetch("/api/companies/user-approved")
      .then(res => res.json())
      .then(data => {
        if (data.success) setUserCompanies(data.data);
      });
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (createPost) {
          await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `¡Nueva vacante disponible! 🚀\n\nEstamos buscando un ${formData.title}. Si cumples con los requisitos, ¡postúlate ahora!\n\n📍 ${formData.city}, ${formData.country}`,
              module: "JOBS",
              jobId: data.data.id
            }),
          });
        }
        showToast("Empleo publicado con éxito", "success");
        setTimeout(() => router.push("/empleos"), 1500);
      } else {
        showToast(data.error || "Error al publicar", "error");
      }
    } catch (error) {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-32">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-[1600px] relative z-10">
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-12">
          <Link href="/empleos" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all backdrop-blur-md group shrink-0">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Mercav Recruitment</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter leading-tight">
              Publicar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Vacante</span>
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Brand Identity Selection */}
            {userCompanies.length > 0 && (
              <div className="p-8 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Identidad de Marca</h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Publicación Corporativa</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setFormData({ ...formData, officialCompanyId: "" })}
                    className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 border-none ${
                      formData.officialCompanyId === "" ? "bg-blue-500/10" : "bg-black/40 hover:bg-white/5"
                    }`}
                  >
                    <Users size={20} className={formData.officialCompanyId === "" ? "text-blue-400" : "text-gray-500"} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cuenta Personal</span>
                  </div>
                  
                  {userCompanies.map(company => (
                    <div 
                      key={company.id}
                      onClick={() => setFormData({ ...formData, officialCompanyId: company.id })}
                      className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 border-none ${
                        formData.officialCompanyId === company.id ? "bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.05)]" : "bg-black/40 hover:bg-white/5"
                      }`}
                    >
                      <Building size={20} className={formData.officialCompanyId === company.id ? "text-blue-400" : "text-gray-500"} />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate w-full px-2">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Info Card */}
            <div className="relative overflow-hidden space-y-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Building2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Detalles de la Posición</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Título del Puesto</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej. Senior Full Stack Developer"
                    className="w-full bg-black/60 rounded-2xl h-16 px-6 text-white text-lg font-bold focus:outline-none focus:bg-white/[0.05] transition-all border-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Descripción del Cargo</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe las tareas, la cultura del equipo y los objetivos..."
                    className="w-full bg-black/60 rounded-[2rem] p-6 text-white text-base focus:outline-none focus:bg-white/[0.05] transition-all resize-none leading-relaxed border-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Requisitos Clave</label>
                  <textarea 
                    required 
                    rows={4}
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    placeholder="Enumera los conocimientos técnicos y habilidades blandas..."
                    className="w-full bg-black/60 rounded-[2rem] p-6 text-white text-base focus:outline-none focus:bg-white/[0.05] transition-all resize-none leading-relaxed border-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Amplification Card */}
            <div className="p-8 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black text-white mb-2">Impacto en Comunidad</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Notifica automáticamente a toda la red sobre esta vacante.</p>
                </div>
                <div 
                  onClick={() => setCreatePost(!createPost)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer min-w-[240px] border-none ${
                    createPost ? "bg-blue-500/10" : "bg-black/60"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    createPost ? "border-blue-500 bg-blue-500 text-white" : "border-gray-700"
                  }`}>
                    {createPost && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Publicar en Feed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Logistics Card */}
            <div className="relative overflow-hidden space-y-8 sticky top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                  <Settings2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Condiciones</h3>
              </div>

              <div className="space-y-4">
                <CustomSelect
                  label="Tipo de Contrato"
                  value={formData.employmentType}
                  onChange={(val) => setFormData({...formData, employmentType: val})}
                  options={[
                    { value: "TIEMPO_COMPLETO", label: "Tiempo Completo" },
                    { value: "PART_TIME", label: "Medio Tiempo" },
                    { value: "FREELANCE", label: "Freelance" },
                    { value: "PASANTIA", label: "Pasantía" },
                  ]}
                />

                <CustomSelect
                  label="Entorno de Trabajo"
                  value={formData.workMode}
                  onChange={(val) => setFormData({...formData, workMode: val})}
                  options={[
                    { value: "PRESENCIAL", label: "Presencial" },
                    { value: "REMOTO", label: "Remoto" },
                    { value: "HIBRIDO", label: "Híbrido" },
                  ]}
                />

                <CustomSelect
                  label="Nivel de Experiencia"
                  value={formData.experienceLevel}
                  onChange={(val) => setFormData({...formData, experienceLevel: val})}
                  options={[
                    { value: "SIN_EXPERIENCIA", label: "Sin Experiencia" },
                    { value: "JUNIOR", label: "Junior" },
                    { value: "SEMI_SENIOR", label: "Middle" },
                    { value: "SENIOR", label: "Senior" },
                  ]}
                />

                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">Ubicación / Ciudad</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 h-4 w-4" />
                    <input 
                      required 
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Ej. Santa Cruz"
                      className="w-full bg-black/60 rounded-xl h-14 pl-12 pr-4 text-white text-sm font-bold focus:bg-white/[0.05] transition-all border-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2">Rango Salarial (USD)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 h-3 w-3" />
                      <input type="number" value={formData.salaryMin} onChange={(e) => setFormData({...formData, salaryMin: e.target.value})} placeholder="Min" className="w-full bg-black/60 rounded-xl h-12 pl-8 text-white text-xs font-mono border-none outline-none focus:bg-white/[0.05] transition-all" />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 h-3 w-3" />
                      <input type="number" value={formData.salaryMax} onChange={(e) => setFormData({...formData, salaryMax: e.target.value})} placeholder="Max" className="w-full bg-black/60 rounded-xl h-12 pl-8 text-white text-xs font-mono border-none outline-none focus:bg-white/[0.05] transition-all" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-600 text-white hover:bg-blue-500 font-black uppercase tracking-[0.2em] h-16 rounded-2xl shadow-xl shadow-blue-600/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="text-xs">Lanzar Vacante</span>
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
}
// creado por Patodev y Invertilo
