"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { CircleCheck, Loader2, ShieldCheck } from "@/components/icons";
import type { LoyaltyCardView, LoyaltyEventView, LoyaltyProgramView } from "@/lib/business/loyalty/types";
import { REAL_DATA_NOTICE_BUSINESS } from "@/lib/business/loyalty/notice";
import { qrDataUrl } from "@/components/business/loyalty/panel/qr";

type Registered = { program: LoyaltyProgramView; card: LoyaltyCardView; history: LoyaltyEventView[]; url: string };

/**
 * Alta de un cliente desde el negocio. Pide datos reales (se valida al titular con su documento) y, si tiene cuenta
 * Mercav, su código MercavClub para guardar la tarjeta en su cuenta. Al terminar muestra el QR para que el cliente
 * abra su tarjeta en el celular.
 */
export function RegisterCustomerForm({
  slug,
  programs,
  programId: initialProgram,
  prefill,
  onDone,
  onCancel,
}: {
  slug: string;
  programs: Pick<LoyaltyProgramView, "id" | "name">[];
  programId?: string;
  prefill?: { phone?: string; clubCode?: string };
  onDone?: (registered: Registered) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [programId, setProgramId] = useState(initialProgram ?? programs[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState("");
  const [clubCode, setClubCode] = useState(prefill?.clubCode ?? "");
  const [consent, setConsent] = useState(false);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Registered | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!done) return;
    let alive = true;
    qrDataUrl(new URL(done.url, window.location.origin).toString(), 360)
      .then((src) => alive && setQr(src))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [done]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ack) {
      setError("Confirmá que cargaste los datos reales del cliente.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/${slug}/loyalty/programs/${programId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || null, email: email || null, clubCode: clubCode || null, marketingConsent: consent, ack: true }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "No pudimos crear la tarjeta. Probá de nuevo.");
      setDone(json.data as Registered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la tarjeta.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]">
          <CircleCheck className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">Tarjeta creada para {done.card.customerName}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Cliente #{done.card.customerNo} · {done.program.name}
            {done.card.holderStatus === "PENDING" ? " · guardada en su cuenta, falta ver su documento" : ""}
          </p>
        </div>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR de la tarjeta del cliente" width={180} height={180} className="rounded-xl bg-white p-2" />
        ) : (
          <span className="grid h-[180px] w-[180px] place-items-center rounded-xl bg-[var(--mv-panel-sunk)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" aria-hidden />
          </span>
        )}
        <p className="max-w-xs text-sm text-[var(--text-secondary)]">Que el cliente escanee este QR con su celular para abrir y guardar su tarjeta.</p>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {onDone ? (
            <button type="button" onClick={() => onDone(done)} className="mv-btn mv-btn-primary flex-1">
              Sellar ahora
            </button>
          ) : null}
          <button type="button" onClick={onCancel} className="mv-btn mv-btn-secondary flex-1">
            Listo
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {programs.length > 1 ? (
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          Club
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="mv-input">
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label htmlFor={`${id}-name`} className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
        Nombre y apellido
        <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} autoComplete="off" className="mv-input" placeholder="Como figura en su documento" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-phone`} className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          Celular
          <input id={`${id}-phone`} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" className="mv-input" placeholder="Opcional" />
        </label>
        <label htmlFor={`${id}-email`} className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          Correo
          <input id={`${id}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className="mv-input" placeholder="Opcional" />
        </label>
      </div>
      <label htmlFor={`${id}-club`} className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
        Código MercavClub
        <input
          id={`${id}-club`}
          value={clubCode}
          onChange={(e) => setClubCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="mv-input uppercase placeholder:normal-case"
          placeholder="Si tiene cuenta Mercav: MC-XXXX-XXXXX"
        />
        <span className="text-xs font-normal text-[var(--text-secondary)]">La tarjeta queda guardada en su cuenta. Lo ve en Mercav, en Mis tarjetas.</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />
        Acepta recibir promociones de este negocio
      </label>

      <div className="flex flex-col gap-3 rounded-[1rem] bg-[var(--mv-gold-wash)] p-4">
        <p className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mv-gold-ink)]" aria-hidden />
          {REAL_DATA_NOTICE_BUSINESS}
        </p>
        <label className="flex items-start gap-3 text-sm font-semibold text-[var(--text-primary)]">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />
          Confirmo que son los datos reales del cliente
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-400 [.light_&]:text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={busy || name.trim().length < 2 || !programId} className="mv-btn mv-btn-primary flex-1">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy ? "Creando…" : "Crear tarjeta"}
        </button>
        <button type="button" onClick={onCancel} className="mv-btn mv-btn-secondary flex-1">
          Cancelar
        </button>
      </div>
    </form>
  );
}
// creado por pato dev y askforvini
