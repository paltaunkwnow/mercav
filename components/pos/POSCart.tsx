"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, Receipt, Tag, Truck, UserCheck, UtensilsCrossed, ShoppingBag, Store, Home, Bike } from '@/components/icons';
import { ORDER_TYPE_LABELS, ORDER_TYPES_WITH_CHANNEL, getUnit, type BusinessType, type OrderTypeId } from '@/lib/pos/business';
import { computeSale, type DiscountType } from '@/lib/pos/pricing';
import { currencyDecimals, formatMoney } from '@/lib/pos/money';

export interface CartItem {
  id: string;
  name: string;
  price: number | string;
  quantity: number;
  unit?: string;
  taxRate?: number | string | null;
}

export interface CheckoutData {
  items: { id: string; quantity: number }[];
  totalAmount: number;
  discountType: DiscountType;
  discountValue: number;
  orderType: OrderTypeId;
  deliveryChannel: string | null;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: (data: CheckoutData) => void;
  currency: string;
  business: BusinessType;
  taxName: string;
  taxRate: number;
  pricesIncludeTax: boolean;
}

const ORDER_ICONS: Record<OrderTypeId, typeof Store> = {
  COUNTER: Store,
  TABLE: UtensilsCrossed,
  TOGO: ShoppingBag,
  DELIVERY: Bike,
  EMPLOYEE: UserCheck,
  IN_STORE: Store,
  AT_HOME: Home,
};

