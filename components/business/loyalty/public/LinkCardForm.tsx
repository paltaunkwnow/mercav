"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "@/components/icons";
import { REAL_DATA_NOTICE_CUSTOMER } from "@/lib/business/loyalty/notice";

/**
 * Guardar la tarjeta en la cuenta Mercav del cliente. La tarjeta sale de la cookie de este navegador; si tiene
 * celular se piden sus últimos 4 números. Queda pendiente hasta que el negocio vea el documento.
 */
export function LinkCardForm({ slug, needsPhone, businessName }: { slug: string; needsPhone: boolean; businessName: string }) {
  const id = useId();
  const router = useRouter();
  const [last4, setLast4] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/loyalty/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ack: true, ...(needsPhone ? { phoneLast4: last4 } : {}) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "No pudimos guardar la tarjeta. Probá de nuevo.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar la tarjeta.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {needsPhone ? (
        <label htmlFor={`${id}-last4`} className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          Últimos 4 números del celular de la tarjeta
          <input
            id={`${id}-last4`}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            className="mv-input w-32 tabular-nums"
          />
        </label>
      ) : null}
      <div className="flex flex-col gap-3 rounded-[1rem] bg-[var(--mv-gold-wash)] p-4">
        <p className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mv-gold-ink)]" aria-hidden />
          {REAL_DATA_NOTICE_CUSTOMER.replace("el negocio", businessName)}
        </p>
        <label className="flex items-start gap-3 text-sm font-semibold text-[var(--text-primary)]">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />
          Confirmo que mis datos son reales y que soy el titular
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-400 [.light_&]:text-red-700">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy || !ack || (needsPhone && last4.length !== 4)} className="mv-btn mv-btn-primary w-full sm:w-fit">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {busy ? "Guardando…" : "Guardar en mi cuenta"}
      </button>
    </form>
  );
}
// creado por pato dev y askforvini
