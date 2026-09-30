"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Plus, PackageX, Leaf, ShieldCheck, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BarcodeScanner, { canScanWithCamera } from './BarcodeScanner';
import { formatQuantity, getUnit, type BusinessType } from '@/lib/pos/business';
import { formatMoney } from '@/lib/pos/money';

export interface POSGridProduct {
  id: string;
  name: string;
  price: number | string;
  stock: number | string;
  unit?: string;
  trackStock?: boolean;
  taxRate?: number | string | null;
  sku?: string | null;
  barcode?: string | null;
  isActive?: boolean;
  imageUrl?: string;
  categoryId?: string;
  isKosher?: boolean;
  isHalal?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

interface POSProductGridProps {
  products: POSGridProduct[];
  categories: { id: string, name: string }[];
  onAdd: (product: POSGridProduct) => void;
  onNotFound: (code: string) => void;
  currency: string;
  business: BusinessType;
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export default function POSProductGrid({ products, categories, onAdd, onNotFound, currency, business }: POSProductGridProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setCameraAvailable(canScanWithCamera()), []);

  // USB and Bluetooth scanners type like a keyboard; route stray keystrokes into the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || isTypingTarget(e.target)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sellable = products.filter((p) => p.isActive !== false);
  const term = search.trim().toLowerCase();
  const filteredProducts = sellable.filter(p => {
    const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.sku?.toLowerCase() === term || p.barcode === term;
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addByCode = useCallback((raw: string) => {
    const code = raw.trim();
    if (!code) return false;
    const match = sellable.find((p) => p.barcode === code || p.sku?.toLowerCase() === code.toLowerCase());
    if (match) {
      onAdd(match);
      setSearch('');
      return true;
    }
    return false;
  }, [sellable, onAdd]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (addByCode(search)) return;
    if (filteredProducts.length === 1) {
      onAdd(filteredProducts[0]);
      setSearch('');
    } else if (term && filteredProducts.length === 0) {
      onNotFound(search.trim());
    }
  };

  const handleDetected = useCallback((code: string) => {
    setScanning(false);
    if (!addByCode(code)) onNotFound(code);
  }, [addByCode, onNotFound]);

  return (
    <div className="flex flex-col h-full lg:min-h-full">
      {/* Filters and Search */}
      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={20} />
            <input
              ref={searchRef}
              type="search"
              aria-label="Buscar producto o escanear código"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(e);
              }}
              placeholder="Buscar o escanear código..."
              className="w-full h-16 bg-bg-secondary border border-white/5 rounded-2xl pl-14 pr-6 text-white outline-none focus:border-gold/30 transition-all font-medium text-lg shadow-inner"
            />
          </div>
          {cameraAvailable && (
            <button
              type="button"
              onClick={() => setScanning(true)}
              aria-label="Escanear con la cámara"
              className="w-16 h-16 flex-shrink-0 bg-bg-secondary border border-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 transition-all"
            >
              <ScanLine size={22} />
            </button>
          )}
        </form>

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
              {filteredProducts.map((p) => {
                const tracked = p.trackStock !== false;
                const stock = Number(p.stock);
                const outOfStock = tracked && stock <= 0;
                const unit = getUnit(p.unit);
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={outOfStock ? undefined : { y: -5 }}
                    whileTap={outOfStock ? undefined : { scale: 0.95 }}
                    key={p.id}
                    disabled={outOfStock}
                    onClick={() => onAdd(p)}
                    className="bg-bg-secondary border border-white/5 rounded-3xl p-4 text-left group hover:border-gold/30 transition-all shadow-lg overflow-hidden relative disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/5"
                  >
                    {tracked && (
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter z-10 ${outOfStock ? 'bg-red-500/20 text-red-400' : stock > 10 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {outOfStock ? 'Sin stock' : formatQuantity(stock, p.unit)}
                      </div>
                    )}

                    <div className="aspect-square rounded-2xl bg-black/40 mb-4 overflow-hidden relative">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <Plus size={40} />
                        </div>
                      )}

                      {business.dietary && (
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {p.isKosher && <div title="Kosher" className="w-5 h-5 rounded-md bg-blue-500/80 backdrop-blur-sm text-white flex items-center justify-center text-[8px] font-black">K</div>}
                          {p.isHalal && <div title="Halal" className="w-5 h-5 rounded-md bg-green-500/80 backdrop-blur-sm text-white flex items-center justify-center text-[8px] font-black">H</div>}
                          {p.isVegan && <div title="Vegano" className="w-5 h-5 rounded-md bg-emerald-500/80 backdrop-blur-sm text-white flex items-center justify-center"><Leaf size={10} /></div>}
                          {p.isGlutenFree && <div title="Sin TACC" className="w-5 h-5 rounded-md bg-amber-500/80 backdrop-blur-sm text-white flex items-center justify-center"><ShieldCheck size={10} /></div>}
                        </div>
                      )}

                      {!outOfStock && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                          <span className="bg-gold text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Agregar</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-white font-bold text-sm line-clamp-1 mb-1">{p.name}</h4>
                    <p className="text-gold font-mono font-bold text-lg">
                      {formatMoney(p.price, currency)}
                      {unit.id !== 'UNIT' && <span className="text-xs text-gray-500"> / {unit.short}</span>}
                    </p>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-30 py-20">
            <PackageX size={80} strokeWidth={1} />
            <p className="mt-4 font-black uppercase tracking-[0.3em] text-xs">No hay productos</p>
          </div>
        )}
      </div>

      {scanning && <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />}
    </div>
  );
}
// creado por pato dev y askforvini
