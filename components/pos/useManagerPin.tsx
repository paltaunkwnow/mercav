"use client";

import { useEffect, useRef, useState } from 'react';
import { KeyRound, X } from '@/components/icons';
import { posFetch } from '@/lib/pos/client';

const PIN_CODES = new Set(['MANAGER_PIN_REQUIRED', 'PIN_INVALID']);

export function PinDialog({
  title,
  message,
  onSubmit,
  onCancel,
}: {
  title: string;
  message?: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState('');
  const valid = /^\d{4,6}$/.test(pin);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <div className="mv-fade absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden />
      <form
        onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(pin); }}
        className="mv-pop mv-menu relative w-full max-w-sm rounded-[1.75rem] p-6"
      >
        <button type="button" onClick={onCancel} aria-label="Cancelar" className="mv-focus absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X size={20} aria-hidden />
        </button>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
          <KeyRound size={20} aria-hidden />
        </span>
        <h2 id="pin-title" className="mv-h3 mt-4">{title}</h2>
        {message && <p className="mt-1 text-sm text-[var(--text-secondary)]" role="alert">{message}</p>}
        <label htmlFor="pin-input" className="mt-5 block text-sm font-semibold text-[var(--text-secondary)]">PIN de 4 a 6 números</label>
        <input
          id="pin-input"
          autoFocus
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="mv-input mv-data mt-2 h-14 text-center text-2xl tracking-[0.5em]"
        />
        <button type="submit" disabled={!valid} className="mv-btn mv-btn-primary mv-btn-lg mt-5 w-full">Confirmar</button>
      </form>
    </div>
  );
}

/**
 * fetch() that asks for a manager PIN when the API answers MANAGER_PIN_REQUIRED (a cashier has the till open),
 * retries with the `x-pos-manager-pin` header and remembers the PIN while this page stays open.
 */
export function useManagerPin() {
  const pinRef = useRef<string | null>(null);
  const [prompt, setPrompt] = useState<{ message: string; resolve: (pin: string | null) => void } | null>(null);

  const ask = (message: string) => new Promise<string | null>((resolve) => setPrompt({ message, resolve }));

  const pinFetch = async (url: string, init: RequestInit = {}) => {
    const withPin = (pin: string | null): RequestInit => ({
      ...init,
      headers: { ...((init.headers as Record<string, string> | undefined) ?? {}), ...(pin ? { 'x-pos-manager-pin': pin } : {}) },
    });
    let res = await posFetch(url, withPin(pinRef.current));
    for (let attempt = 0; attempt < 3 && res.status === 403; attempt++) {
      const body = await res.clone().json().catch(() => null);
      if (!PIN_CODES.has(body?.code)) break;
      const pin = await ask(body.code === 'PIN_INVALID' ? 'PIN incorrecto. Probá de nuevo.' : body.error);
      if (!pin) break;
      res = await posFetch(url, withPin(pin));
      if (res.status !== 403) pinRef.current = pin;
    }
    return res;
  };

  const close = (pin: string | null) => {
    prompt?.resolve(pin);
    setPrompt(null);
  };

  const pinDialog = prompt ? (
    <PinDialog title="PIN de encargado" message={prompt.message} onSubmit={(pin) => close(pin)} onCancel={() => close(null)} />
  ) : null;

  return { pinFetch, pinDialog };
}
// creado por pato dev y askforvini
