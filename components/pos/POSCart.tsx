"use client";

import { useState, useMemo } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, Receipt, Tag, Truck, UserCheck, UtensilsCrossed, ShoppingBag, Store, Home, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <div className="flex flex-col h-full lg:min-h-full bg-black/20 backdrop-blur-xl border-l border-white/5">
      {/* Cart Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 sticky top-0 lg:static z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold">Carrito</h3>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          aria-label="Vaciar carrito"
          className="text-gray-500 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar">
        {/* Cart Items */}
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const unit = getUnit(item.unit);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={item.id}
                  className="bg-bg-secondary/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-gold font-mono font-bold text-xs">
                      {formatMoney(item.price, currency)}{unit.id !== 'UNIT' && ` / ${unit.short}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {unit.id === 'UNIT' ? (
                      <div className="flex items-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label={`Quitar una unidad de ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label={`Agregar una unidad de ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center bg-black/40 rounded-xl border border-white/5 focus-within:border-gold/40 pr-3">
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
                          className="w-20 h-8 bg-transparent text-right text-white font-bold text-sm font-mono outline-none px-2"
                        />
                        <span className="text-xs text-gray-500">{unit.short}</span>
                      </label>
                    )}
                    <button
                      onClick={() => onRemove(item.id)}
                      aria-label={`Quitar ${item.name}`}
                      className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20 py-20">
              <ShoppingCart size={60} strokeWidth={1} />
              <p className="mt-4 font-black uppercase tracking-widest text-[10px]">El carrito está vacío</p>
            </div>
          )}
        </div>

        {/* Cart Options */}
        <div className="p-6 bg-white/5 border-t border-white/5 space-y-6">
          {business.orderTypes.length > 1 && (
            <div className={`grid gap-2 ${business.orderTypes.length >= 4 ? 'grid-cols-4' : business.orderTypes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {business.orderTypes.map(type => {
                const Icon = ORDER_ICONS[type];
                return (
                  <button
                    key={type}
                    aria-pressed={orderType === type}
                    onClick={() => setOrderType(type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${orderType === type ? 'bg-gold border-gold text-primary-foreground shadow-lg shadow-gold/20' : 'bg-black/40 border-white/5 text-gray-500 hover:border-gold/30'}`}
                  >
                    <Icon size={16} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-center">{ORDER_TYPE_LABELS[type]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {showChannels && (
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <Truck size={12} /> Canal
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  onClick={() => setDeliveryChannel('')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-[8px] font-black uppercase tracking-widest transition-all ${!deliveryChannel ? 'bg-foreground text-background' : 'bg-black/40 text-gray-500 border border-white/5'}`}
                >
                  Ninguno
                </button>
                {business.channels.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setDeliveryChannel(ch)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-[8px] font-black uppercase tracking-widest transition-all ${deliveryChannel === ch ? 'bg-foreground text-background' : 'bg-black/40 text-gray-500 border border-white/5 hover:border-white/20'}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discounts */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <Tag size={12} /> Descuento Aplicado
            </span>
            <div className="flex gap-2">
              {([['NONE', 'Sin desc.'], ['PERCENTAGE', 'Porcentaje %'], ['FIXED', 'Monto Fijo']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setDiscountType(id); if (id === 'NONE') setDiscountValue(0); }}
                  className={`flex-1 h-10 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${discountType === id ? 'bg-foreground text-background border-foreground' : 'bg-black/40 border-white/5 text-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {discountType !== 'NONE' && (
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  aria-label="Valor del descuento"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                  placeholder={discountType === 'PERCENTAGE' ? "Ej: 10 (%)" : "Ej: 5.00"}
                  className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-gold/30 transition-all font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">
                  {discountType === 'PERCENTAGE' ? '%' : currency}
                </span>
              </div>
            )}
          </div>

          {/* Subtotals */}
          <div className="space-y-2 pt-4 border-t border-white/10 pb-8 lg:pb-0">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Subtotal</span>
              <span className="text-white font-mono font-bold">{formatMoney(pricing.subtotal, currency)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500 uppercase font-black tracking-widest text-[10px]">Descuento</span>
                <span className="text-red-500 font-mono font-bold">- {formatMoney(pricing.discount, currency)}</span>
              </div>
            )}
            {pricing.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase font-black tracking-widest text-[10px]">
                  {pricesIncludeTax ? `${taxName} incluido` : taxName}
                </span>
                <span className="text-gray-300 font-mono font-bold">
                  {pricesIncludeTax ? '' : '+ '}{formatMoney(pricing.tax, currency)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Total & Button) */}
      <div className="p-6 lg:pb-6 bg-bg-secondary border-t border-white/5 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] sticky bottom-0 lg:static z-20 backdrop-blur-xl">
        <div className="flex justify-between items-end">
          <span className="text-white uppercase font-black tracking-[0.2em] text-xs pb-1">Total a Pagar</span>
          <span className="text-gold font-mono font-bold text-4xl lg:text-3xl leading-none">{formatMoney(pricing.total, currency)}</span>
        </div>

        <button
          onClick={handleCheckoutClick}
          disabled={items.length === 0}
          className="w-full h-16 bg-gold hover:bg-gold-light text-primary-foreground font-black uppercase tracking-[0.3em] text-sm rounded-2xl shadow-2xl shadow-gold/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
        >
          <Receipt size={20} className="group-hover:scale-110 transition-transform" />
          Procesar Venta
        </button>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
