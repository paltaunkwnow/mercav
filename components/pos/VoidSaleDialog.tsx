"use client";

import { useEffect, useState } from 'react';
import { Ban, Loader2, X } from '@/components/icons';
import { formatMoney } from '@/lib/pos/money';
import { posFetch } from '@/lib/pos/client';

interface VoidSaleDialogProps {
  sale: { id: string; transactionId: string; totalAmount: unknown };
  currency: string;
  onClose: () => void;
  onVoided: (sale: any) => void;
}

/** Confirms a void with a required reason. Asks for a manager PIN only when the API says it is needed. */
export default function VoidSaleDialog({ sale, currency, onClose, onVoided }: VoidSaleDialogProps) {
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [needPin, setNeedPin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [busy, onClose]);

  const canSubmit = reason.trim().length >= 3 && (!needPin || /^\d{4,6}$/.test(pin)) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const res = await posFetch(`/api/pos/sales/${sale.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim(), managerPin: needPin ? pin : undefined }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        onVoided(data.data);
        return;
      }
      if (data?.code === 'MANAGER_PIN_REQUIRED' || data?.code === 'PIN_INVALID') {
        setNeedPin(true);
        setPin('');
      }
      setError(data?.error || 'No pudimos anular la venta');
    } catch {
      setError('Sin conexión. Anular una venta necesita internet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="void-title">
      <div className="mv-fade absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} aria-hidden />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mv-pop mv-menu relative w-full max-w-md rounded-[1.75rem] p-6">
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cancelar" className="mv-focus absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X size={20} aria-hidden />
        </button>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-500/10 text-red-400">
          <Ban size={20} aria-hidden />
        </span>
        <h2 id="void-title" className="mv-h3 mt-4">Anular venta</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Ticket <span className="mv-data">#{String(sale.transactionId).slice(-8)}</span> por <span className="mv-data">{formatMoney(Number(sale.totalAmount), currency)}</span>.
          La venta queda registrada como anulada, deja de sumar en la caja y el stock vuelve al inventario.
        </p>

        <label htmlFor="void-reason" className="mt-5 block text-sm font-semibold text-[var(--text-secondary)]">Motivo</label>
        <textarea
          id="void-reason"
          autoFocus
          required
          minLength={3}
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: cobro duplicado, el cliente devolvió el producto"
          className="mv-input mt-2 h-24 resize-none py-3"
        />

        {needPin && (
          <>
            <label htmlFor="void-pin" className="mt-4 block text-sm font-semibold text-[var(--text-secondary)]">PIN de encargado</label>
            <input
              id="void-pin"
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mv-input mv-data mt-2 text-center text-xl tracking-[0.4em]"
            />
          </>
        )}

        {error && <p role="alert" className="mt-3 text-sm font-medium text-red-400">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="mv-btn border border-[var(--mv-hairline-strong)] text-[var(--text-primary)]">Volver</button>
          <button type="submit" disabled={!canSubmit} className="mv-btn bg-red-600 text-[#fff] hover:bg-red-700">
            {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Ban size={18} aria-hidden />}
            {busy ? 'Anulando…' : 'Anular venta'}
          </button>
        </div>
      </form>
    </div>
  );
}
// creado por pato dev y askforvini
