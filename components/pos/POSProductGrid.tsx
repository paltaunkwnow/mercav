"use client";

import { useState } from 'react';
import { Search, Plus, Filter, PackageX, Leaf, Heart, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: string;
  isKosher?: boolean;
  isHalal?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

interface POSProductGridProps {
  products: Product[];
  categories: { id: string, name: string }[];
  onAdd: (product: Product) => void;
  currency: string;
}

export default function POSProductGrid({ products, categories, onAdd, currency }: POSProductGridProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full lg:min-h-full">
      {/* Filters and Search */}
      <div className="p-6 space-y-6">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full h-16 bg-bg-secondary border border-white/5 rounded-2xl pl-14 pr-6 text-white outline-none focus:border-gold/30 transition-all font-medium text-lg shadow-inner"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${!selectedCategory ? 'bg-gold text-primary-foreground shadow-lg shadow-gold/20' : 'bg-bg-secondary text-gray-500 border border-white/5 hover:border-gold/30'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-gold text-primary-foreground shadow-lg shadow-gold/20' : 'bg-bg-secondary text-gray-500 border border-white/5 hover:border-gold/30'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="lg:flex-1 lg:overflow-y-auto p-6 pt-0 custom-scrollbar">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p) => (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  key={p.id}
                  onClick={() => onAdd(p)}
                  className="bg-bg-secondary border border-white/5 rounded-3xl p-4 text-left group hover:border-gold/30 transition-all shadow-lg overflow-hidden relative"
                >
                  {/* Stock Indicator */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter z-10 ${p.stock > 10 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {p.stock}
                  </div>

                  <div className="aspect-square rounded-2xl bg-black/40 mb-4 overflow-hidden relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Plus size={40} />
                      </div>
                    )}
                    
                    {/* Dietary Badges on Image */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {p.isKosher && <div className="w-5 h-5 rounded-md bg-blue-500/80 backdrop-blur-sm text-white flex items-center justify-center text-[8px] font-black">K</div>}
                      {p.isHalal && <div className="w-5 h-5 rounded-md bg-green-500/80 backdrop-blur-sm text-white flex items-center justify-center text-[8px] font-black">H</div>}
                      {p.isVegan && <div className="w-5 h-5 rounded-md bg-emerald-500/80 backdrop-blur-sm text-white flex items-center justify-center"><Leaf size={10} /></div>}
                      {p.isGlutenFree && <div className="w-5 h-5 rounded-md bg-amber-500/80 backdrop-blur-sm text-white flex items-center justify-center"><ShieldCheck size={10} /></div>}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                       <span className="bg-gold text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Agregar</span>
                    </div>
                  </div>
                  
                  <h4 className="text-white font-bold text-sm line-clamp-1 mb-1">{p.name}</h4>
                  <p className="text-gold font-mono font-bold text-lg">{currency} {Number(p.price).toFixed(2)}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-30 py-20">
            <PackageX size={80} strokeWidth={1} />
            <p className="mt-4 font-black uppercase tracking-[0.3em] text-xs">No hay productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
