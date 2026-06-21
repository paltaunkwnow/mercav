"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  Briefcase, 
  ArrowLeft,
  CheckCircle,
  Save,
  MapPin,
  DollarSign,
  AlertCircle,
  Building,
  GraduationCap,
  Users,
  Search,
  Globe,
  Star,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

export default function EditarEmpleoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    city: "",
    employmentType: "TIEMPO_COMPLETO",
    salaryMin: "",
    salaryMax: "",
    workMode: "PRESENCIAL",
    experienceLevel: "MID",
    requirements: "",
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            title: data.data.title,
            description: data.data.description,
            city: data.data.city,
            employmentType: data.data.employmentType,
            salaryMin: data.data.salaryMin,
            salaryMax: data.data.salaryMax,
            workMode: data.data.workMode || "PRESENCIAL",
            experienceLevel: data.data.experienceLevel || "MID",
            requirements: data.data.requirements || "",
          });
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/empleos/mis-empleos"), 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-blue-500/10 rounded-full animate-pulse" />
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin absolute inset-0 m-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-28 pb-32">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[5%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[5%] right-[5%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header */}
        <div className="flex items-start gap-8 mb-16">
          <motion.button 
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()} 
            className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-2xl backdrop-blur-md"
          >
            <ArrowLeft size={28} />
          </motion.button>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Recruitment Editor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Búsqueda de Talento</span>
            </div>
            <h1 className="text-6xl font-display font-black text-white tracking-tighter leading-none mb-4">
              Editar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Vacante</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
              Ajusta los requisitos y condiciones de tu oferta para conectar con el perfil ideal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Main Info Card */}
            <div className="bg-[#121212]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Detalles del Puesto</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Información Pública</p>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Título de la Posición</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] h-20 px-8 text-white text-xl font-bold focus:outline-none focus:border-blue-500/30 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Descripción del Cargo</label>
                  <textarea 
                    required 
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-[3rem] p-8 text-white text-lg focus:outline-none focus:border-blue-500/30 transition-all resize-none leading-relaxed shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Requisitos Clave</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    placeholder="Enumera los conocimientos técnicos y habilidades..."
                    className="w-full bg-black/40 border border-white/5 rounded-[2.5rem] p-8 text-white text-lg focus:outline-none focus:border-blue-500/30 transition-all resize-none leading-relaxed shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Logistics Card */}
            <div className="bg-[#121212]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <Settings2 size={22} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Condiciones</h3>
              </div>

              <div className="space-y-6">
                <CustomSelect
                  label="Tipo de Contrato"
                  value={formData.employmentType}
                  onChange={(val) => setFormData({...formData, employmentType: val})}
                  options={[
                    { value: "TIEMPO_COMPLETO", label: "Tiempo Completo" },
                    { value: "PART_TIME", label: "Medio Tiempo" },
                    { value: "FREELANCE", label: "Freelance" },
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
                    { value: "JUNIOR", label: "Junior" },
                    { value: "MID", label: "Middle" },
                    { value: "SENIOR", label: "Senior" },
                  ]}
                />

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 ml-2">Ubicación</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400 h-5 w-5" />
                    <input type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 pl-14 pr-6 text-white font-bold outline-none focus:border-blue-500/30 transition-all" />
                  </div>
                </div>

                <div className="mt-10 p-6 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-3 text-center">Rango Salarial (Fijo)</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-mono font-black text-blue-400">${formData.salaryMin} - ${formData.salaryMax}</p>
                    <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] font-bold text-gray-500 uppercase tracking-tighter">Bloqueado</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[3rem] p-2 shadow-2xl shadow-blue-500/20">
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full bg-black rounded-[2.8rem] py-8 px-6 flex flex-col items-center justify-center gap-2 hover:bg-black/80 transition-all group"
              >
                {saving ? (
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Save size={24} />
                    </div>
                    <span className="text-lg font-black text-white uppercase tracking-[0.3em]">Guardar Vacante</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[40px] flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl bg-[#121212] border border-white/10 p-16 rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,1)] text-center relative overflow-hidden">
              <div className="w-28 h-28 bg-blue-500/10 rounded-full flex items-center justify-center mb-10 border border-blue-500/20 mx-auto">
                <CheckCircle className="w-14 h-14 text-blue-400" />
              </div>
              <h2 className="text-6xl font-display font-black text-white mb-6 tracking-tight">¡Éxito!</h2>
              <p className="text-gray-400 text-xl leading-relaxed mb-12">La oferta de empleo ha sido actualizada correctamente en el portal.</p>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden max-w-sm mx-auto">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="h-full bg-blue-500" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
