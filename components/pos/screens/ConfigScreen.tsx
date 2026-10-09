"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import POSHeader from '@/components/pos/POSHeader';
import CurrencySelector from '@/components/pos/CurrencySelector';
import LocationSelector from '@/components/pos/LocationSelector';
import { Save, Loader2, Store, Image as ImageIcon, UtensilsCrossed, Shirt, ShoppingBasket, Pill, Hammer, Scissors, Check } from '@/components/icons';
import { Toast } from '@/components/ui/toast';
import { BUSINESS_TYPES, PAYMENT_METHODS, type BusinessTypeId } from '@/lib/pos/business';
import { countryFiscal } from '@/lib/pos/fiscal';
import StaffManager from '@/components/pos/StaffManager';
import { useManagerPin } from '@/components/pos/useManagerPin';
import { posFetch, usePos } from '@/lib/pos/client';

const BUSINESS_ICONS: Record<BusinessTypeId, typeof Store> = {
  GENERAL: Store,
  GASTRONOMY: UtensilsCrossed,
  RETAIL: Shirt,
  GROCERY: ShoppingBasket,
  PHARMACY: Pill,
  HARDWARE: Hammer,
  SERVICES: Scissors,
};

function SectionTitle({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mv-h3 flex items-center gap-3">
      <span className="mv-data grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--mv-gold-wash)] text-sm font-semibold text-gold ring-1 ring-inset ring-[color:var(--color-border-gold)]" aria-hidden>{n}</span>
      {children}
    </h2>
  );
}

const fieldLabel = 'block text-sm font-semibold text-[var(--text-secondary)]';
const sectionClass = 'mv-panel p-5 sm:p-8';

/** Valores iniciales para la caja nueva de una empresa (nombre, moneda y ubicación de Mercav Business). */
export type PosConfigDefaults = Partial<{ shopName: string; currency: string; country: string; department: string; city: string }>;

