"use client";

import { useState, useMemo, useEffect } from 'react';
import { LATAM_LOCATIONS } from '@/lib/data/pos-data';
import { MapPin, ChevronRight, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSelectorProps {
  country: string;
  department: string;
  city: string;
  address: string;
  onChange: (data: { country: string; department: string; city: string; address: string }) => void;
}

export default function LocationSelector({ country, department, city, address, onChange }: LocationSelectorProps) {
  const [activeStep, setActiveStep] = useState<'country' | 'department' | 'city' | 'address'>('country');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const selectedCountry = useMemo(() => LATAM_LOCATIONS.find(l => l.country === country), [country]);
  const selectedDept = useMemo(() => selectedCountry?.departments.find(d => d.name === department), [selectedCountry, department]);

  const currentOptions = useMemo(() => {
    const s = search.toLowerCase();
    if (activeStep === 'country') return LATAM_LOCATIONS.map(l => l.country).filter(c => c.toLowerCase().includes(s));
    if (activeStep === 'department') return selectedCountry?.departments.map(d => d.name).filter(d => d.toLowerCase().includes(s)) || [];
    if (activeStep === 'city') return selectedDept?.cities.filter(c => c.toLowerCase().includes(s)) || [];
    return [];
  }, [activeStep, selectedCountry, selectedDept, search]);

  const handleSelect = (val: string) => {
    if (activeStep === 'country') {
      onChange({ country: val, department: '', city: '', address });
      setActiveStep('department');
    } else if (activeStep === 'department') {
      onChange({ country, department: val, city: '', address });
      setActiveStep('city');
    } else if (activeStep === 'city') {
      onChange({ country, department, city: val, address });
      setIsOpen(false);
    }
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Country Display */}
        <button
          type="button"
          onClick={() => { setIsOpen(true); setActiveStep('country'); }}
          className="min-h-[5rem] h-auto py-4 bg-bg-secondary border border-white/5 rounded-2xl px-5 flex items-center gap-4 hover:border-gold/30 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">País</p>
            <p className="text-white font-bold text-sm truncate">{country || 'Seleccionar'}</p>
          </div>
        </button>

        {/* Department Display */}
        <button
          type="button"
          disabled={!country}
          onClick={() => { setIsOpen(true); setActiveStep('department'); }}
          className="min-h-[5rem] h-auto py-4 bg-bg-secondary border border-white/5 rounded-2xl px-5 flex items-center gap-4 hover:border-gold/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all flex-shrink-0">
            <ChevronRight size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Dpto / Estado</p>
            <p className="text-white font-bold text-sm truncate">{department || 'Seleccionar'}</p>
          </div>
        </button>

        {/* City Display */}
        <button
          type="button"
          disabled={!department}
          onClick={() => { setIsOpen(true); setActiveStep('city'); }}
          className="min-h-[5rem] h-auto py-4 bg-bg-secondary border border-white/5 rounded-2xl px-5 flex items-center gap-4 hover:border-gold/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Ciudad / Municipio</p>
            <p className="text-white font-bold text-sm leading-tight line-clamp-2">{city || 'Seleccionar'}</p>
          </div>
        </button>
      </div>

      {/* Address Field */}
      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Dirección Exacta</label>
        <input
          type="text"
          value={address}
          onChange={(e) => onChange({ country, department, city, address: e.target.value })}
          placeholder="Calle, número, oficina..."
          className="w-full h-14 bg-bg-secondary border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-gold/30 transition-all"
        />
      </div>

      {/* Custom Selector Modal-like overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-bg-primary border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-secondary">
                <div>
                  <h3 className="text-2xl font-bold text-white">Seleccionar {activeStep === 'country' ? 'País' : activeStep === 'department' ? 'Departamento' : 'Ciudad'}</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-black tracking-widest">Nivel {activeStep === 'country' ? '1' : activeStep === 'department' ? '2' : '3'} de 4</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
              </div>

              <div className="p-6 bg-white/5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Buscar ${activeStep}...`}
                    className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 text-white outline-none focus:border-gold/30 transition-all"
                  />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar space-y-1">
                {currentOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className="w-full p-4 rounded-2xl hover:bg-gold/10 flex items-center justify-between group transition-all"
                  >
                    <span className="text-white font-bold group-hover:text-gold transition-colors">{opt}</span>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-gold transition-all group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
