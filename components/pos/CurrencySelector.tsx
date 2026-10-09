"use client";

import { useState, useRef, useEffect, useId } from 'react';
import { Search, ChevronDown, Check } from '@/components/icons';
import { LATAM_CURRENCIES } from '@/lib/data/pos-data';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function CurrencySelector({ value, onChange, label }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();

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
      {label && <label htmlFor={buttonId} className="block text-sm font-semibold text-[var(--text-secondary)]">{label}</label>}
      
      <div className="relative">
        <button
          id={buttonId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="mv-focus flex h-14 w-full items-center justify-between gap-3 rounded-[0.875rem] border border-[var(--mv-hairline-strong)] bg-[color-mix(in_srgb,var(--color-bg-tertiary)_70%,transparent)] px-4 text-left transition-colors duration-150 hover:border-[var(--color-border-gold)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="mv-data inline-flex h-8 min-w-[3.25rem] items-center justify-center rounded-lg bg-[var(--mv-gold-wash)] px-2 text-sm font-semibold text-gold">{selectedCurrency?.code}</span>
            <span className="truncate text-sm font-medium text-[var(--text-primary)]">{selectedCurrency?.name}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {isOpen && (
          <div
            className="mv-pop mv-menu absolute top-full z-[100] mt-2 w-full overflow-hidden rounded-2xl"
            style={{ transformOrigin: 'top center' }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setIsOpen(false); document.getElementById(buttonId)?.focus(); } }}
          >
            <div className="border-b border-[var(--mv-hairline)] p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                <input
                  autoFocus
                  type="text"
                  aria-label="Buscar moneda"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar moneda o código"
                  autoComplete="off"
                  className="mv-input h-11 pl-9 text-sm"
                />
              </div>
            </div>

            <ul className="custom-scrollbar max-h-[300px] overflow-y-auto p-1.5" role="listbox" aria-label="Monedas">
              {filteredCurrencies.map((currency) => {
                const selected = value === currency.code;
                return (
                  <li key={currency.code} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(currency.code);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`mv-focus flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--mv-panel-hover)] ${selected ? 'bg-[var(--mv-gold-wash)]' : ''}`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`mv-data w-12 shrink-0 text-sm font-semibold ${selected ? 'text-gold' : 'text-[var(--text-primary)]'}`}>{currency.code}</span>
                        <span className="truncate text-sm text-[var(--text-secondary)]">{currency.name}</span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden />}
                    </button>
                  </li>
                );
              })}
              {filteredCurrencies.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
                  No encontramos esa moneda. Probá con el código, por ejemplo <span className="mv-data">USD</span>.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
