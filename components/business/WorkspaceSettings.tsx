"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, MessageCircle, Trash2, UserPlus } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { DEPARTMENTS } from "@/lib/calendar/sources";
import { ASSIGNABLE_ROLES, ROLE_HINTS, ROLE_LABELS, type BusinessRoleKey } from "@/lib/business/permissions";
import { idLabels } from "@/lib/business/countries";
import { latamCountry } from "@/lib/geo/latam";
import { formatDate } from "@/lib/business/format";
import { sendJson } from "@/lib/business/client";
import { Field } from "./ui";

type WorkspaceData = { slug: string; name: string; legalName: string | null; nit: string | null; country: string; region: string | null; city: string | null; productive: boolean };
type MemberRow = { id: string; name: string; email: string; role: BusinessRoleKey; isMe: boolean };
type InviteRow = { id: string; role: BusinessRoleKey; employeeName: string | null; email: string | null; expiresAt: string };

export function CompanyForm({ workspace, canEdit }: { workspace: WorkspaceData; canEdit: boolean }) {
  const router = useRouter();
  const [productive, setProductive] = useState(workspace.productive);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const labels = idLabels(workspace.country);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("saving");
    setError(null);
    const res = await sendJson(`/api/business/${workspace.slug}`, "PATCH", {
      name: f.get("name"),
      legalName: f.get("legalName") || null,
      nit: f.get("nit") || null,
      region: f.get("region") || null,
      city: f.get("city") || null,
      productive,
    });
    if (!res.ok) {
      setState("idle");
      return setError(res.error);
    }
    setState("saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mv-panel grid gap-4 p-5 sm:grid-cols-2">
      <h2 className="font-display text-base font-semibold text-[var(--text-primary)] sm:col-span-2">Datos de la empresa</h2>
      <Field label="Nombre" htmlFor="c-name">
        <input id="c-name" name="name" required minLength={2} maxLength={80} defaultValue={workspace.name} disabled={!canEdit} className="mv-input h-11" />
      </Field>
      <Field label="Razón social" htmlFor="c-legal">
        <input id="c-legal" name="legalName" maxLength={120} defaultValue={workspace.legalName ?? ""} disabled={!canEdit} className="mv-input h-11" />
      </Field>
      <Field label={workspace.country === "BO" ? "NIT" : "Identificación fiscal"} htmlFor="c-nit">
        <input id="c-nit" name="nit" maxLength={20} defaultValue={workspace.nit ?? ""} disabled={!canEdit} className="mv-input h-11" />
      </Field>
      <Field label="País" htmlFor="c-country" hint="El país no se cambia: define moneda y planilla.">
        <input id="c-country" value={latamCountry(workspace.country).name} disabled className="mv-input h-11" />
      </Field>
      <Field label={labels.region} htmlFor="c-region">
        {workspace.country === "BO" ? (
          <select id="c-region" name="region" defaultValue={workspace.region ?? ""} disabled={!canEdit} className="mv-input h-11">
            <option value="">—</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        ) : (
          <input id="c-region" name="region" maxLength={60} defaultValue={workspace.region ?? ""} disabled={!canEdit} className="mv-input h-11" />
        )}
      </Field>
      <Field label="Ciudad" htmlFor="c-city">
        <input id="c-city" name="city" maxLength={60} defaultValue={workspace.city ?? ""} disabled={!canEdit} className="mv-input h-11" />
      </Field>
      {workspace.country === "BO" ? (
        <label className="flex items-start gap-3 sm:col-span-2">
          <input type="checkbox" checked={productive} disabled={!canEdit} onChange={(e) => setProductive(e.target.checked)} className="mt-1 accent-[var(--color-gold)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">Empresa productiva</span>
            <span className="block text-xs text-[var(--text-secondary)]">Fabrica o transforma bienes: el bono de antigüedad se calcula sobre 3 salarios mínimos.</span>
          </span>
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-500 sm:col-span-2">
          {error}
        </p>
      ) : null}
      {canEdit ? (
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={state === "saving"} className={buttonClass("primary", "sm")}>
            {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Guardar
          </button>
          {state === "saved" ? <span role="status" className="text-xs text-[var(--text-secondary)]">Guardado.</span> : null}
        </div>
      ) : null}
    </form>
  );
}

export function TeamSettings({
  slug,
  workspaceName,
  members,
  invites,
  canManageMembers,
  canInvite,
  isOwner,
}: {
  slug: string;
  workspaceName: string;
  members: MemberRow[];
  invites: InviteRow[];
  canManageMembers: boolean;
  canInvite: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<BusinessRoleKey>("EMPLOYEE");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inviteRoles = isOwner ? ASSIGNABLE_ROLES : (["EMPLOYEE", "MANAGER"] as BusinessRoleKey[]);

  async function changeRole(memberId: string, next: BusinessRoleKey) {
    setBusy(memberId);
    setError(null);
    const res = await sendJson(`/api/business/${slug}/members/${memberId}`, "PATCH", { role: next });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function removeMember(memberId: string, name: string) {
    if (!window.confirm(`¿Quitar a ${name} de la empresa? Su legajo se mantiene.`)) return;
    setBusy(memberId);
    const res = await sendJson(`/api/business/${slug}/members/${memberId}`, "DELETE");
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function createInvite() {
    setBusy("invite");
    setError(null);
    const res = await sendJson<{ path?: string }>(`/api/business/${slug}/invites`, "POST", { role });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    const path = res.data?.path;
    if (!path) return setError("No pudimos generar el link. Probá de nuevo.");
    setLink(new URL(path, window.location.origin).toString());
    router.refresh();
  }

  async function revoke(id: string) {
    setBusy(id);
    const res = await sendJson(`/api/business/${slug}/invites/${id}`, "DELETE");
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar. Seleccioná el link y copialo a mano.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="mv-panel p-5" aria-labelledby="team-members">
        <h2 id="team-members" className="font-display text-base font-semibold text-[var(--text-primary)]">
          Personas con acceso
        </h2>
        <ul className="mt-3 divide-y divide-[var(--mv-hairline)]">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                  {m.name} {m.isMe ? <span className="text-xs font-normal text-[var(--text-tertiary)]">(vos)</span> : null}
                </span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{m.email}</span>
              </span>
              {canManageMembers && m.role !== "OWNER" ? (
                <>
                  <label htmlFor={`role-${m.id}`} className="sr-only">
                    Rol de {m.name}
                  </label>
                  <select id={`role-${m.id}`} value={m.role} disabled={busy === m.id} onChange={(e) => changeRole(m.id, e.target.value as BusinessRoleKey)} className="mv-input h-9 text-sm">
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeMember(m.id, m.name)} disabled={busy === m.id} aria-label={`Quitar a ${m.name}`} className="mv-focus grid h-9 w-9 place-items-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </>
              ) : (
                <span className="mv-chip !py-0.5 !text-[11px]">{ROLE_LABELS[m.role]}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {canInvite ? (
        <section className="mv-panel flex flex-col gap-3 p-5" aria-labelledby="team-invite">
          <h2 id="team-invite" className="font-display text-base font-semibold text-[var(--text-primary)]">
            Invitar
          </h2>
          <p className="text-xs leading-snug text-[var(--text-secondary)]">
            Generá un link y mandalo por WhatsApp o correo. Vale 7 días y se usa una vez. Para vincular a un trabajador con su legajo, invitalo desde su ficha.
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor="inv-role" className="text-sm font-semibold text-[var(--text-primary)]">
              Rol
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as BusinessRoleKey)} className="mv-input h-11 flex-1">
                {inviteRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <button type="button" onClick={createInvite} disabled={busy === "invite"} className={buttonClass("primary", "md")}>
                {busy === "invite" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
                Crear link de acceso
              </button>
            </div>
            {ROLE_HINTS[role] ? <p className="text-xs leading-snug text-[var(--text-secondary)]">{ROLE_HINTS[role]}</p> : null}
          </div>
          {link ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="team-link" className="sr-only">
                Link de invitación
              </label>
              <input id="team-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="mv-input h-10 text-xs" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copy} className={buttonClass("secondary", "sm")}>
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Te invito a ${workspaceName} en Mercav Business: ${link}`)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp
                </a>
              </div>
            </div>
          ) : null}
          {invites.length ? (
            <>
              <p className="pt-2 text-xs font-semibold text-[var(--text-tertiary)]">Pendientes</p>
              <ul className="divide-y divide-[var(--mv-hairline)]">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">
                      <span className="block truncate font-medium">
                        {ROLE_LABELS[i.role]}
                        {i.employeeName ? ` · ${i.employeeName}` : ""}
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)]">Vence el {formatDate(i.expiresAt)}</span>
                    </span>
                    <button type="button" onClick={() => revoke(i.id)} disabled={busy === i.id} className="mv-focus shrink-0 h-8 rounded-full px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10">
                      Revocar
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
