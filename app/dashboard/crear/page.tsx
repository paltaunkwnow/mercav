"use client";

import { useState, Suspense } from "react";
import { 
  Loader2, 
  Megaphone, 
  MonitorPlay, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Zap,
  Info,
  DollarSign,
  Maximize,
  Compass,
  Hammer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";

function CrearPublicacionUnified() {
  const [step, setStep] = useState(1); // 1: Select Type, 2: Fill Details
  const [type, setType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    title: "", description: "", price: "", city: "",
    // Service specifics
    category: "DESARROLLO_WEB",
    // Job specifics
    employmentType: "TIEMPO_COMPLETO", salaryMin: "", salaryMax: "",
    // Space specifics
    spaceType: "VALLA", width: "0", height: "0", unit: "M"
  });

  const types = [
    { id: 'ads', label: 'Espacio Publicitario', icon: Megaphone, desc: 'Vallas, pantallas LED y letreros físicos.', color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
    { id: 'service', label: 'Servicio Freelance', icon: MonitorPlay, desc: 'Ofrece tu talento profesional al mercado.', color: 'text-blue-400', bg: 'bg-blue-400/5' },
    { id: 'job', label: 'Vacante de Empleo', icon: Briefcase, desc: 'Encuentra al mejor candidato para tu empresa.', color: 'text-gold', bg: 'bg-gold/5' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let endpoint = "";
    let payload = {};

    if (type === "ads") {
      endpoint = "/api/spaces";
      payload = {
        title: formData.title,
        description: formData.description,
        type: formData.spaceType,
        city: formData.city,
        country: "Bolivia",
        pricePerMonth: Number(formData.price),
        width: Number(formData.width),
        height: Number(formData.height),
        unit: formData.unit,
        currency: "USD",
        images: []
      };
    } else if (type === "service") {
      endpoint = "/api/services";
      payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        packages: [{ name: "Básico", price: Number(formData.price), deliveryDays: 7, revisions: 1 }]
      };
    } else if (type === "job") {
      endpoint = "/api/jobs";
      payload = {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        country: "Bolivia",
        employmentType: formData.employmentType,
        workMode: "PRESENCIAL", // Default
        experienceLevel: "JUNIOR", // Default
        requirements: "Habilidades profesionales y compromiso.", // Default
        salaryMin: Number(formData.salaryMin || 0),
        salaryMax: Number(formData.salaryMax || 0),
        salaryCurrency: "USD"
      };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) setSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col items-center justify-center p-20 bg-white/[0.02] backdrop-blur-3xl rounded-[4rem] border border-white/5 mt-12 shadow-2xl"
      >
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-display font-black text-white mb-4 text-center">¡Publicación Exitosa!</h2>
        <p className="text-gray-400 text-center mb-10 max-w-md text-lg">Tu anuncio ha sido procesado y ya está visible en el ecosistema Mercav.</p>
        <Button className="bg-white text-black hover:bg-gray-200 rounded-2xl h-16 px-12 font-black uppercase tracking-widest transition-all hover:scale-[1.02]" onClick={() => window.location.href = '/dashboard'}>
          Volver al Panel
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-12"
          >
            <div className="text-center">
              <h1 className="text-5xl font-display font-black text-white mb-4">¿Qué quieres <span className="text-gold">publicar</span> hoy?</h1>
              <p className="text-gray-500 text-lg">Selecciona el tipo de publicación para comenzar el proceso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setType(t.id); setStep(2); }}
                  className={`p-8 rounded-[3rem] border transition-all text-left flex flex-col items-start group relative overflow-hidden ${
                    type === t.id ? 'bg-white/10 border-gold shadow-2xl shadow-gold/10' : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110 ${t.bg} ${t.color}`}>
                    <t.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8">{t.desc}</p>
                  <div className="mt-auto flex items-center text-xs font-black uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Comenzar <ArrowRight size={14} className="ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-12">
              <button onClick={() => setStep(1)} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-display font-black text-white">Detalles de la {types.find(t => t.id === type)?.label}</h2>
                <p className="text-gray-500">Completa la información técnica para finalizar la publicación.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-10 rounded-[3.5rem] shadow-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Título Principal</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Escribe un título atractivo..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-16 px-6 text-white text-lg focus:outline-none focus:border-gold/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Descripción Detallada</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Cuéntales más sobre lo que ofreces..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 text-white focus:outline-none focus:border-gold/30 transition-all resize-none leading-relaxed"
                  />
                </div>

                {type === "ads" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5 mt-8">
                    <CustomSelect
                      label="Tipo de Espacio"
                      value={formData.spaceType}
                      onChange={(val) => setFormData({...formData, spaceType: val})}
                      options={[
                        { value: "VALLA", label: "Valla Publicitaria" },
                        { value: "PANTALLA", label: "Pantalla LED" },
                        { value: "LETRERO", label: "Letrero Luminoso" },
                        { value: "MURO", label: "Muro Publicitario" },
                      ]}
                    />
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Precio Mensual (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gold h-5 w-5" />
                        <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-16 pl-14 pr-6 text-white font-mono font-bold" />
                      </div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                       <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Ancho (m)</label>
                        <input type="number" required value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-xl h-12 px-4 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Alto (m)</label>
                        <input type="number" required value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-xl h-12 px-4 text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Ubicación</label>
                        <input type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Ej: Santa Cruz" className="w-full bg-white/[0.03] border border-white/5 rounded-xl h-12 px-4 text-white font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                {type === "service" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5 mt-8">
                    <CustomSelect
                      label="Categoría del Servicio"
                      value={formData.category}
                      onChange={(val) => setFormData({...formData, category: val})}
                      options={[
                        { value: "DESARROLLO_WEB", label: "Desarrollo Web" },
                        { value: "DISENO", label: "Diseño Gráfico" },
                        { value: "MARKETING", label: "Marketing Digital" },
                        { value: "VIDEO", label: "Edición de Video" },
                      ]}
                    />
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Precio Base (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gold h-5 w-5" />
                        <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-16 pl-14 pr-6 text-white font-mono font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                {type === "job" && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5 mt-8">
                    <CustomSelect
                      label="Modalidad"
                      value={formData.employmentType}
                      onChange={(val) => setFormData({...formData, employmentType: val})}
                      options={[
                        { value: "TIEMPO_COMPLETO", label: "Tiempo Completo" },
                        { value: "PART_TIME", label: "Medio Tiempo" },
                        { value: "FREELANCE", label: "Freelance / Proyecto" },
                      ]}
                    />
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Ubicación</label>
                      <input type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Ej: Santa Cruz o Remoto" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-16 px-6 text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Salario Mínimo (USD)</label>
                      <input type="number" value={formData.salaryMin} onChange={(e) => setFormData({...formData, salaryMin: e.target.value})} placeholder="0" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-16 px-6 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Salario Máximo (USD)</label>
                      <input type="number" value={formData.salaryMax} onChange={(e) => setFormData({...formData, salaryMax: e.target.value})} placeholder="0" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-16 px-6 text-white font-mono" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 flex justify-end gap-4">
                <Button type="button" variant="ghost" className="text-gray-500 hover:text-white font-bold" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-gold text-black hover:bg-gold-light rounded-[1.5rem] h-16 px-12 font-black uppercase tracking-widest shadow-xl shadow-gold/10 transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2 fill-current" />}
                  Publicar Ahora
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CrearPage() {
  return (
    <div className="w-full min-h-screen bg-[#050505] pb-20 pt-20 px-4 md:px-8 relative overflow-hidden">
       {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <Suspense fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      }>
        <CrearPublicacionUnified />
      </Suspense>
    </div>
  );
}
// creado por pato dev y askforvini
