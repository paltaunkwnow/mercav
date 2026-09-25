"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MonitorPlay, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2,
  Send,
  Sparkles,
  Zap,
  Package,
  Layers,
  Clock,
  RotateCcw,
  Target,
  Trophy,
  ShieldCheck,
  Star,
  Settings2,
  DollarSign,
  Image as ImageIcon,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicarServicioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [createPost, setCreatePost] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "DESARROLLO_WEB",
    subcategory: "",
    deliveryDays: 5,
    revisions: 3,
    packagePrice: "",
    imageUrl: "",
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          packagePrice: parseFloat(formData.packagePrice),
          images: formData.imageUrl ? [formData.imageUrl] : []
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (createPost) {
          await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `¡He lanzado un nuevo servicio en Mercav! 🚀\n\n${formData.title}\n\n"${formData.description.slice(0, 150)}..."\n\n¿Buscas a alguien para este tipo de trabajos? ¡Hablemos!`,
              module: "SERVICES",
              serviceId: data.data.id,
              images: formData.imageUrl ? [formData.imageUrl] : []
            }),
          });
        }
        showToast("Servicio publicado con éxito", "success");
        setTimeout(() => router.push("/servicios"), 1500);
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
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-[1600px] relative z-10">
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-12">
          <Link href="/servicios" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all backdrop-blur-md group shrink-0">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[9px] font-black text-gold uppercase tracking-[0.2em]">Mercav Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter leading-tight">
              Ofrecer <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold">Servicio</span>
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Image Upload Card */}
            <div className="relative overflow-hidden space-y-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                  <ImageIcon size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Registro Visual</h3>
              </div>
              <div className="grid md:grid-cols-[240px_1fr] gap-8">
                <div className="aspect-[4/3] rounded-2xl bg-black/60 border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group shadow-inner">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        Cambiar foto
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-3">
                      <Plus size={24} className="mx-auto text-gray-600" />
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">Añadir URL</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Enlace de Imagen</label>
                    <input 
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://servidor.com/servicio.jpg"
                      className="w-full bg-black/60 rounded-xl h-14 px-6 text-white text-xs focus:bg-white/[0.05] border-none outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Core Info Card */}
            <div className="relative overflow-hidden space-y-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Definición de Propuesta</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Título de tu Oferta</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej. Diseño de Branding Minimalista de Alta Gama"
                    className="w-full bg-black/60 rounded-2xl h-16 px-6 text-white text-lg font-bold focus:outline-none focus:bg-white/[0.05] transition-all border-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <CustomSelect
                    label="Categoría Principal"
                    value={formData.category}
                    onChange={(val) => setFormData({...formData, category: val})}
                    options={[
                      { value: "DESARROLLO_WEB", label: "Desarrollo Web" },
                      { value: "DISENO", label: "Diseño Gráfico" },
                      { value: "MARKETING", label: "Marketing Digital" },
                      { value: "IA", label: "Inteligencia Artificial" },
                      { value: "VIDEO", label: "Video y Animación" },
                    ]}
                  />
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Subcategoría (Opcional)</label>
                    <input 
                      value={formData.subcategory}
                      onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                      placeholder="Ej. Logos o E-commerce"
                      className="w-full bg-black/60 rounded-2xl h-16 px-6 text-white font-bold focus:outline-none focus:bg-white/[0.05] transition-all border-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Descripción Detallada</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe el proceso, los entregables y por qué deberían contratarte..."
                    className="w-full bg-black/60 rounded-[2rem] p-6 text-white text-base focus:outline-none focus:bg-white/[0.05] transition-all resize-none leading-relaxed border-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Amplification Card */}
            <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white mb-2">Amplificación Instantánea</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Genera un anuncio automático en el feed para toda la comunidad.</p>
                </div>
                <div 
                  onClick={() => setCreatePost(!createPost)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer min-w-[240px] ${
                    createPost ? "bg-gold/10 border-gold/20" : "bg-black/40 border-white/5"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    createPost ? "border-gold bg-gold text-black" : "border-gray-700"
                  }`}>
                    {createPost && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Publicar en Feed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Packaging Card */}
            <div className="relative overflow-hidden space-y-8 sticky top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                  <Package size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Condiciones</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">Precio de Entrada (USD)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gold h-5 w-5" />
                    <input 
                      required 
                      type="number"
                      value={formData.packagePrice}
                      onChange={(e) => setFormData({...formData, packagePrice: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-black/60 rounded-2xl h-16 pl-14 pr-6 text-white text-2xl font-mono font-black focus:outline-none focus:bg-white/[0.05] transition-all border-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border-none">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                      <Clock size={12} />
                      <p className="text-[8px] font-black uppercase tracking-widest">Entrega</p>
                    </div>
                    <div className="flex items-end gap-1">
                      <input 
                        required 
                        type="number"
                        value={formData.deliveryDays}
                        onChange={(e) => setFormData({...formData, deliveryDays: parseInt(e.target.value)})}
                        className="bg-transparent text-xl font-black text-white w-10 outline-none border-b border-white/[0.05] focus:border-gold/50"
                      />
                      <span className="text-[10px] text-gray-600 font-bold uppercase pb-0.5">Días</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border-none">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                      <RotateCcw size={12} />
                      <p className="text-[8px] font-black uppercase tracking-widest">Revisiones</p>
                    </div>
                    <div className="flex items-end gap-1">
                      <input 
                        required 
                        type="number"
                        value={formData.revisions}
                        onChange={(e) => setFormData({...formData, revisions: parseInt(e.target.value)})}
                        className="bg-transparent text-xl font-black text-white w-10 outline-none border-b border-white/[0.05] focus:border-gold/50"
                      />
                      <span className="text-[10px] text-gray-600 font-bold uppercase pb-0.5">Veces</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gold text-black hover:bg-yellow-400 font-black uppercase tracking-[0.2em] h-16 rounded-2xl shadow-xl shadow-gold/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="text-xs">Lanzar Servicio</span>
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Seguridad Mercav</p>
                  </div>
                  <p className="text-[9px] text-gray-600 leading-tight">Tu pago está protegido. Recibes fondos solo tras la aprobación del cliente.</p>
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
