"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  Megaphone, 
  ArrowLeft,
  CheckCircle,
  Save,
  MapPin,
  DollarSign,
  Maximize,
  Compass,
  Hammer,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Layout,
  Layers,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

export default function EditarEspacioPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    type: "VALLA",
    city: "",
    pricePerMonth: "",
    width: "",
    height: "",
    orientation: "NORTE",
    material: "LONA",
    images: []
  });
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`/api/spaces/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            title: data.data.title,
            description: data.data.description,
            type: data.data.type,
            city: data.data.city,
            pricePerMonth: data.data.pricePerMonth,
            width: data.data.width,
            height: data.data.height,
            orientation: data.data.orientation || "NORTE",
            material: data.data.material || "LONA",
            images: data.data.images?.map((img: any) => img.url) || []
          });
        }
      } catch (error) {
        console.error("Error fetching space:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpace();
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
      const res = await fetch(`/api/spaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/anuncios/mis-espacios"), 2000);
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
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-gold/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex items-start gap-8">
            <motion.button 
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()} 
              className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-2xl backdrop-blur-md"
            >
              <ArrowLeft size={28} />
            </motion.button>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Editor de Activos</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Publicidad Exterior</span>
              </div>
              <h1 className="text-6xl font-display font-black text-white tracking-tighter leading-none mb-4">
                Editar <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Espacio</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                Optimiza el impacto visual y los datos técnicos de tu ubicación estratégica en el mercado de Bolivia.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Card */}
          <div className="lg:col-span-8 space-y-10">
            {/* Multimedia Card */}
            <div className="bg-[#121212]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Galería Visual</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Multimedia del Activo</p>
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
                    <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Space Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button 
                        type="button"
                        onClick={() => removeImage(url)}
                        className="p-4 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                <div className="aspect-video rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center group hover:border-emerald-500/40 transition-all">
                  <input 
                    type="text" 
                    placeholder="URL de imagen..." 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 text-xs text-white py-3 mb-4 focus:outline-none focus:border-emerald-500 transition-colors text-center"
                  />
                  <button 
                    type="button" 
                    onClick={addImage}
                    className="px-8 py-3 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Agregar Imagen
                  </button>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="bg-[#121212]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Información General</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Detalles Descriptivos</p>
                  </div>
                </div>

              <div className="space-y-8">
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Título Comercial</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej: Valla Premium Segundo Anillo"
                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] h-20 px-8 text-white text-xl font-bold focus:outline-none focus:border-emerald-500/30 transition-all shadow-inner"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">Referencia de Ubicación</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe los puntos de referencia exactos..."
                    className="w-full bg-black/40 border border-white/5 rounded-[3rem] p-8 text-white text-lg focus:outline-none focus:border-emerald-500/30 transition-all resize-none leading-relaxed shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Specs */}
          <div className="lg:col-span-4 space-y-8">
            {/* Technical Specs Card */}
            <div className="bg-[#121212]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Settings2 size={22} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Ficha Técnica</h3>
              </div>

              <div className="space-y-6">
                <CustomSelect
                  label="Tipo de Soporte"
                  value={formData.type}
                  onChange={(val) => setFormData({...formData, type: val})}
                  options={[
                    { value: "VALLA", label: "Valla Publicitaria" },
                    { value: "PANTALLA", label: "Pantalla LED" },
                    { value: "LETRERO", label: "Letrero Luminoso" },
                    { value: "MURO", label: "Muro Publicitario" },
                  ]}
                />

                <div className="group">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">Ciudad / Localidad</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400 h-5 w-5" />
                    <input type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 pl-14 pr-6 text-white font-bold focus:border-emerald-500/30 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Ancho (m)</label>
                    <input type="number" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 px-4 text-white font-mono text-center focus:border-emerald-500/30 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Alto (m)</label>
                    <input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 px-4 text-white font-mono text-center focus:border-emerald-500/30 outline-none transition-all" />
                  </div>
                </div>

                <CustomSelect
                  label="Orientación"
                  value={formData.orientation}
                  onChange={(val) => setFormData({...formData, orientation: val})}
                  options={[
                    { value: "NORTE", label: "Norte" },
                    { value: "SUR", label: "Sur" },
                    { value: "ESTE", label: "Este" },
                    { value: "OESTE", label: "Oeste" },
                  ]}
                />

                <CustomSelect
                  label="Material"
                  value={formData.material}
                  onChange={(val) => setFormData({...formData, material: val})}
                  options={[
                    { value: "LONA", label: "Lona Vinílica" },
                    { value: "LED", label: "Digital / LED" },
                    { value: "METAL", label: "Estructura Metálica" },
                    { value: "OTRO", label: "Otro Material" },
                  ]}
                />
              </div>

              {/* Read-only Price Badge */}
              <div className="mt-10 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Precio Mensual</p>
                  <p className="text-2xl font-mono font-black text-emerald-400">${formData.pricePerMonth}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-gray-500 uppercase tracking-tighter">No Editable</div>
              </div>
            </div>

            {/* Final Action Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[3rem] p-2 shadow-2xl shadow-emerald-500/20">
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full bg-black rounded-[2.8rem] py-8 px-6 flex flex-col items-center justify-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50 group"
              >
                {saving ? (
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Save size={24} />
                    </div>
                    <span className="text-lg font-black text-white uppercase tracking-[0.3em]">Actualizar Activo</span>
                    <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">Confirmar Cambios Técnicos</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cinematic Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[40px] flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -2, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="w-full max-w-2xl bg-[#121212] border border-white/10 p-16 rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,1)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500/20" />
              <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 border border-emerald-500/20 mx-auto shadow-2xl shadow-emerald-500/10">
                <CheckCircle className="w-14 h-14 text-emerald-400" />
              </div>
              <h2 className="text-6xl font-display font-black text-white mb-6 tracking-tight leading-none">¡Éxito!</h2>
              <p className="text-gray-400 text-xl leading-relaxed max-w-md mx-auto mb-12">
                Los datos técnicos y visuales de tu valla han sido actualizados en la red de Mercav.
              </p>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden max-w-sm mx-auto">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// creado por Patodev y Invertilo
