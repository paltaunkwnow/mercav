"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Code, PenTool, TrendingUp, Video, Camera, Cpu, Star, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TiltCard } from "@/components/motion/TiltCard";

const CATEGORIES_BASE = [
  { icon: Code, name: "Desarrollo Web", key: "DESARROLLO_WEB" },
  { icon: PenTool, name: "Diseño Gráfico", key: "DISENO" },
  { icon: TrendingUp, name: "Marketing Digital", key: "MARKETING" },
  { icon: Video, name: "Edición de Video", key: "VIDEO" },
  { icon: Camera, name: "Fotografía", key: "FOTOGRAFIA" },
  { icon: Cpu, name: "Inteligencia Artificial", key: "IA" },
];

export default function ServiciosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch services
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServices(data.data);
        }
      })
      .catch(console.error);

    // Fetch counts
    fetch('/api/services/count')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategoryCounts(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full min-h-screen bg-bg-primary pb-20 section-transition">
      {/* Hero Section */}
      <section className="relative bg-bg-secondary pt-28 md:pt-32 pb-16 md:pb-20 border-b border-border overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/[0.03] blur-[180px] rounded-full" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mercav Services
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight"
            >
              Encuentra el <span className="gradient-text-gold">talento freelance</span> perfecto para tu proyecto
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Desarrolladores, diseñadores y expertos en marketing listos para empezar a trabajar hoy mismo.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="liquid-glass-lens flex p-2 rounded-xl md:rounded-2xl max-w-2xl mx-auto glassmorphism"
            >
              <Search className="h-5 w-5 text-gray-500 my-auto ml-4 mr-2" />
              <input 
                type="text" 
                placeholder="¿Qué servicio estás buscando?" 
                className="w-full bg-transparent border-none text-white focus:ring-0 focus:outline-none h-12 placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="bg-gold text-black hover:bg-gold-light rounded-lg md:rounded-xl px-6 md:px-8 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                Buscar
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-10 md:py-12">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">Explorar por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {CATEGORIES_BASE.map((cat, i) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.key] || 0;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                key={cat.name}
                onClick={() => setSearchQuery(cat.name.split(' ')[0])}
                className="h-full"
              >
              <TiltCard className="bg-bg-secondary/50 border border-white/5 rounded-xl md:rounded-2xl p-5 md:p-6 text-center hover:border-gold/30 transition-colors duration-300 cursor-pointer group glassmorphism h-full">
                <div className="w-11 h-11 md:w-12 md:h-12 mx-auto bg-bg-primary/80 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 group-hover:bg-gold/5 transition-all duration-300 border border-white/5">
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-gold transition-colors duration-300" />
                </div>
                <h3 className="font-medium text-white text-xs md:text-sm mb-1 group-hover:text-gold transition-colors duration-300">{cat.name}</h3>
                <p className="text-[10px] md:text-xs text-gray-500">{count} servicios</p>
              </TiltCard>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Featured Services */}
      <section className="container mx-auto px-4 py-10 md:py-12">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white">Servicios Disponibles</h2>
          <span className="text-gray-400 text-sm">{filteredServices.length} resultados</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-gold/10"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin"></div>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cargando servicios...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-bg-secondary/50 rounded-3xl border border-white/5 glassmorphism">
            <div className="h-16 w-16 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-4 float-gentle">
              <Search className="h-7 w-7 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">No se encontraron servicios.</p>
            <p className="text-gray-600 text-sm">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredServices.map((service, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                key={service.id}
                className="h-full"
              >
              <TiltCard className="bg-bg-secondary/60 border border-white/5 rounded-2xl overflow-hidden hover:border-gold/30 transition-colors duration-500 flex flex-col h-full group glassmorphism">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                    <img src={service.provider?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} alt={service.provider?.name || "Usuario"} className="w-10 h-10 rounded-xl border border-white/10" />
                    <div>
                      <p className="text-white font-medium text-sm">{service.provider?.name || "Proveedor Anónimo"}</p>
                      <div className="flex items-center text-xs text-gold">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verificado
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white leading-snug mb-4 group-hover:text-gold cursor-pointer transition-colors duration-300 line-clamp-2">
                    <Link href={`/servicios/${service.id}`}>{service.title}</Link>
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <span className="text-gold font-bold">{service.reviews?.length > 0 ? service.reviews[0].rating : "5.0"}</span>
                    <span>({service.reviews?.length || 0})</span>
                  </div>
                </div>
                <div className="p-4 md:p-5 bg-bg-tertiary/50 border-t border-white/5 flex items-center justify-between mt-auto backdrop-blur-sm">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Desde</div>
                    <div className="font-mono font-bold text-white text-lg">${service.packages?.[0]?.price || 0}</div>
                  </div>
                  <Button asChild size="sm" className="bg-gold text-black hover:bg-gold-light rounded-xl font-bold px-5 transition-all hover:scale-105 hover:shadow-lg hover:shadow-gold/20">
                    <Link href={`/servicios/${service.id}`}>Ver Detalles</Link>
                  </Button>
                </div>
              </TiltCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
