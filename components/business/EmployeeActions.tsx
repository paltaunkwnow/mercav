"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2, MessageCircle, UserMinus, UserCheck } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { sendJson } from "@/lib/business/client";

/** Baja/alta e invitación a Mercav para un legajo. */
export function EmployeeActions({
  slug,
  employeeId,
  status,
  linked,
  canInvite,
  name,
  workspaceName,
}: {
  slug: string;
  employeeId: string;
  status: "ACTIVE" | "INACTIVE";
  linked: boolean;
  canInvite: boolean;
  name: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function changeStatus(action: "deactivate" | "reactivate") {
    setBusy(action);
    setError(null);
    const res = await sendJson(`/api/business/${slug}/employees/${employeeId}`, "PATCH", { action, endDate });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function invite() {
    setBusy("invite");
    setError(null);
    const res = await sendJson<{ path: string }>(`/api/business/${slug}/invites`, "POST", { role: "EMPLOYEE", employeeId });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setLink(`${window.location.origin}${res.data!.path}`);
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

  const waText = encodeURIComponent(`Hola ${name}, te invito a ${workspaceName} en Mercav Business para ver tu legajo y tus boletas: ${link}`);

  return (
    <div className="flex flex-col gap-4">
      {canInvite && !linked && status === "ACTIVE" ? (
        <section className="mv-panel flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Invitar a Mercav</h2>
          <p className="text-xs leading-snug text-[var(--text-secondary)]">Con su cuenta, ve su legajo y descarga sus boletas. El link vale 7 días y se usa una sola vez.</p>
          {link ? (
            <>
              <label htmlFor="inv-link" className="sr-only">
                Link de invitación
              </label>
              <input id="inv-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="mv-input h-10 text-xs" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copy} className={buttonClass("secondary", "sm")}>
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {copied ? "Copiado" : "Copiar link"}
                </button>
                <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp
                </a>
              </div>
            </>
          ) : (
            <button type="button" onClick={invite} disabled={busy === "invite"} className={buttonClass("secondary", "sm", "w-fit")}>
              {busy === "invite" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
              Generar link
            </button>
          )}
        </section>
      ) : null}

      <section className="mv-panel flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{status === "ACTIVE" ? "Dar de baja" : "Volver a dar de alta"}</h2>
        {status === "ACTIVE" ? (
          <>
            <label htmlFor="end-date" className="text-xs text-[var(--text-secondary)]">
              Último día trabajado
            </label>
            <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mv-input h-10 text-sm" />
            <button type="button" onClick={() => changeStatus("deactivate")} disabled={!!busy} className={buttonClass("ghost", "sm", "w-fit text-red-500")}>
              {busy === "deactivate" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserMinus className="h-4 w-4" aria-hidden />}
              Dar de baja
            </button>
          </>
        ) : (
          <button type="button" onClick={() => changeStatus("reactivate")} disabled={!!busy} className={buttonClass("secondary", "sm", "w-fit")}>
            {busy === "reactivate" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
            Dar de alta
          </button>
        )}
      </section>
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
