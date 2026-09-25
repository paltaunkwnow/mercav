"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  MonitorPlay, 
  ArrowLeft,
  CheckCircle,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  DollarSign,
  Briefcase,
  Zap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

export default function EditarServicioPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    category: "DESARROLLO_WEB",
    images: []
  });
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            title: data.data.title,
            description: data.data.description,
            category: data.data.category,
            images: data.data.images?.map((img: any) => img.url) || []
          });
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const addImage = () => {
    if (imageUrl && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl("");
    }
  };

  const removeImage = (url: string) => {
    setFormData({ ...formData, images: formData.images.filter((img: string) => img !== url) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/servicios/mis-servicios"), 2000);
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
          <div className="w-20 h-20 border-2 border-gold/10 rounded-full animate-pulse" />
          <Loader2 className="w-8 h-8 text-gold animate-spin absolute inset-0 m-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-28 pb-32">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
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
              <span className="px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-black text-gold uppercase tracking-[0.2em]">Freelance Editor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Servicios Profesionales</span>
            </div>
            <h1 className="text-6xl font-display font-black text-white tracking-tighter leading-none mb-4">
              Editar <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">Servicio</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
              Refina tu propuesta de valor y contenido visual para destacar en el ecosistema Mercav.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Multimedia Card */}
            <div className="bg-[#121212]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Portfolio Visual</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Imágenes del Servicio</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {formData.images.map((url: string, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={i} 
                    className="relative aspect-video rounded-[2.5rem] overflow-hidden group border border-white/10 bg-black/40"
                  >
                    <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Service" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button type="button" onClick={() => removeImage(url)} className="p-4 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                <div className="aspect-video rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center group hover:border-gold/40 transition-all">
                  <input 
                    type="text" 
                    placeholder="URL de imagen..." 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 text-xs text-white py-3 mb-4 focus:outline-none focus:border-gold text-center"
                  />
                  <button type="button" onClick={addImage} className="px-8 py-3 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    Añadir
                  </button>
                </div>
              </div>
            </div>

            {/* Service Details Card */}
            <div className="bg-[#121212]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Propuesta de Valor</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Información del Servicio</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Título del Servicio</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] h-20 px-8 text-white text-xl font-bold focus:outline-none focus:border-gold/30 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Descripción del Servicio</label>
                  <textarea 
                    required 
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-[3rem] p-8 text-white text-lg focus:outline-none focus:border-gold/30 transition-all resize-none leading-relaxed shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Options */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#121212]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                  <Tag size={22} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Clasificación</h3>
              </div>

              <div className="space-y-8">
                <CustomSelect
                  label="Categoría"
                  value={formData.category}
                  onChange={(val) => setFormData({...formData, category: val})}
                  options={[
                    { value: "DESARROLLO_WEB", label: "Desarrollo Web" },
                    { value: "DISENO", label: "Diseño Gráfico" },
                    { value: "MARKETING", label: "Marketing Digital" },
                    { value: "VIDEO", label: "Edición de Video" },
                  ]}
                />

                <div className="mt-10 p-6 rounded-[2rem] bg-gold/5 border border-gold/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gold/60 uppercase tracking-widest mb-1">Inversión Inicial</p>
                    <p className="text-2xl font-mono font-black text-gold">Consultar</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-gray-500 uppercase tracking-tighter">No Editable</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gold to-yellow-700 rounded-[3rem] p-2 shadow-2xl shadow-gold/20">
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full bg-black rounded-[2.8rem] py-8 px-6 flex flex-col items-center justify-center gap-2 hover:bg-black/80 transition-all group"
              >
                {saving ? (
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                      <Save size={24} />
                    </div>
                    <span className="text-lg font-black text-white uppercase tracking-[0.3em]">Guardar Cambios</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cinematic Modal */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[40px] flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl bg-[#121212] border border-white/10 p-16 rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,1)] text-center relative overflow-hidden">
              <div className="w-28 h-28 bg-gold/10 rounded-full flex items-center justify-center mb-10 border border-gold/20 mx-auto">
                <CheckCircle className="w-14 h-14 text-gold" />
              </div>
              <h2 className="text-6xl font-display font-black text-white mb-6 tracking-tight">¡Perfecto!</h2>
              <p className="text-gray-400 text-xl leading-relaxed mb-12">Tu oferta de servicio ha sido actualizada en la red Mercav.</p>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden max-w-sm mx-auto">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="h-full bg-gold" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// creado por Patodev y Invertilo