export default function POSCart({ items, onUpdateQuantity, onSetQuantity, onRemove, onClear, onCheckout, currency, business, taxName, taxRate, pricesIncludeTax }: POSCartProps) {
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState(0);
  const [orderType, setOrderType] = useState<OrderTypeId>(business.orderTypes[0]);
  const [deliveryChannel, setDeliveryChannel] = useState('');

  const pricing = useMemo(() => computeSale({
    lines: items.map((i) => ({
      productId: i.id,
      quantity: i.quantity,
      unitPrice: Number(i.price),
      taxRate: i.taxRate === null || i.taxRate === undefined ? taxRate : Number(i.taxRate),
    })),
    discountType,
    discountValue,
    pricesIncludeTax,
    decimals: currencyDecimals(currency),
  }), [items, discountType, discountValue, pricesIncludeTax, taxRate, currency]);

  const showChannels = ORDER_TYPES_WITH_CHANNEL.includes(orderType) && business.channels.length > 0;

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    onCheckout({
      items: items.map(i => ({ id: i.id, quantity: i.quantity })),
      totalAmount: pricing.total,
      discountType,
      discountValue,
      orderType,
      deliveryChannel: showChannels ? deliveryChannel || null : null
    });
  };

  // F9 or Ctrl/Cmd+Enter opens checkout. F9 works while typing; Ctrl+Enter doesn't.
  const checkoutRef = useRef(handleCheckoutClick);
  checkoutRef.current = handleCheckoutClick;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const f9 = e.key === 'F9';
      const ctrlEnter = e.key === 'Enter' && (e.ctrlKey || e.metaKey);
      if (!f9 && !ctrlEnter) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const t = e.target as HTMLElement | null;
      if (ctrlEnter && t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      e.preventDefault();
      checkoutRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const lineTotal = (id: string) => pricing.lines.find((l) => l.productId === id)?.gross;
  const segClass = (active: boolean) =>
    `mv-focus rounded-xl border text-sm font-semibold transition-colors duration-150 ${
      active
        ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold'
        : 'border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;
  const fieldLabel = 'flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]';

  return (
    <section aria-labelledby="pos-cart-title" className="flex flex-col h-full lg:min-h-full bg-[var(--color-bg-secondary)] lg:border-l border-[var(--mv-hairline)]">
      {/* Cart header */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--mv-hairline)] bg-[var(--color-bg-secondary)] px-4 py-3 lg:static lg:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
            <ShoppingCart size={18} aria-hidden />
          </span>
          <div>
            <h2 id="pos-cart-title" className="text-base font-semibold text-[var(--text-primary)]">Carrito</h2>
            <p className="mv-data text-xs text-[var(--text-secondary)]" aria-live="polite">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={items.length === 0}
          aria-label="Vaciar carrito"
          className="mv-focus inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-150 hover:text-red-400 disabled:opacity-40 disabled:hover:text-[var(--text-secondary)]"
        >
          <Trash2 size={16} aria-hidden />
          <span>Vaciar</span>
        </button>
      </div>

      {/* Main content */}
      <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar">
        {/* Cart items */}
        {items.length > 0 ? (
          <ul className="divide-y divide-[var(--mv-hairline)] px-4 lg:px-5" aria-label="Productos en el carrito">
            {items.map((item) => {
              const unit = getUnit(item.unit);
              const gross = lineTotal(item.id);
              return (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                    <p className="mv-data mt-0.5 text-xs text-[var(--text-secondary)]">
                      {formatMoney(item.price, currency)}{unit.id !== 'UNIT' && ` / ${unit.short}`}
                      {gross !== undefined && <span className="text-[var(--text-primary)]"> · {formatMoney(gross, currency)}</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {unit.id === 'UNIT' ? (
                      <div className="flex items-center rounded-xl border border-[var(--mv-hairline-strong)]">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label={`Quitar una unidad de ${item.name}`}
                          className="mv-focus grid h-11 w-11 place-items-center rounded-l-xl text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] active:bg-[var(--mv-panel-hover)]"
                        >
                          <Minus size={16} aria-hidden />
                        </button>
                        <span className="mv-data w-8 text-center text-sm font-semibold text-[var(--text-primary)]" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label={`Agregar una unidad de ${item.name}`}
                          className="mv-focus grid h-11 w-11 place-items-center rounded-r-xl text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] active:bg-[var(--mv-panel-hover)]"
                        >
                          <Plus size={16} aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-11 items-center rounded-xl border border-[var(--mv-hairline-strong)] pr-3 focus-within:border-[var(--color-border-gold)]">
                        <span className="sr-only">Cantidad de {item.name}, unidad: {unit.name.toLowerCase()}</span>
                        <input
                          key={item.quantity}
                          type="number"
                          inputMode="decimal"
                          min={unit.step}
                          step={unit.step}
                          defaultValue={item.quantity}
                          onBlur={(e) => {
                            const q = Number(e.target.value);
                            if (q > 0) onSetQuantity(item.id, q);
                            else e.target.value = String(item.quantity);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className="mv-data h-full w-20 bg-transparent px-2 text-right text-sm font-semibold text-[var(--text-primary)] outline-none"
                        />
                        <span className="text-xs text-[var(--text-secondary)]">{unit.short}</span>
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Quitar ${item.name}`}
                      className="mv-focus grid h-11 w-11 place-items-center rounded-xl text-[var(--text-tertiary)] transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-6 py-12 text-center lg:py-16">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--mv-panel)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[color:var(--mv-hairline-strong)]">
              <ShoppingCart size={22} strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">El carrito está vacío</p>
            <p className="mt-1 max-w-[16rem] text-sm text-[var(--text-secondary)]">Tocá un producto o escaneá un código para empezar la venta.</p>
          </div>
        )}

        {/* Cart options */}
        <div className="space-y-5 border-t border-[var(--mv-hairline)] px-4 py-5 lg:px-5">
          {business.orderTypes.length > 1 && (
            <fieldset className="space-y-2">
              <legend className={`${fieldLabel} mb-2`}>Tipo de venta</legend>
              <div className={`grid gap-2 ${business.orderTypes.length >= 4 ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4' : business.orderTypes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {business.orderTypes.map(type => {
                  const Icon = ORDER_ICONS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={orderType === type}
                      onClick={() => setOrderType(type)}
                      className={`${segClass(orderType === type)} flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs`}
                    >
                      <Icon size={16} aria-hidden />
                      <span className="text-center leading-tight">{ORDER_TYPE_LABELS[type]}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {showChannels && (
            <fieldset className="space-y-2">
              <legend className={`${fieldLabel} mb-2`}>
                <Truck size={14} aria-hidden /> Canal
              </legend>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto">
                <button
                  type="button"
                  aria-pressed={!deliveryChannel}
                  onClick={() => setDeliveryChannel('')}
                  className={`${segClass(!deliveryChannel)} h-11 shrink-0 whitespace-nowrap rounded-full px-4`}
                >
                  Ninguno
                </button>
                {business.channels.map(ch => (
                  <button
                    key={ch}
                    type="button"
                    aria-pressed={deliveryChannel === ch}
                    onClick={() => setDeliveryChannel(ch)}
                    className={`${segClass(deliveryChannel === ch)} h-11 shrink-0 whitespace-nowrap rounded-full px-4`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Discounts */}
          <fieldset className="space-y-2">
            <legend className={`${fieldLabel} mb-2`}>
              <Tag size={14} aria-hidden /> Descuento
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {([['NONE', 'Sin descuento'], ['PERCENTAGE', 'Porcentaje'], ['FIXED', 'Monto fijo']] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={discountType === id}
                  onClick={() => { setDiscountType(id); if (id === 'NONE') setDiscountValue(0); }}
                  className={`${segClass(discountType === id)} h-11 px-2 text-xs sm:text-sm`}
                >
                  {label}
                </button>
              ))}
            </div>
            {discountType !== 'NONE' && (
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  aria-label={discountType === 'PERCENTAGE' ? 'Porcentaje de descuento' : `Monto de descuento en ${currency}`}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                  placeholder={discountType === 'PERCENTAGE' ? "Ej: 10" : "Ej: 5.00"}
                  className="mv-input mv-data pr-16"
                />
                <span className="mv-data pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]">
                  {discountType === 'PERCENTAGE' ? '%' : currency}
                </span>
              </div>
            )}
          </fieldset>

          {/* Subtotals */}
          <dl className="space-y-2 border-t border-[var(--mv-hairline)] pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-secondary)]">Subtotal</dt>
              <dd className="mv-data text-[var(--text-primary)]">{formatMoney(pricing.subtotal, currency)}</dd>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-red-400">Descuento</dt>
                <dd className="mv-data text-red-400">- {formatMoney(pricing.discount, currency)}</dd>
              </div>
            )}
            {pricing.tax > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-secondary)]">
                  {pricesIncludeTax ? `${taxName} incluido` : taxName}
                </dt>
                <dd className="mv-data text-[var(--text-secondary)]">
                  {pricesIncludeTax ? '' : '+ '}{formatMoney(pricing.tax, currency)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Total bar */}
      <div className="liquid-glass sticky bottom-0 z-20 space-y-3 rounded-none border-x-0 border-b-0 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:static lg:px-5 lg:pb-5">
        <div className="flex items-baseline justify-between gap-4" aria-live="polite" aria-atomic="true">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">Total</span>
          <span className="mv-data text-3xl font-semibold leading-none tracking-tight text-[var(--text-primary)]">{formatMoney(pricing.total, currency)}</span>
        </div>

        <button
          type="button"
          onClick={handleCheckoutClick}
          disabled={items.length === 0}
          aria-keyshortcuts="F9 Control+Enter"
          className="mv-btn mv-btn-primary mv-btn-lg w-full"
        >
          <Receipt size={20} aria-hidden />
          {items.length === 0 ? 'Agregá productos para cobrar' : 'Cobrar'}
        </button>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
