"use client";

import { useState, useEffect } from 'react';
import POSHeader from '@/components/pos/POSHeader';
import CurrencySelector from '@/components/pos/CurrencySelector';
import LocationSelector from '@/components/pos/LocationSelector';
import { Save, Loader2, Store, Image as ImageIcon, CheckCircle2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toast } from '@/components/ui/toast';

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
    address: ''
  });
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
          setConfig(data.data);
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
        setToast({ visible: true, message: 'Error al guardar', type: 'error' });
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
          {/* General Info */}
          <section className="bg-bg-secondary border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative">
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Store size={150} className="text-gold" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gold text-black flex items-center justify-center text-sm">1</span>
              Identidad del Negocio
            </h2>

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
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gold text-black flex items-center justify-center text-sm">2</span>
              Ubicación Geográfica
            </h2>
            <LocationSelector 
              country={config.country}
              department={config.department}
              city={config.city}
              address={config.address}
              onChange={(data) => setConfig({ ...config, ...data })}
            />
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
