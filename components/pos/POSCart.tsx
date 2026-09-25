"use client";

import { useState, useMemo } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, Receipt, Tag, Truck, UserCheck, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DELIVERY_CHANNELS, ORDER_TYPES } from '@/lib/data/pos-data';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (data: any) => void;
  currency: string;
}

export default function POSCart({ items, onUpdateQuantity, onRemove, onCheckout, currency }: POSCartProps) {
  const [discountType, setDiscountType] = useState<'NONE' | 'PERCENTAGE' | 'FIXED'>('NONE');
  const [discountValue, setDiscountValue] = useState(0);
  const [orderType, setOrderType] = useState('TOGO');
  const [deliveryChannel, setDeliveryChannel] = useState('');

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0), [items]);
  
  const discountAmount = useMemo(() => {
    if (discountType === 'PERCENTAGE') return (subtotal * discountValue) / 100;
    if (discountType === 'FIXED') return discountValue;
    return 0;
  }, [subtotal, discountType, discountValue]);

  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    onCheckout({
      items: items.map(i => ({ ...i, subtotal: Number(i.price) * i.quantity })),
      totalAmount: total,
      discountAmount,
      discountType,
      orderType,
      deliveryChannel
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
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{items.length} productos</p>
          </div>
        </div>
        <button 
          onClick={() => items.forEach(i => onRemove(i.id))}
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
            {items.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                key={item.id}
                className="bg-bg-secondary/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group"
              >
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm">{item.name}</h4>
                  <p className="text-gold font-mono font-bold text-xs">{currency} {Number(item.price).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
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
          {/* Order Type */}
          <div className="grid grid-cols-3 gap-2">
            {ORDER_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${orderType === type.id ? 'bg-gold border-gold text-primary-foreground shadow-lg shadow-gold/20' : 'bg-black/40 border-white/5 text-gray-500 hover:border-gold/30'}`}
              >
                <span className="text-lg mb-1">{type.id === 'TABLE' ? <UtensilsCrossed size={16}/> : type.id === 'TOGO' ? <ShoppingBag size={16}/> : <UserCheck size={16}/>}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter text-center">{type.name}</span>
              </button>
            ))}
          </div>

          {/* Delivery Channel (conditional) */}
          {orderType === 'TOGO' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <Truck size={12} /> Canal de Delivery
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  onClick={() => setDeliveryChannel('')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-[8px] font-black uppercase tracking-widest transition-all ${!deliveryChannel ? 'bg-foreground text-background' : 'bg-black/40 text-gray-500 border border-white/5'}`}
                >
                  Ninguno
                </button>
                {DELIVERY_CHANNELS.map(ch => (
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
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <Tag size={12} /> Descuento Aplicado
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setDiscountType('NONE'); setDiscountValue(0); }}
                className={`flex-1 h-10 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${discountType === 'NONE' ? 'bg-foreground text-background border-foreground' : 'bg-black/40 border-white/5 text-gray-500'}`}
              >
                Sin desc.
              </button>
              <button
                onClick={() => setDiscountType('PERCENTAGE')}
                className={`flex-1 h-10 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${discountType === 'PERCENTAGE' ? 'bg-foreground text-background border-foreground' : 'bg-black/40 border-white/5 text-gray-500'}`}
              >
                Porcentaje %
              </button>
              <button
                onClick={() => setDiscountType('FIXED')}
                className={`flex-1 h-10 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${discountType === 'FIXED' ? 'bg-foreground text-background border-foreground' : 'bg-black/40 border-white/5 text-gray-500'}`}
              >
                Monto Fijo
              </button>
            </div>
            {discountType !== 'NONE' && (
              <div className="relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
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
              <span className="text-white font-mono font-bold">{currency} {subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500 uppercase font-black tracking-widest text-[10px]">Descuento</span>
                <span className="text-red-500 font-mono font-bold">- {currency} {discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Total & Button) */}
      <div className="p-6 lg:pb-6 bg-bg-secondary border-t border-white/5 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] sticky bottom-0 lg:static z-20 backdrop-blur-xl">
        <div className="flex justify-between items-end">
          <span className="text-white uppercase font-black tracking-[0.2em] text-xs pb-1">Total a Pagar</span>
          <span className="text-gold font-mono font-bold text-4xl lg:text-3xl leading-none">{currency} {total.toFixed(2)}</span>
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
// creado por Patodev y Invertilo
