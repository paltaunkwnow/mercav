"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, Star, Hash, LayoutGrid, MonitorPlay, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CATEGORIES = [
  { title: "Vallas Publicitarias", count: "1.2k", icon: MonitorPlay, href: "/anuncios", color: "text-blue-400" },
  { title: "Desarrollo Web", count: "340", icon: Hash, href: "/servicios", color: "text-purple-400" },
  { title: "Diseño UX/UI", count: "156", icon: LayoutGrid, href: "/servicios", color: "text-pink-400" },
  { title: "Marketing Digital", count: "210", icon: Zap, href: "/servicios", color: "text-gold" },
  { title: "Empleos Tech", count: "89", icon: Briefcase, href: "/empleos", color: "text-green-400" },
];

export default function ExplorarPage() {
  return (
    <div className="w-full min-h-screen bg-bg-primary pb-24 pt-20">
      {/* Mobile-focused Search Header */}
      <div className="sticky top-16 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar en todo Mercav..." 
            className="w-full h-12 pl-10 pr-4 bg-bg-secondary border border-border rounded-xl text-white focus:border-gold focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Explorar Categorías</h1>
        
        {/* Categories Horizontal Scroll */}
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 space-x-4 scrollbar-hide">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link href={cat.href} key={i}>
                <div className="flex-shrink-0 w-32 h-32 bg-bg-secondary border border-border rounded-2xl p-4 flex flex-col justify-between hover:border-gold transition-colors">
                  <Icon className={`h-6 w-6 ${cat.color}`} />
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1 leading-tight">{cat.title}</h3>
                    <p className="text-xs text-gray-500">{cat.count} opciones</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Trending Section */}
        <h2 className="font-display text-2xl font-bold text-white mt-8 mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold fill-gold" />
          Tendencias en tu zona
        </h2>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <motion.div 
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item * 0.1 }}
              className="bg-bg-secondary border border-border rounded-xl p-4 flex gap-4"
            >
              <div className="w-20 h-20 bg-bg-tertiary rounded-lg overflow-hidden flex-shrink-0 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white text-sm line-clamp-2">Pantalla LED de alto impacto en zona empresarial</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <MapPin className="h-3 w-3" /> Santa Cruz
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-gold font-mono font-bold text-sm">$800/mes</span>
                  <div className="flex items-center text-xs text-gray-400">
                    <Star className="h-3 w-3 fill-gold text-gold mr-1" /> 4.9
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
