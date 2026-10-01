"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Package, PackageX, Leaf, ShieldCheck, ScanLine } from 'lucide-react';
import { buttonClass } from '@/components/site/primitives';
import BarcodeScanner from './BarcodeScanner';
import { isLowStock, keyTiming } from '@/lib/pos/stock';

// USB/Bluetooth readers type a whole code in a burst and press Enter. People don't type 4+ keys this fast.
const SCAN_GAP_MS = 45;
const SCAN_MIN_LENGTH = 4;
// Keys the terminal uses as shortcuts; they must not pull focus into the search box.
const SHORTCUT_KEYS = new Set(['/', '?', '+', '-']);
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
  minStock?: number | string | null;
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
  const searchRef = useRef<HTMLInputElement>(null);

  // USB and Bluetooth scanners type like a keyboard; route stray keystrokes into the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || isTypingTarget(e.target)) return;
      if (SHORTCUT_KEYS.has(e.key)) return;
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

  // Global capture of scanner bursts that end in Enter. Ignored while typing in any field except the search box.
  const onBurstRef = useRef<(code: string) => void>(() => {});
  onBurstRef.current = (code: string) => {
    if (!addByCode(code)) {
      setSearch('');
      onNotFound(code);
    }
  };
  useEffect(() => {
    let buffer = '';
    const onKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      keyTiming.previous = keyTiming.last;
      keyTiming.last = now;
      const gap = now - keyTiming.previous;

      if (document.querySelector('[aria-modal="true"]')) { buffer = ''; return; }
      if (isTypingTarget(e.target) && e.target !== searchRef.current) { buffer = ''; return; }

      if (e.key === 'Enter') {
        const code = buffer;
        buffer = '';
        if (code.length >= SCAN_MIN_LENGTH && gap <= SCAN_GAP_MS) {
          e.preventDefault();
          e.stopPropagation();
          onBurstRef.current(code);
        }
        return;
      }
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) { buffer = ''; return; }
      buffer = gap > SCAN_GAP_MS ? e.key : buffer + e.key;
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const hasCatalog = sellable.length > 0;
  const filtering = Boolean(term) || selectedCategory !== null;

  const chipClass = (active: boolean) =>
    `mv-focus inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
      active
        ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold'
        : 'border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="flex flex-col h-full lg:min-h-full">
      {/* Search, scan and categories */}
      <div className="space-y-3 px-4 pt-4 pb-3 lg:px-6 lg:pt-5">
        <form onSubmit={handleSubmit} className="flex gap-2" role="search">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={20} aria-hidden />
            <input
              ref={searchRef}
              data-pos-search
              type="search"
              aria-label="Buscar producto o escanear código"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(e);
              }}
              placeholder="Buscá por nombre, SKU o código"
              autoComplete="off"
              enterKeyHint="search"
              className="mv-input h-14 pl-12 pr-4 text-base"
            />
          </div>
          {(
            <button
              type="button"
              onClick={() => setScanning(true)}
              aria-label="Escanear o ingresar un código"
              className="mv-focus grid h-14 w-14 shrink-0 place-items-center rounded-[0.875rem] border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)] transition-[transform,color,border-color] duration-150 hover:text-gold active:scale-[0.97]"
            >
              <ScanLine size={22} aria-hidden />
            </button>
          )}
        </form>

        {categories.length > 0 && (
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 lg:-mx-6 lg:px-6" role="group" aria-label="Filtrar por categoría">
            <button type="button" aria-pressed={!selectedCategory} onClick={() => setSelectedCategory(null)} className={chipClass(!selectedCategory)}>
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={chipClass(selectedCategory === cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="custom-scrollbar px-4 pb-6 lg:flex-1 lg:overflow-y-auto lg:px-6">
        {filteredProducts.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-label="Productos">
            {filteredProducts.map((p) => {
              const tracked = p.trackStock !== false;
              const stock = Number(p.stock);
              const outOfStock = tracked && stock <= 0;
              const lowStock = !outOfStock && isLowStock(p);
              const unit = getUnit(p.unit);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={() => onAdd(p)}
                    className="mv-focus group flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] border border-[var(--mv-hairline)] bg-[var(--color-bg-secondary)] p-2 text-left transition-[transform,border-color] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 [@media(hover:hover)]:hover:border-[var(--color-border-gold)] disabled:[@media(hover:hover)]:hover:border-[var(--mv-hairline)]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[0.875rem] bg-[var(--color-bg-tertiary)]">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover ${outOfStock ? 'opacity-40 grayscale' : ''}`} />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[var(--text-tertiary)]" aria-hidden>
                          <Package size={28} strokeWidth={1.5} />
                        </div>
                      )}

                      {business.dietary && (p.isKosher || p.isHalal || p.isVegan || p.isGlutenFree) && (
                        <div className="absolute left-1.5 top-1.5 flex gap-1">
                          {p.isKosher && <span title="Kosher" className="grid h-6 w-6 place-items-center rounded-md bg-[#1d4f91] text-[10px] font-bold text-[#fff]"><span aria-hidden>K</span><span className="sr-only">Kosher</span></span>}
                          {p.isHalal && <span title="Halal" className="grid h-6 w-6 place-items-center rounded-md bg-[#15803d] text-[10px] font-bold text-[#fff]"><span aria-hidden>H</span><span className="sr-only">Halal</span></span>}
                          {p.isVegan && <span title="Vegano" className="grid h-6 w-6 place-items-center rounded-md bg-[#047857] text-[#fff]"><Leaf size={12} aria-hidden /><span className="sr-only">Vegano</span></span>}
                          {p.isGlutenFree && <span title="Sin TACC" className="grid h-6 w-6 place-items-center rounded-md bg-[#b45309] text-[#fff]"><ShieldCheck size={12} aria-hidden /><span className="sr-only">Sin TACC</span></span>}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1 px-1 pt-2 pb-0.5">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">{p.name}</span>
                      <span className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 pt-1">
                        <span className="mv-data text-base font-semibold text-[var(--text-primary)]">
                          {formatMoney(p.price, currency)}
                          {unit.id !== 'UNIT' && <span className="text-xs font-normal text-[var(--text-secondary)]"> / {unit.short}</span>}
                        </span>
                        {tracked && (
                          <span className={`mv-data shrink-0 text-xs ${outOfStock ? 'font-semibold text-red-400' : lowStock ? 'font-semibold text-red-400' : 'text-[var(--text-secondary)]'}`}>
                            {outOfStock ? 'Sin stock' : lowStock ? `Stock bajo · ${formatQuantity(stock, p.unit)}` : formatQuantity(stock, p.unit)}
                            {!outOfStock && <span className="sr-only"> en stock</span>}
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center" role="status">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--mv-panel)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[color:var(--mv-hairline-strong)]">
              <PackageX size={26} strokeWidth={1.5} aria-hidden />
            </span>
            {hasCatalog ? (
              <>
                <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">
                  {term ? <>Nada coincide con <span className="mv-data">“{search.trim()}”</span></> : 'No hay productos en esta categoría'}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">Probá con otro nombre o escaneá el código de barras.</p>
                {filtering && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setSelectedCategory(null); searchRef.current?.focus(); }}
                    className={buttonClass('secondary', 'sm', 'mt-5')}
                  >
                    Ver todos los productos
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">Todavía no hay productos a la venta</p>
                <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">Cargá tu catálogo en el inventario y vas a poder venderlo desde acá.</p>
                <Link href="/dashboard/pos/inventory" className={buttonClass('primary', 'sm', 'mt-5')}>
                  Cargar productos
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {scanning && <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />}
    </div>
  );
}
// creado por pato dev y askforvini
