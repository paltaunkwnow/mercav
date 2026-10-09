"use client";

import { useId, useState, type FormEvent } from "react";
import { BadgeCheck, Loader2, ShieldAlert } from "@/components/icons";
import type { LoyaltyCardView, LoyaltyEventView, LoyaltyProgramView } from "@/lib/business/loyalty/types";
import { HOLDER_DOC_TYPES } from "@/lib/business/loyalty/notice";

type Payload = { program: LoyaltyProgramView; card: LoyaltyCardView; history: LoyaltyEventView[] };

/** Etiqueta corta del titular para la lista y la caja. */
export function HolderBadge({ status }: { status: LoyaltyCardView["holderStatus"] }) {
  if (status === "UNVERIFIED") return null;
  return status === "VERIFIED" ? (
    <span className="mv-chip mv-chip-gold">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      Titular verificado
    </span>
  ) : (
    <span className="mv-chip">
      <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
      Falta validar documento
    </span>
  );
}

/**
 * Validar al titular en el mostrador: la tarjeta está guardada en una cuenta Mercav y la persona muestra su
 * documento. Se guarda el tipo y los últimos 4 caracteres; la tarjeta cambia de código (las fotos viejas del QR
 * dejan de servir). Quien administra Fidelización también puede desvincularla.
 */
export function HolderPanel({
  slug,
  cardId,
  status,
  accountName,
  customerName,
  verifiedDoc,
  canUnlink,
  onChange,
}: {
  slug: string;
  cardId: string;
  status: LoyaltyCardView["holderStatus"];
  accountName?: string | null;
  customerName: string;
  verifiedDoc?: string | null;
  canUnlink: boolean;
  onChange: (payload: Payload) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<(typeof HOLDER_DOC_TYPES)[number]>(HOLDER_DOC_TYPES[0]);
  const [last4, setLast4] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "UNVERIFIED") return null;

  async function send(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/business/${slug}/loyalty/cards/${cardId}/holder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "No pudimos guardar. Probá de nuevo.");
      setOpen(false);
      setLast4("");
      setConfirm(false);
      onChange(json.data as Payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar.");
    } finally {
      setBusy(null);
    }
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    void send({ action: "verify", docType, docLast4: last4, confirm }, "verify");
  }

  return (
    <section aria-label="Titular de la tarjeta" className="flex flex-col gap-3 rounded-[1rem] bg-[var(--mv-panel-sunk)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HolderBadge status={status} />
        {accountName ? <span className="text-xs text-[var(--text-secondary)]">Cuenta Mercav: {accountName}</span> : null}
      </div>
      {status === "VERIFIED" ? (
        <p className="text-sm text-[var(--text-secondary)]">Documento revisado{verifiedDoc ? ` (${verifiedDoc})` : ""}. Es la misma persona de la tarjeta y de la cuenta.</p>
      ) : open ? (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <p className="text-sm text-[var(--text-primary)]">
            Pedile su documento y fijate que el nombre coincida con «{customerName}»{accountName ? ` y con la cuenta de ${accountName}` : ""}.
          </p>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <label htmlFor={`${id}-type`} className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-secondary)]">
              Documento
              <select id={`${id}-type`} value={docType} onChange={(e) => setDocType(e.target.value as (typeof HOLDER_DOC_TYPES)[number])} className="mv-input">
                {HOLDER_DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-last4`} className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-secondary)]">
              Últimos 4
              <input id={`${id}-last4`} value={last4} onChange={(e) => setLast4(e.target.value.slice(0, 4))} inputMode="text" autoComplete="off" maxLength={4} className="mv-input uppercase" />
            </label>
          </div>
          <label className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />
            Vi el documento en persona y coincide
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={!confirm || last4.length !== 4 || !!busy} className="mv-btn mv-btn-primary mv-btn-sm flex-1">
              {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Validar titular
            </button>
            <button type="button" onClick={() => setOpen(false)} className="mv-btn mv-btn-secondary mv-btn-sm">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--text-secondary)]">La guardó en su cuenta Mercav. Validala viendo su documento la próxima vez que venga.</p>
          <button type="button" onClick={() => setOpen(true)} className="mv-btn mv-btn-secondary mv-btn-sm w-fit">
            Validar con documento
          </button>
        </div>
      )}
      {canUnlink ? (
        <button type="button" onClick={() => void send({ action: "unlink" }, "unlink")} disabled={!!busy} className="mv-btn mv-btn-ghost mv-btn-sm w-fit text-red-400 [.light_&]:text-red-700">
          {busy === "unlink" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Sacar de la cuenta
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-400 [.light_&]:text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
// creado por pato dev y askforvini
