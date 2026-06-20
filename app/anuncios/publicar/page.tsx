"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Megaphone, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2,
  Send,
  MapPin,
  Maximize2,
  Lightbulb,
  DollarSign,
  Zap,
  Globe,
  Image as ImageIcon,
  Plus,
  Compass,
  Hammer,
  Clock,
  Settings2,
  Info,
  Maximize,
  ChevronDown,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";

const normalizeStr = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const LATAM_LOCATIONS: Record<string, string[]> = {
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta"],
  "Bolivia": ["La Paz", "Santa Cruz de la Sierra", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "El Alto"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "Viña del Mar", "Antofagasta", "Temuco", "La Serena", "Rancagua"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Manizales"],
  "Costa Rica": ["San José", "Alajuela", "Cartago", "Heredia", "Puntarenas", "Limón"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Manta", "Portoviejo", "Loja"],
  "El Salvador": ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Santa Tecla"],
  "Guatemala": ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla"],
  "Honduras": ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso"],
  "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "Querétaro", "Mérida", "Cancún", "León", "San Luis Potosí"],
  "Nicaragua": ["Managua", "León", "Masaya", "Granada", "Chinandega", "Estelí"],
  "Panamá": ["Ciudad de Panamá", "Colón", "David", "Santiago", "La Chorrera"],
  "Paraguay": ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Lambaré", "Capiatá"],
  "Perú": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Huancayo", "Iquitos"],
  "República Dominicana": ["Santo Domingo", "Santiago de los Caballeros", "La Romana", "Punta Cana", "Puerto Plata", "San Pedro de Macorís", "San Francisco de Macorís"],
  "Uruguay": ["Montevideo", "Salto", "Paysandú", "Maldonado", "Las Piedras", "Rivera"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "San Cristóbal", "Barcelona"]
};

export default function PublicarEspacioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [createPost, setCreatePost] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "LETRERO",
    address: "",
    city: "",
    country: "Bolivia",
    width: "",
    height: "",
    unit: "M",
    hasLighting: false,
    trafficEstimate: "",
    pricePerMonth: "",
    currency: "USD",
    imageUrl: "",
    orientation: "Horizontal",
    material: "Lona Vinílica",
    minContractMonths: "1",
  });

  // Custom Dropdown refs & states for País and Ciudad selection
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countries = useMemo(() => {
    return Object.keys(LATAM_LOCATIONS).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, []);

  const cities = useMemo(() => {
    if (!formData.country) return [];
    const matchedKey = Object.keys(LATAM_LOCATIONS).find(
      key => normalizeStr(key) === normalizeStr(formData.country)
    );
    return matchedKey ? LATAM_LOCATIONS[matchedKey].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })) : [];
  }, [formData.country]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          trafficEstimate: formData.trafficEstimate ? parseInt(formData.trafficEstimate) : null,
          pricePerMonth: parseFloat(formData.pricePerMonth),
          minContractMonths: parseInt(formData.minContractMonths),
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
              content: `¡Tengo un nuevo espacio publicitario disponible! 📢\n\n${formData.title}\n\n📍 Ubicado en ${formData.city}, ${formData.country}.\n\n📏 Dimensiones: ${formData.width}x${formData.height} ${formData.unit}\n💎 Material: ${formData.material}\n\n¡Consúltame disponibilidad!`,
              module: "ADS",
              spaceId: data.data.id,
              images: formData.imageUrl ? [formData.imageUrl] : []
            }),
          });
        }
        showToast("Anuncio publicado con éxito", "success");
        setTimeout(() => router.push("/anuncios"), 1500);
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
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-[1600px] relative z-10">
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-12">
          <Link href="/anuncios" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all backdrop-blur-md group shrink-0">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Mercav Advertising</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter leading-tight">
              Publicar <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Espacio</span>
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Image Upload Card */}
            <div className="relative overflow-hidden space-y-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
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
                      placeholder="https://servidor.com/valla.jpg"
                      className="w-full bg-black/60 rounded-xl h-14 px-6 text-white text-xs focus:bg-white/[0.05] border-none outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Details Card */}
            <div className="relative overflow-hidden space-y-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Info size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Especificaciones</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Título de la Ubicación</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej. Mega Valla LED - Intersección Norte"
                    className="w-full bg-black/60 rounded-2xl h-16 px-6 text-white text-lg font-bold focus:bg-white/[0.05] border-none outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <CustomSelect
                    label="Tipo de Soporte"
                    value={formData.type}
                    onChange={(val) => setFormData({...formData, type: val})}
                    options={[
                      { value: "VALLA", label: "Valla / Espectacular" },
                      { value: "LETRERO", label: "Letrero / Banner" },
                      { value: "VIDRIERA", label: "Vidriera / Local" },
                      { value: "PANTALLA", label: "Pantalla Digital" },
                    ]}
                  />
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Dirección Física</label>
                    <input 
                      required 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Calle, Número, Referencia..."
                      className="w-full bg-black/60 rounded-2xl h-16 px-6 text-white font-bold focus:bg-white/[0.05] border-none outline-none"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Selector País */}
                  <div className="relative" ref={countryRef}>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">País</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 z-10 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => {
                          setCountryDropdownOpen(!countryDropdownOpen);
                          setCityDropdownOpen(false);
                        }}
                        className="w-full bg-black/60 rounded-xl h-14 pl-12 pr-10 text-white font-bold focus:bg-white/[0.05] border-none outline-none text-left flex items-center justify-between cursor-pointer select-none"
                      >
                        <span className="truncate">{formData.country || "Selecciona un País"}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 group-hover:text-emerald-400 transition-colors transition-transform duration-300 ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {countryDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 8, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute left-0 right-0 top-full z-[999] max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#1A1A1A] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl mt-1.5 scrollbar-thin scrollbar-thumb-white/10"
                          >
                            {countries.map((country) => (
                              <button
                                key={country}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, country, city: "" });
                                  setCountryDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 cursor-pointer ${
                                  formData.country === country ? "bg-emerald-500 text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span>{country}</span>
                                {formData.country === country && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Selector Ciudad */}
                  <div className="relative" ref={cityRef}>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2">Ciudad</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 z-10 pointer-events-none" />
                      <button
                        type="button"
                        disabled={!formData.country}
                        onClick={() => {
                          setCityDropdownOpen(!cityDropdownOpen);
                          setCountryDropdownOpen(false);
                        }}
                        className="w-full bg-black/60 rounded-xl h-14 pl-12 pr-10 text-white font-bold focus:bg-white/[0.05] border-none outline-none text-left flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                      >
                        <span className="truncate">
                          {!formData.country 
                            ? "Selecciona un país primero" 
                            : (formData.city || "Selecciona una Ciudad")
                          }
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 group-hover:text-emerald-400 transition-colors transition-transform duration-300 ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {cityDropdownOpen && formData.country && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 8, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute left-0 right-0 top-full z-[999] max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#1A1A1A] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl mt-1.5 scrollbar-thin scrollbar-thumb-white/10"
                          >
                            {cities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, city });
                                  setCityDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 cursor-pointer ${
                                  formData.city === city ? "bg-emerald-500 text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span>{city}</span>
                                {formData.city === city && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Logistics Card */}
            <div className="relative overflow-hidden space-y-8 sticky top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/10">
                  <Maximize size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Ficha Técnica</h3>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-2">Ancho</label>
                    <input type="number" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} className="w-full bg-black/60 rounded-xl h-12 px-4 text-white font-mono text-xs border-none outline-none focus:bg-white/[0.05] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-2">Alto</label>
                    <input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="w-full bg-black/60 rounded-xl h-12 px-4 text-white font-mono text-xs border-none outline-none focus:bg-white/[0.05] transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect
                    label="Unidad"
                    value={formData.unit}
                    onChange={(val) => setFormData({...formData, unit: val})}
                    options={[{ value: "M", label: "Metros" }, { value: "CM", label: "CM" }]}
                  />
                  <CustomSelect
                    label="Orientación"
                    value={formData.orientation}
                    onChange={(val) => setFormData({...formData, orientation: val})}
                    options={[{ value: "Horizontal", label: "Land." }, { value: "Vertical", label: "Port." }]}
                  />
                </div>

                <div 
                  onClick={() => setFormData({ ...formData, hasLighting: !formData.hasLighting })}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer border-none ${
                    formData.hasLighting ? "bg-emerald-500/10 text-emerald-400" : "bg-black/60 text-gray-700"
                  }`}
                >
                  <Lightbulb size={16} className={formData.hasLighting ? "animate-pulse" : ""} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Iluminación</span>
                </div>

                <div className="pt-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center mb-4">
                    <p className="text-[8px] font-black text-emerald-400/70 uppercase tracking-widest mb-2">Precio Mensual (USD)</p>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400/50 h-4 w-4" />
                      <input 
                        type="number" 
                        value={formData.pricePerMonth} 
                        onChange={(e) => setFormData({...formData, pricePerMonth: e.target.value})} 
                        className="w-full bg-black/80 rounded-xl h-14 pl-10 pr-4 text-white font-mono text-xl font-black focus:bg-emerald-500/10 transition-all outline-none border-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase tracking-[0.2em] h-16 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="text-xs">Lanzar Espacio</span>
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
