"use client";

import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Wallet, User, Plus, Trash2, Loader2 } from '@/components/icons';
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

  // Keyboard: Escape closes, Tab stays inside the dialog, focus returns to the trigger on close.
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const processingRef = useRef(processing);
  processingRef.current = processing;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!processingRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [isOpen]);

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

  const statusLabel = missing > 0 ? 'Falta' : 'Cambio';
  const confirmLabel = processing
    ? 'Registrando venta…'
    : missing > 0
      ? `Falta ${formatMoney(missing, currency)}`
      : nonCashTooHigh
        ? 'Revisá los montos'
        : 'Confirmar venta';
  const label = 'block text-sm font-semibold text-[var(--text-secondary)]';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <div className="mv-fade absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

          <div
            ref={panelRef}
            className="mv-pop mv-menu custom-scrollbar relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem]"
          >
            <div className="space-y-5 p-5 sm:p-7">
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
                    <Wallet size={22} aria-hidden />
                  </span>
                  <div>
                    <h2 id="payment-title" className="mv-h3">Cobrar</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Podés combinar varios medios de pago.</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} aria-label="Cerrar cobro" className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                  <X size={20} aria-hidden />
                </button>
              </header>

              <div className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">Total a cobrar</span>
                  <span className="mv-data text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{formatMoney(total, currency)}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--mv-hairline)] pt-3" aria-live="polite" aria-atomic="true">
                  <div>
                    <dt className="text-xs font-medium text-[var(--text-secondary)]">Pagado</dt>
                    <dd className="mv-data text-lg font-semibold text-[var(--text-primary)]">{formatMoney(paid, currency)}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-xs font-medium text-[var(--text-secondary)]">{statusLabel}</dt>
                    <dd className={`mv-data text-lg font-semibold ${missing > 0 ? 'text-gold' : 'text-green-400'}`}>
                      {formatMoney(missing > 0 ? missing : change, currency)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="space-y-2 rounded-2xl border border-[var(--mv-hairline)] p-3">
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`method-${i}`}>Medio de pago</label>
                      <select
                        id={`method-${i}`}
                        value={line.method}
                        onChange={(e) => updateLine(i, { method: e.target.value })}
                        className="mv-input h-14 w-auto max-w-[45%] shrink-0 px-3 text-sm font-semibold"
                      >
                        {available.map((m) => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
                      </select>
                      <div className="relative min-w-0 flex-1">
                        <span className="mv-data pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-secondary)]">{currency}</span>
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
                          className="mv-input mv-data h-14 pl-14 pr-3 text-right text-xl font-semibold placeholder:font-sans placeholder:text-sm"
                        />
                      </div>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={`Quitar pago en ${paymentMethodLabel(line.method)}`}
                          className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={16} aria-hidden />
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
                        autoComplete="off"
                        className="mv-input mv-data h-11 text-sm"
                      />
                    )}
                  </div>
                ))}

                {nonCashTooHigh && (
                  <p role="alert" className="px-1 text-sm font-medium text-red-400">Los pagos que no son en efectivo no pueden superar el total. El cambio solo se entrega en efectivo.</p>
                )}

                {available.length > 1 && missing > 0 && lines.length < 6 && (
                  <button
                    type="button"
                    onClick={addLine}
                    className="mv-focus flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--mv-hairline-strong)] text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--color-border-gold)] hover:text-gold"
                  >
                    <Plus size={16} aria-hidden /> Dividir el pago
                  </button>
                )}
              </div>

              {available.includes('CASH') && (
                <div className="space-y-2">
                  <p className={label} id="cash-quick">Efectivo rápido</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-labelledby="cash-quick">
                    <button
                      type="button"
                      onClick={() => setCash('exact')}
                      className="mv-focus h-11 rounded-xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-sm font-semibold text-gold transition-transform duration-150 active:scale-[0.97]"
                    >
                      Exacto
                    </button>
                    {cashDenominations(currency).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCash(val)}
                        className="mv-focus mv-data h-11 rounded-xl border border-[var(--mv-hairline-strong)] text-sm font-semibold text-[var(--text-primary)] transition-transform duration-150 active:scale-[0.97]"
                      >
                        {val.toLocaleString('es-419')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <fieldset className="space-y-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
                <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-[var(--text-secondary)]">
                  <User size={14} className="text-gold" aria-hidden />
                  Datos para la factura <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span>
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="client-nit" className={label}>{fiscal.taxIdLabel}</label>
                    <div className="relative">
                      <input
                        id="client-nit"
                        type="text"
                        value={clientNit}
                        onChange={(e) => setClientNit(e.target.value)}
                        placeholder="Ej: 12345678"
                        autoComplete="off"
                        aria-describedby={clientNit ? 'client-status' : undefined}
                        className="mv-input mv-data pr-10"
                      />
                      {isSearching && (
                        <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gold" aria-label="Buscando cliente" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="client-name" className={label}>Razón social</label>
                    <input
                      id="client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={isNewClient ? "Nombre del cliente nuevo" : "Razón social o nombre"}
                      autoComplete="off"
                      className={`mv-input ${isNewClient ? 'border-[var(--color-border-gold)]' : ''}`}
                    />
                  </div>
                </div>
                <p id="client-status" aria-live="polite" className="text-sm">
                  {isNewClient && clientNit && (
                    <span className="text-gold">Cliente nuevo: escribí su razón social para guardarlo.</span>
                  )}
                  {!isNewClient && clientNit && clientName && (
                    <span className="text-green-400">Cliente encontrado.</span>
                  )}
                </p>
              </fieldset>

              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={!canConfirm}
                aria-busy={processing || undefined}
                className={`mv-btn mv-btn-lg w-full ${canConfirm || processing ? 'mv-btn-primary' : 'border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] disabled:opacity-100 disabled:text-[var(--text-secondary)]'}`}
              >
                {processing ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                <span className={missing > 0 && !processing ? 'mv-data' : undefined}>{confirmLabel}</span>
                {!processing && canConfirm && <ArrowRight size={18} aria-hidden />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// creado por pato dev y askforvini
