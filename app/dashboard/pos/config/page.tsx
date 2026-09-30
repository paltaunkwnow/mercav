"use client";

import { useState, useEffect } from 'react';
import POSHeader from '@/components/pos/POSHeader';
import CurrencySelector from '@/components/pos/CurrencySelector';
import LocationSelector from '@/components/pos/LocationSelector';
import { Save, Loader2, Store, Image as ImageIcon, Settings, UtensilsCrossed, Shirt, ShoppingBasket, Pill, Hammer, Scissors, Check } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { BUSINESS_TYPES, PAYMENT_METHODS, type BusinessTypeId } from '@/lib/pos/business';
import { countryFiscal } from '@/lib/pos/fiscal';

const BUSINESS_ICONS: Record<BusinessTypeId, typeof Store> = {
  GENERAL: Store,
  GASTRONOMY: UtensilsCrossed,
  RETAIL: Shirt,
  GROCERY: ShoppingBasket,
  PHARMACY: Pill,
  HARDWARE: Hammer,
  SERVICES: Scissors,
};

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-gold text-black flex items-center justify-center text-sm">{n}</span>
      {children}
    </h2>
  );
}

export default function POSConfigPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    shopName: '',
    logoUrl: '',
    currency: 'USD',
    country: '',
    department: '',
    city: '',
    address: '',
    businessType: 'GENERAL',
    taxName: 'IVA',
    taxRate: '0' as string | number,
    pricesIncludeTax: true,
    paymentMethods: ['CASH', 'CARD', 'TRANSFER', 'QR'] as string[]
  });
  const fiscal = countryFiscal(config.country);
  const suggestionApplies = fiscal.taxRate !== null && (Number(config.taxRate) !== fiscal.taxRate || config.taxName !== fiscal.taxName);

  const togglePaymentMethod = (id: string) => {
    const has = config.paymentMethods.includes(id);
    if (has && config.paymentMethods.length === 1) return;
    setConfig({
      ...config,
      paymentMethods: has ? config.paymentMethods.filter((m) => m !== id) : [...config.paymentMethods, id]
    });
  };
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ visible: true, message: 'El archivo excede los 5MB', type: 'error' });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setToast({ visible: true, message: 'Solo JPG o PNG', type: 'error' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/pos/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setConfig({ ...config, logoUrl: data.url });
        setToast({ visible: true, message: 'Logo subido con éxito', type: 'success' });
      } else {
        setToast({ visible: true, message: data.error || 'Error al subir', type: 'error' });
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetch('/api/pos/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setConfig((prev) => ({ ...prev, ...data.data, paymentMethods: data.data.paymentMethods?.length ? data.data.paymentMethods : prev.paymentMethods }));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pos/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: 'Configuración guardada con éxito', type: 'success' });
      } else {
        setToast({ visible: true, message: data.error || 'Error al guardar', type: 'error' });
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <POSHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-4">
            <Settings className="w-3 h-3" /> Herramientas POS
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Configuración del Local</h1>
          <p className="text-gray-400">Personaliza la identidad visual y ubicación de tu punto de venta.</p>
        </header>

        <div className="space-y-8">
          <section className="bg-bg-secondary border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <SectionTitle n={1}>Tipo de negocio</SectionTitle>
            <p className="text-sm text-gray-400 -mt-4 mb-8">Define los tipos de pedido, las categorías sugeridas y si vendés por peso o servicios.</p>
            <div role="radiogroup" aria-label="Tipo de negocio" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BUSINESS_TYPES.map((b) => {
                const Icon = BUSINESS_ICONS[b.id];
                const active = config.businessType === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setConfig({ ...config, businessType: b.id })}
                    className={`relative text-left p-5 rounded-2xl border transition-all ${active ? 'bg-gold/10 border-gold/60' : 'bg-bg-primary border-white/5 hover:border-white/20'}`}
                  >
                    <Icon size={20} className={active ? 'text-gold' : 'text-gray-500'} />
                    <p className={`mt-3 font-bold ${active ? 'text-gold' : 'text-white'}`}>{b.name}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{b.description}</p>
                    {active && <Check size={16} className="absolute top-4 right-4 text-gold" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* General Info */}
          <section className="bg-bg-secondary border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative">
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Store size={150} className="text-gold" />
              </div>
            </div>
            
            <SectionTitle n={2}>Identidad del Negocio</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Nombre del Local</label>
                <input
                  type="text"
                  value={config.shopName}
                  onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                  placeholder="Ej: Mercav Coffee Shop"
                  className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-gold/30 transition-all font-bold"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Logo del Local (JPG/PNG, máx 5MB)</label>
                <div className="flex gap-4">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={config.logoUrl}
                      onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                      placeholder="URL o sube un archivo"
                      className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl pl-12 pr-5 text-white outline-none focus:border-gold/30 transition-all text-xs"
                    />
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    
                    <label className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all border border-white/5 text-[8px] font-black uppercase tracking-widest">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : 'Subir'}
                      <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                  {config.logoUrl && (
                    <div className="w-14 h-14 rounded-2xl bg-white border border-white/10 overflow-hidden flex-shrink-0 shadow-lg">
                      <img src={config.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <CurrencySelector 
                  label="Moneda Principal de Trabajo"
                  value={config.currency}
                  onChange={(val) => setConfig({ ...config, currency: val })}
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="bg-bg-secondary border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <SectionTitle n={3}>Ubicación Geográfica</SectionTitle>
            <LocationSelector 
              country={config.country}
              department={config.department}
              city={config.city}
              address={config.address}
              onChange={(data) => setConfig({ ...config, ...data })}
            />
          </section>

          <section className="bg-bg-secondary border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <SectionTitle n={4}>Impuestos y cobros</SectionTitle>

            {suggestionApplies && (
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gold/20 bg-gold/5">
                <p className="text-sm text-gray-300">
                  La tasa general en {config.country} es {fiscal.taxName} {fiscal.taxRate}%. Revisala con tu contador si tenés un régimen especial.
                </p>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, taxName: fiscal.taxName, taxRate: fiscal.taxRate ?? 0 })}
                  className="h-10 px-4 rounded-xl bg-gold text-black text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                >
                  Usar {fiscal.taxRate}%
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <label htmlFor="taxName" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Nombre del impuesto</label>
                <input
                  id="taxName"
                  type="text"
                  value={config.taxName}
                  onChange={(e) => setConfig({ ...config, taxName: e.target.value })}
                  placeholder="IVA"
                  className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-gold/30 transition-all font-bold"
                />
              </div>
              <div className="space-y-4">
                <label htmlFor="taxRate" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Tasa general (%)</label>
                <input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={config.taxRate}
                  onChange={(e) => setConfig({ ...config, taxRate: e.target.value })}
                  className="w-full h-14 bg-bg-primary border border-white/5 rounded-2xl px-5 text-white outline-none focus:border-gold/30 transition-all font-mono"
                />
              </div>
              <div className="space-y-4">
                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Precios de venta</span>
                <div className="grid grid-cols-2 gap-2 h-14">
                  {[{ v: true, l: 'Incluyen impuesto' }, { v: false, l: 'Más impuesto' }].map((o) => (
                    <button
                      key={o.l}
                      type="button"
                      aria-pressed={config.pricesIncludeTax === o.v}
                      onClick={() => setConfig({ ...config, pricesIncludeTax: o.v })}
                      className={`rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${config.pricesIncludeTax === o.v ? 'bg-gold/10 border-gold/60 text-gold' : 'bg-bg-primary border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              {config.pricesIncludeTax
                ? 'El precio que cargás es el precio final. El ticket muestra cuánto impuesto contiene.'
                : 'El impuesto se suma al precio en el cobro. Es lo habitual en ventas entre empresas.'}
              {' '}Cada producto puede tener su propia tasa en el inventario.
            </p>

            <div className="mt-10 space-y-4">
              <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Medios de pago aceptados</span>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const active = config.paymentMethods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => togglePaymentMethod(m.id)}
                      className={`h-12 px-5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all ${active ? 'bg-gold/10 border-gold/60 text-gold' : 'bg-bg-primary border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                      {active && <Check size={14} />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">Se pueden combinar en una misma venta. Solo el efectivo entrega cambio y entra en el arqueo.</p>
            </div>
          </section>

          {/* Action */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-16 px-12 bg-gold hover:bg-gold-light text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-2xl shadow-gold/20 flex items-center gap-3 transition-all group disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </main>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}
// creado por pato dev y askforvini
