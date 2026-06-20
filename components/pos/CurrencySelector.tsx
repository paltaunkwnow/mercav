"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { LATAM_CURRENCIES } from '@/lib/data/pos-data';
import { motion, AnimatePresence } from 'framer-motion';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function CurrencySelector({ value, onChange, label }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = LATAM_CURRENCIES.find(c => c.code === value) || LATAM_CURRENCIES.find(c => c.code === 'USD');

  const filteredCurrencies = LATAM_CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-14 bg-bg-secondary border border-white/5 rounded-2xl px-5 flex items-center justify-between group hover:border-gold/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{selectedCurrency?.flag}</span>
            <div className="text-left">
              <p className="text-white font-bold text-sm leading-none">{selectedCurrency?.code}</p>
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-tighter mt-1">{selectedCurrency?.name}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-[100] top-full mt-2 w-full bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl"
            >
              <div className="p-3 border-b border-white/5 bg-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar moneda..."
                    className="w-full h-10 bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-gold/30 transition-all"
                  />
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => {
                      onChange(currency.code);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full p-4 flex items-center justify-between hover:bg-gold/10 transition-colors group ${value === currency.code ? 'bg-gold/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{currency.flag}</span>
                      <div className="text-left">
                        <p className={`font-bold text-sm ${value === currency.code ? 'text-gold' : 'text-white'}`}>{currency.code}</p>
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-tighter">{currency.name}</p>
                      </div>
                    </div>
                    {value === currency.code && <Check className="w-4 h-4 text-gold" />}
                  </button>
                ))}
                {filteredCurrencies.length === 0 && (
                  <div className="p-8 text-center">
                    <Globe className="w-8 h-8 text-gray-700 mx-auto mb-2 opacity-20" />
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No se encontraron monedas</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
