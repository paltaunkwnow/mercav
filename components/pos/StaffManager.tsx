"use client";

import { useEffect, useState } from 'react';
import { Loader2, Plus, UserRound } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: 'CASHIER' | 'MANAGER' | string;
  isActive: boolean;
}

type PinFetch = (url: string, init?: RequestInit) => Promise<Response>;

const ROLE_LABEL: Record<string, string> = { CASHIER: 'Cajero', MANAGER: 'Encargado' };
const fieldLabel = 'block text-sm font-semibold text-[var(--text-secondary)]';
const pinOnly = (v: string) => v.replace(/\D/g, '').slice(0, 6);
const validPin = (v: string) => /^\d{4,6}$/.test(v);

/** People who use this POS with a PIN. PINs are hashed on the server and never come back. */
export default function StaffManager({ pinFetch, onMessage }: { pinFetch: PinFetch; onMessage: (message: string, type: 'success' | 'error') => void }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', role: 'CASHIER', pin: '' });
  const [pinEdit, setPinEdit] = useState<{ id: string; pin: string } | null>(null);

  useEffect(() => {
    fetch('/api/pos/staff')
      .then((r) => r.json())
      .then((d) => { if (d.success) setStaff(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const send = async (url: string, method: string, body: unknown, id: string) => {
    setBusyId(id);
    try {
      const res = await pinFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!data?.success) {
        onMessage(data?.error || 'No pudimos guardar el cambio', 'error');
        return null;
      }
      return data.data as StaffMember;
    } catch {
      onMessage('Error de conexión', 'error');
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const add = async () => {
    if (!draft.name.trim() || !validPin(draft.pin)) return;
    const created = await send('/api/pos/staff', 'POST', { name: draft.name.trim(), role: draft.role, pin: draft.pin }, 'new');
    if (created) {
      setStaff((prev) => [...prev, created]);
      setDraft({ name: '', role: 'CASHIER', pin: '' });
      onMessage(`${created.name} ya puede abrir la caja con su PIN`, 'success');
    }
  };

  const update = async (member: StaffMember, patch: Partial<StaffMember> & { pin?: string }) => {
    const updated = await send(`/api/pos/staff/${member.id}`, 'PATCH', patch, member.id);
    if (updated) {
      setStaff((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (patch.pin) {
        setPinEdit(null);
        onMessage(`PIN de ${updated.name} actualizado`, 'success');
      }
    }
  };

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]" role="status"><Loader2 size={16} className="animate-spin" aria-hidden /> Cargando personal…</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Todavía no agregaste a nadie. Mientras tanto, la caja la abre el dueño de la cuenta sin PIN.</p>
      ) : (
        <ul className="divide-y divide-[var(--mv-hairline)] rounded-2xl border border-[var(--mv-hairline)]">
          {staff.map((m) => (
            <li key={m.id} className={`space-y-3 p-3 sm:p-4 ${m.isActive ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-panel)] text-[var(--text-secondary)]"><UserRound size={18} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{m.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{ROLE_LABEL[m.role] ?? m.role}{m.isActive ? '' : ' · Desactivado'}</p>
                </div>
                <label className="sr-only" htmlFor={`role-${m.id}`}>Rol de {m.name}</label>
                <select
                  id={`role-${m.id}`}
                  value={m.role}
                  disabled={busyId === m.id}
                  onChange={(e) => update(m, { role: e.target.value })}
                  className="mv-input h-11 w-auto px-3 text-sm"
                >
                  <option value="CASHIER">Cajero</option>
                  <option value="MANAGER">Encargado</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPinEdit(pinEdit?.id === m.id ? null : { id: m.id, pin: '' })}
                  aria-expanded={pinEdit?.id === m.id}
                  className="mv-focus h-11 rounded-full px-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--mv-panel-hover)]"
                >
                  Cambiar PIN
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={m.isActive}
                  aria-label={`${m.name} puede usar la caja`}
                  disabled={busyId === m.id}
                  onClick={() => update(m, { isActive: !m.isActive })}
                  className="mv-focus inline-flex h-11 items-center rounded-full px-1"
                >
                  <span className={`relative h-6 w-10 rounded-full transition-colors duration-200 ${m.isActive ? 'bg-gold' : 'bg-[var(--mv-hairline-strong)]'}`} aria-hidden>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#fff] shadow transition-transform duration-200 ${m.isActive ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                  </span>
                </button>
              </div>
              {pinEdit?.id === m.id && (
                <form
                  className="flex gap-2 sm:pl-[3.25rem]"
                  onSubmit={(e) => { e.preventDefault(); if (validPin(pinEdit.pin)) update(m, { pin: pinEdit.pin }); }}
                >
                  <label htmlFor={`pin-${m.id}`} className="sr-only">Nuevo PIN de {m.name}</label>
                  <input
                    id={`pin-${m.id}`}
                    autoFocus
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    value={pinEdit.pin}
                    onChange={(e) => setPinEdit({ id: m.id, pin: pinOnly(e.target.value) })}
                    placeholder="Nuevo PIN (4 a 6 números)"
                    className="mv-input mv-data h-11 min-w-0 flex-1 text-sm placeholder:font-sans"
                  />
                  <button type="submit" disabled={!validPin(pinEdit.pin) || busyId === m.id} className="mv-btn mv-btn-primary mv-btn-sm h-11 shrink-0">Guardar</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); add(); }}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
      >
        <div className="space-y-2">
          <label htmlFor="staff-name" className={fieldLabel}>Nombre</label>
          <input
            id="staff-name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            maxLength={60}
            autoComplete="off"
            placeholder="Como aparece en la caja"
            className="mv-input"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="staff-role" className={fieldLabel}>Rol</label>
          <select id="staff-role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="mv-input sm:w-40">
            <option value="CASHIER">Cajero</option>
            <option value="MANAGER">Encargado</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="staff-pin" className={fieldLabel}>PIN</label>
          <input
            id="staff-pin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={draft.pin}
            onChange={(e) => setDraft({ ...draft, pin: pinOnly(e.target.value) })}
            placeholder="4 a 6 números"
            className="mv-input mv-data placeholder:font-sans sm:w-40"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.name.trim() || !validPin(draft.pin) || busyId === 'new'}
          className="mv-btn mv-btn-primary w-full sm:col-span-3 sm:w-auto sm:justify-self-end"
        >
          {busyId === 'new' ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Plus size={18} aria-hidden />}
          Agregar persona
        </button>
      </form>
      <p className="text-xs text-[var(--text-secondary)]">
        Si un cajero tiene la caja abierta, anular ventas y cambiar inventario o configuración piden el PIN de un encargado. Después de 5 PIN incorrectos en un minuto, la caja espera un minuto.
      </p>
    </div>
  );
}
// creado por pato dev y askforvini
