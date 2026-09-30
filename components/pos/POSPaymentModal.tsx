"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, User, Plus, Trash2, Loader2 } from 'lucide-react';
import { PAYMENT_METHODS, paymentMethodLabel } from '@/lib/pos/business';
import { cashDenominations, currencyDecimals, formatMoney, roundMoney } from '@/lib/pos/money';
import { countryFiscal } from '@/lib/pos/fiscal';

export interface PaymentLine {
  method: string;
  amount: string;
  reference: string;
}

export interface PaymentConfirmation {
  payments: { method: string; amount: number; reference?: string }[];
  clientNit?: string;
  clientName?: string;
}

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PaymentConfirmation) => void;
  total: number;
  currency: string;
  methods: string[];
  country?: string | null;
  processing?: boolean;
}

export default function POSPaymentModal({ isOpen, onClose, onConfirm, total, currency, methods, country, processing }: POSPaymentModalProps) {
  const enabled = PAYMENT_METHODS.filter((m) => methods.includes(m.id)).map((m) => m.id);
  const available = enabled.length ? enabled : ['CASH'];
  const decimals = currencyDecimals(currency);
  const r = (n: number) => roundMoney(n, decimals);

  const [lines, setLines] = useState<PaymentLine[]>([]);
  const [clientNit, setClientNit] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const first = available[0];
      setLines([{ method: first, amount: first === 'CASH' ? '' : String(total), reference: '' }]);
    } else {
      setClientNit('');
      setClientName('');
      setIsNewClient(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const cleanNit = clientNit.trim();
    if (!cleanNit) {
      setClientName('');
      setIsNewClient(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/clients/${encodeURIComponent(cleanNit)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setClientName(json.data.name);
          setIsNewClient(false);
        } else {
          setIsNewClient(true);
        }
      } catch (err) {
        setIsNewClient(true);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [clientNit]);

  const amountOf = (l: PaymentLine) => Math.max(0, Number(l.amount) || 0);
  const paid = r(lines.reduce((s, l) => s + amountOf(l), 0));
  const nonCash = r(lines.filter((l) => l.method !== 'CASH').reduce((s, l) => s + amountOf(l), 0));
  const missing = r(Math.max(0, total - paid));
  const change = r(Math.max(0, paid - total));
  const nonCashTooHigh = nonCash > total;
  const canConfirm = paid >= total && !nonCashTooHigh && !processing;
  const cashIndex = lines.findIndex((l) => l.method === 'CASH');
  const fiscal = countryFiscal(country);

  const updateLine = (i: number, patch: Partial<PaymentLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const addLine = () => {
    const used = new Set(lines.map((l) => l.method));
    const method = available.find((m) => !used.has(m)) ?? available[0];
    setLines((prev) => [...prev, { method, amount: missing > 0 ? String(missing) : '', reference: '' }]);
  };

  const setCash = (value: number | 'exact') => {
    const others = r(lines.filter((_, i) => i !== cashIndex).reduce((s, l) => s + amountOf(l), 0));
    const amount = String(value === 'exact' ? r(Math.max(0, total - others)) : value);
    if (cashIndex === -1) setLines((prev) => [...prev, { method: 'CASH', amount, reference: '' }]);
    else updateLine(cashIndex, { amount });
  };

  const handleConfirmClick = async () => {
    if (!canConfirm) return;

    const cleanNit = clientNit.trim();
    const cleanName = clientName.trim();

    if (cleanNit && cleanName && isNewClient) {
      try {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nit: cleanNit, name: cleanName })
        });
      } catch (err) {
        console.error("Error registering client in background:", err);
      }
    }

    onConfirm({
      payments: lines
        .filter((l) => amountOf(l) > 0)
        .map((l) => ({ method: l.method, amount: r(amountOf(l)), reference: l.reference.trim() || undefined })),
      clientNit: cleanNit || undefined,
      clientName: cleanName || undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-bg-secondary border border-white/10 rounded-3xl lg:rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar"
          >
            <div className="p-6 lg:p-10 space-y-6">
              <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <Wallet className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <h2 id="payment-title" className="text-xl lg:text-2xl font-bold text-white">Procesar Pago</h2>
                    <p className="text-[10px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Uno o varios medios de pago</p>
                  </div>
                </div>
                <button onClick={onClose} aria-label="Cerrar" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </header>

              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                <div className="p-3 lg:p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-sm lg:text-xl font-mono font-black text-white">{formatMoney(total, currency)}</p>
                </div>
                <div className="p-3 lg:p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pagado</p>
                  <p className="text-sm lg:text-xl font-mono font-black text-white">{formatMoney(paid, currency)}</p>
                </div>
                <div className={`p-3 lg:p-4 rounded-2xl border text-center transition-all ${missing > 0 ? 'bg-white/5 border-white/5' : 'bg-green-500/10 border-green-500/20'}`}>
                  <p className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{missing > 0 ? 'Falta' : 'Cambio'}</p>
                  <p className={`text-sm lg:text-xl font-mono font-black ${missing > 0 ? 'text-gold' : 'text-green-400'}`}>
                    {formatMoney(missing > 0 ? missing : change, currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {lines.map((line, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`method-${i}`}>Medio de pago</label>
                      <select
                        id={`method-${i}`}
                        value={line.method}
                        onChange={(e) => updateLine(i, { method: e.target.value })}
                        className="h-12 bg-bg-primary border border-white/5 rounded-xl px-3 text-sm text-white outline-none focus:border-gold/30 font-bold"
                      >
                        {available.map((m) => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-mono text-xs font-black">{currency}</span>
                        <input
                          autoFocus={i === 0}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          aria-label={`Monto en ${paymentMethodLabel(line.method)}`}
                          value={line.amount}
                          onChange={(e) => updateLine(i, { amount: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmClick(); }}
                          placeholder={line.method === 'CASH' ? 'Recibido' : '0'}
                          className="w-full h-12 bg-bg-primary border border-white/5 rounded-xl pl-14 pr-3 text-right text-xl text-white font-mono font-black outline-none focus:border-gold transition-all placeholder:text-sm placeholder:font-sans placeholder:text-gray-600"
                        />
                      </div>
                      {lines.length > 1 && (
                        <button
                          onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={`Quitar pago en ${paymentMethodLabel(line.method)}`}
                          className="w-10 h-12 rounded-xl text-gray-500 hover:text-red-500 flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {line.method !== 'CASH' && (
                      <input
                        type="text"
                        aria-label="Referencia del pago"
                        value={line.reference}
                        onChange={(e) => updateLine(i, { reference: e.target.value })}
                        placeholder="Referencia o últimos 4 dígitos (opcional)"
                        className="w-full h-10 bg-bg-primary border border-white/5 rounded-xl px-3 text-xs text-white outline-none focus:border-gold/30"
                      />
                    )}
                  </div>
                ))}

                {nonCashTooHigh && (
                  <p className="text-xs text-red-400 px-1">Los pagos que no son en efectivo no pueden superar el total. El cambio solo se entrega en efectivo.</p>
                )}

                {available.length > 1 && missing > 0 && lines.length < 6 && (
                  <button
                    onClick={addLine}
                    className="w-full h-11 rounded-xl border border-dashed border-white/10 text-gray-400 hover:text-gold hover:border-gold/40 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={14} /> Dividir el pago
                  </button>
                )}
              </div>

              {available.includes('CASH') && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setCash('exact')}
                    className="h-10 bg-gold/10 hover:bg-gold/20 border border-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold transition-all"
                  >
                    Exacto
                  </button>
                  {cashDenominations(currency).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCash(val)}
                      className="h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black tracking-widest text-gray-400 hover:text-white transition-all"
                    >
                      {val.toLocaleString('es-419')}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={12} className="text-gold" />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Datos de Facturación (Opcional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="client-nit" className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">{fiscal.taxIdLabel}</label>
                    <div className="relative">
                      <input
                        id="client-nit"
                        type="text"
                        value={clientNit}
                        onChange={(e) => setClientNit(e.target.value)}
                        placeholder="Ej: 12345678"
                        className="w-full h-12 bg-bg-primary border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-gold/30 transition-all font-mono"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="client-name" className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Razón Social</label>
                    <input
                      id="client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={isNewClient ? "Nombre Cliente Nuevo" : "Razón Social o Nombre"}
                      className={`w-full h-12 bg-bg-primary border rounded-xl px-4 text-xs text-white outline-none transition-all ${isNewClient ? 'border-gold/40 focus:border-gold' : 'border-white/5 focus:border-gold/30'}`}
                    />
                  </div>
                </div>
                {isNewClient && clientNit && (
                  <p className="text-[9px] text-gold font-black uppercase tracking-widest text-center mt-1">
                    Cliente nuevo: escribí su razón social para guardarlo.
                  </p>
                )}
                {!isNewClient && clientNit && clientName && (
                  <p className="text-[9px] text-green-400 font-black uppercase tracking-widest text-center mt-1">
                    Cliente encontrado.
                  </p>
                )}
              </div>

              <button
                onClick={handleConfirmClick}
                disabled={!canConfirm}
                className={`w-full h-16 lg:h-20 rounded-2xl lg:rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] lg:text-xs flex items-center justify-center gap-4 transition-all shadow-2xl ${canConfirm ? 'bg-gold text-primary-foreground shadow-gold/20 hover:scale-[1.02] active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
              >
                {processing ? <Loader2 size={18} className="animate-spin" /> : null}
                {missing > 0 ? `Falta ${formatMoney(missing, currency)}` : 'Confirmar Venta'}
                {!processing && missing === 0 && <ArrowRight size={18} />}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
