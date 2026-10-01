"use client";

import { useState, useMemo, useEffect } from 'react';
import { LATAM_LOCATIONS } from '@/lib/data/pos-data';
import { MapPin, ChevronRight, Search, Globe2, Map as MapIcon, X } from 'lucide-react';

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

  const stepName = activeStep === 'country' ? 'país' : activeStep === 'department' ? 'departamento o estado' : 'ciudad';
  const stepTitle = activeStep === 'country' ? 'Elegí el país' : activeStep === 'department' ? 'Elegí el departamento o estado' : 'Elegí la ciudad';
  const fieldBtn = 'mv-focus flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] px-4 py-3 text-left transition-colors duration-150 hover:border-[var(--color-border-gold)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--mv-hairline-strong)]';
  const fieldIcon = 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold';
  const fieldKicker = 'text-xs font-medium text-[var(--text-secondary)]';
  const fieldValue = (v: string) => `mt-0.5 text-sm font-semibold ${v ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => { setIsOpen(true); setActiveStep('country'); }}
          className={fieldBtn}
        >
          <span className={fieldIcon}><Globe2 size={18} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className={`block ${fieldKicker}`}>País</span>
            <span className={`block truncate ${fieldValue(country)}`}>{country || 'Elegir'}</span>
          </span>
        </button>

        <button
          type="button"
          disabled={!country}
          onClick={() => { setIsOpen(true); setActiveStep('department'); }}
          className={fieldBtn}
        >
          <span className={fieldIcon}><MapIcon size={18} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className={`block ${fieldKicker}`}>Departamento o estado</span>
            <span className={`block truncate ${fieldValue(department)}`}>{department || (country ? 'Elegir' : 'Elegí el país primero')}</span>
          </span>
        </button>

        <button
          type="button"
          disabled={!department}
          onClick={() => { setIsOpen(true); setActiveStep('city'); }}
          className={fieldBtn}
        >
          <span className={fieldIcon}><MapPin size={18} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className={`block ${fieldKicker}`}>Ciudad o municipio</span>
            <span className={`block line-clamp-2 leading-tight ${fieldValue(city)}`}>{city || (department ? 'Elegir' : 'Elegí el departamento primero')}</span>
          </span>
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="pos-address" className="block text-sm font-semibold text-[var(--text-secondary)]">Dirección</label>
        <input
          id="pos-address"
          type="text"
          value={address}
          onChange={(e) => onChange({ country, department, city, address: e.target.value })}
          placeholder="Calle, número, local u oficina"
          autoComplete="street-address"
          className="mv-input"
        />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-step-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
        >
          <div onClick={() => setIsOpen(false)} className="mv-fade absolute inset-0 bg-black/50" aria-hidden />
          <div className="mv-pop mv-menu relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--mv-hairline)] py-4 pl-6 pr-3">
              <div>
                <p className="mv-data text-xs text-[var(--text-secondary)]">Paso {activeStep === 'country' ? '1' : activeStep === 'department' ? '2' : '3'} de 4</p>
                <h3 id="location-step-title" className="mv-h3 mt-1">{stepTitle}</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar" className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} aria-hidden />
                <input
                  type="text"
                  autoFocus
                  aria-label={`Buscar ${stepName}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Buscar ${stepName}`}
                  autoComplete="off"
                  className="mv-input pl-11"
                />
              </div>
            </div>

            <ul className="custom-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
              {currentOptions.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="mv-focus flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left text-sm font-medium text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--mv-panel-hover)]"
                  >
                    <span>{opt}</span>
                    <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                  </button>
                </li>
              ))}
              {currentOptions.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">No hay resultados para esa búsqueda.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