export default function POSConfigPage({ defaults }: { defaults?: PosConfigDefaults }) {
  const pos = usePos();
  const router = useRouter();
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
    paymentMethods: ['CASH', 'CARD', 'TRANSFER', 'QR'] as string[],
    kosherPlaceId: null as string | null,
    ...defaults
  });
  const { pinFetch, pinDialog } = useManagerPin();
  const [kosherPlaces, setKosherPlaces] = useState<{ id: string; name: string; city: string }[] | null>(null);
  const hasConfig = Boolean((config as { id?: string }).id);
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
      const res = await posFetch('/api/pos/upload', {
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
    posFetch('/api/pos/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setConfig((prev) => ({ ...prev, ...data.data, paymentMethods: data.data.paymentMethods?.length ? data.data.paymentMethods : prev.paymentMethods }));
        }
        setLoading(false);
        if (data.success && data.data) {
          posFetch('/api/pos/kosher')
            .then((r) => r.json())
            .then((k) => setKosherPlaces(k?.success ? k.data.places : []))
            .catch(() => setKosherPlaces([]));
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await pinFetch('/api/pos/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, kosherPlaceId: config.kosherPlaceId || null })
      });
      const data = await res.json();
      if (data.success) {
        // Alta de la caja de una empresa: después de guardar, directo a vender.
        if (!hasConfig && pos.slug) {
          router.replace(pos.href());
          router.refresh();
          return;
        }
        setConfig((prev) => ({ ...prev, ...data.data }));
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
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-3" role="status">
        <Loader2 className="w-8 h-8 text-gold animate-spin" aria-hidden />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Cargando la configuración…</p>
      </div>
    );
  }

  const segBtn = (active: boolean) =>
    `mv-focus inline-flex items-center justify-center gap-2 rounded-[0.875rem] border text-sm font-semibold transition-colors duration-150 ${
      active
        ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold'
        : 'border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="min-h-screen bg-bg-primary text-[var(--text-primary)]">
      <POSHeader />
      
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] sm:px-6 md:pt-12">
        <header className="mb-8 space-y-3">
          <p className="mv-kicker">Configuración de la caja</p>
          <h1 className="mv-h2">Tu negocio en el POS</h1>
          <p className="mv-body max-w-xl">Rubro, identidad, ubicación, impuestos y medios de pago. Todo esto aparece en la caja y en el ticket.</p>
        </header>

        <div className="space-y-4">
          <section aria-labelledby="cfg-business" className={sectionClass}>
            <SectionTitle n={1} id="cfg-business">Tipo de negocio</SectionTitle>
            <p className="mt-2 mb-5 text-sm text-[var(--text-secondary)]">Define los tipos de venta, las categorías sugeridas y si vendés por peso o servicios.</p>
            <div role="radiogroup" aria-labelledby="cfg-business" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                    className={`mv-focus relative rounded-2xl border p-4 text-left transition-colors duration-150 ${active ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]' : 'border-[var(--mv-hairline-strong)] hover:border-[var(--color-border-gold)]'}`}
                  >
                    <Icon size={20} className={active ? 'text-gold' : 'text-[var(--text-secondary)]'} aria-hidden />
                    <p className={`mt-2.5 text-sm font-semibold ${active ? 'text-gold' : 'text-[var(--text-primary)]'}`}>{b.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{b.description}</p>
                    {active && <Check size={16} className="absolute right-4 top-4 text-gold" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="cfg-identity" className={sectionClass}>
            <SectionTitle n={2} id="cfg-identity">Identidad del negocio</SectionTitle>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="shopName" className={fieldLabel}>Nombre del negocio</label>
                <input
                  id="shopName"
                  type="text"
                  value={config.shopName}
                  onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                  placeholder="Como querés que salga en el ticket"
                  autoComplete="organization"
                  className="mv-input font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="logoUrl" className={fieldLabel}>Logo <span className="font-normal text-[var(--text-tertiary)]">JPG o PNG, hasta 5 MB</span></label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <ImageIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} aria-hidden />
                    <input
                      id="logoUrl"
                      type="url"
                      inputMode="url"
                      value={config.logoUrl}
                      onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                      placeholder="Pegá una URL o subí un archivo"
                      className="mv-input pl-11 pr-24 text-sm"
                    />
                    <label className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[0.625rem] border border-[var(--mv-hairline-strong)] px-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--color-border-gold)] focus-within:ring-2 focus-within:ring-[color:var(--color-gold)]">
                      {uploading ? <Loader2 size={14} className="animate-spin" aria-label="Subiendo logo" /> : 'Subir'}
                      <input type="file" className="sr-only" accept="image/jpeg,image/png" onChange={handleFileUpload} disabled={uploading} aria-label="Subir logo desde un archivo" />
                    </label>
                  </div>
                  {config.logoUrl && (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[0.875rem] border border-[var(--mv-hairline-strong)] bg-[#fff]">
                      <img src={config.logoUrl} alt="Vista previa del logo" className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <CurrencySelector 
                  label="Moneda con la que cobrás"
                  value={config.currency}
                  onChange={(val) => setConfig({ ...config, currency: val })}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="cfg-location" className={sectionClass}>
            <SectionTitle n={3} id="cfg-location">Ubicación</SectionTitle>
            <p className="mt-2 mb-5 text-sm text-[var(--text-secondary)]">Sale en el ticket y define la sugerencia de impuestos de tu país.</p>
            <LocationSelector 
              country={config.country}
              department={config.department}
              city={config.city}
              address={config.address}
              onChange={(data) => setConfig({ ...config, ...data })}
            />
          </section>

          <section aria-labelledby="cfg-tax" className={sectionClass}>
            <SectionTitle n={4} id="cfg-tax">Impuestos y cobros</SectionTitle>

            {suggestionApplies && (
              <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-[var(--text-primary)]">
                  La tasa general en {config.country} es {fiscal.taxName} <span className="mv-data">{fiscal.taxRate}%</span>. Revisala con tu contador si tenés un régimen especial.
                </p>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, taxName: fiscal.taxName, taxRate: fiscal.taxRate ?? 0 })}
                  className="mv-btn mv-btn-secondary mv-btn-sm shrink-0"
                >
                  Usar <span className="mv-data">{fiscal.taxRate}%</span>
                </button>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="taxName" className={fieldLabel}>Nombre del impuesto</label>
                <input
                  id="taxName"
                  type="text"
                  value={config.taxName}
                  onChange={(e) => setConfig({ ...config, taxName: e.target.value })}
                  placeholder="IVA"
                  className="mv-input font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="taxRate" className={fieldLabel}>Tasa general (%)</label>
                <input
                  id="taxRate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={config.taxRate}
                  onChange={(e) => setConfig({ ...config, taxRate: e.target.value })}
                  className="mv-input mv-data"
                />
              </div>
              <fieldset className="space-y-2">
                <legend className={`${fieldLabel} mb-2`}>Precios de venta</legend>
                <div className="grid h-12 grid-cols-2 gap-2">
                  {[{ v: true, l: 'Con impuesto' }, { v: false, l: 'Más impuesto' }].map((o) => (
                    <button
                      key={o.l}
                      type="button"
                      aria-pressed={config.pricesIncludeTax === o.v}
                      onClick={() => setConfig({ ...config, pricesIncludeTax: o.v })}
                      className={segBtn(config.pricesIncludeTax === o.v)}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {config.pricesIncludeTax
                ? 'El precio que cargás es el precio final. El ticket muestra cuánto impuesto contiene.'
                : 'El impuesto se suma al precio en el cobro. Es lo habitual en ventas entre empresas.'}
              {' '}Cada producto puede tener su propia tasa en el inventario.
            </p>

            <fieldset className="mt-8 space-y-3">
              <legend className={`${fieldLabel} mb-3`}>Medios de pago aceptados</legend>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const active = config.paymentMethods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => togglePaymentMethod(m.id)}
                      className={`${segBtn(active)} h-11 rounded-full px-4`}
                    >
                      {active && <Check size={14} aria-hidden />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Se pueden combinar en una misma venta. Solo el efectivo entrega cambio y entra en el arqueo. Tiene que quedar al menos uno activo.</p>
            </fieldset>
          </section>

          <section aria-labelledby="cfg-staff" className={sectionClass}>
            <SectionTitle n={5} id="cfg-staff">Personal y PIN</SectionTitle>
            <p className="mt-2 mb-5 text-sm text-[var(--text-secondary)]">Cada persona abre la caja con su PIN y queda registrada en las ventas de su turno.</p>
            {hasConfig ? (
              <StaffManager pinFetch={pinFetch} onMessage={(message, type) => setToast({ visible: true, message, type })} />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Guardá la configuración una vez para poder agregar personal.</p>
            )}
          </section>

          <section aria-labelledby="cfg-kosher" className={sectionClass}>
            <SectionTitle n={6} id="cfg-kosher">Mercav Kosher</SectionTitle>
            <p className="mt-2 mb-5 text-sm text-[var(--text-secondary)]">
              Vinculá tu local para publicar desde el inventario qué productos tenés disponibles. Es un aviso de disponibilidad: Mercav no emite hechsher ni certifica productos.
            </p>
            {kosherPlaces === null ? (
              <p className="text-sm text-[var(--text-secondary)]">{hasConfig ? 'Buscando tus lugares…' : 'Guardá la configuración una vez para vincular un lugar.'}</p>
            ) : kosherPlaces.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No administrás ningún lugar en Mercav Kosher. Si tu local figura ahí, pedí administrarlo desde su ficha en{' '}
                <a href="/kosher" className="mv-link">Mercav Kosher</a>.
              </p>
            ) : (
              <div className="space-y-2">
                <label htmlFor="kosherPlaceId" className={fieldLabel}>Lugar vinculado</label>
                <select
                  id="kosherPlaceId"
                  value={config.kosherPlaceId ?? ''}
                  onChange={(e) => setConfig({ ...config, kosherPlaceId: e.target.value || null })}
                  className="mv-input"
                >
                  <option value="">Sin vincular</option>
                  {kosherPlaces.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}{pl.city ? ` · ${pl.city}` : ''}</option>)}
                </select>
                <p className="text-xs text-[var(--text-secondary)]">Solo aparecen los lugares que administrás. El cambio se aplica al guardar.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {pinDialog}

      {/* Save bar */}
      <div className="liquid-glass fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6">
          <p className="hidden text-sm text-[var(--text-secondary)] sm:block">Los cambios se aplican en la caja al guardar.</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mv-btn mv-btn-primary w-full sm:w-auto"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Save className="w-5 h-5" aria-hidden />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

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
