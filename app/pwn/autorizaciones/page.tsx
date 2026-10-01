"use client";

import { useCallback, useEffect, useState } from "react";
import { pwnFetch, readAuthQueue, type MonitorAuthRequest } from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatWhen, pwnCardClass } from "@/components/pwn/format";
import { PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";

const TYPE_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: MonitorAuthRequest[] };

function ownerLabel(item: MonitorAuthRequest) {
  return item.owner.name || item.owner.username || item.owner.email || "Usuario";
}

export default function AutorizacionesPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/monitoring/authorize", { signal });
    if (signal?.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      if (response.reason === "disabled") setStatus({ kind: "disabled" });
      else if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "forbidden") setStatus({ kind: "forbidden" });
      else setStatus({ kind: "error", message: response.message });
      return;
    }
    setStatus({ kind: "ready", items: readAuthQueue(response.data) });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function decide(item: MonitorAuthRequest, decision: "approve" | "deny") {
    setBusy(`${item.id}:${decision}`);
    setFlash(null);
    const response = await pwnFetch("/api/pwn/monitoring/authorize", {
      method: "PATCH",
      body: JSON.stringify({ id: item.id, decision }),
    });
    setBusy(null);
    if (!response.ok) {
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "forbidden") setStatus({ kind: "forbidden" });
      else setFlash(response.message);
      return;
    }
    setFlash(decision === "approve" ? `Autorizaste ${item.targetLookup ?? item.targetDisplay}.` : `Rechazaste ${item.targetLookup ?? item.targetDisplay}.`);
    await load();
  }

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Administración"
        title="Autorizaciones"
        lead="Revisá quién pide patrullar un correo que no es el de su cuenta. La consulta de exposición no espera esta autorización."
      />

      {status.kind === "loading" ? <LoadingState label="Cargando solicitudes…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Pwn no está activado" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/autorizaciones" /> : null}
      {status.kind === "forbidden" ? (
        <EmptyState title="Solo administración" description="Las autorizaciones de consulta están reservadas a cuentas con rol ADMIN." />
      ) : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

      {status.kind === "ready" ? (
        <>
          {flash ? <PwnNotice>{flash}</PwnNotice> : null}
          {status.items.length === 0 ? (
            <EmptyState title="No hay solicitudes pendientes" description="Cuando alguien pida patrullar un correo, va a aparecer acá." />
          ) : (
            <ul className="space-y-3">
              {status.items.map((item) => {
                const display = item.targetLookup ?? item.targetDisplay;
                return (
                  <li key={item.id} className={`${pwnCardClass} !border-[var(--color-border-gold)]`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--text-tertiary)]">{TYPE_LABEL[item.targetType] ?? item.targetType}</p>
                        <h2 className="mv-data mt-1 break-all text-base font-semibold text-[var(--text-primary)] md:text-lg">{display}</h2>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          Solicitado por <span className="font-medium text-[var(--text-primary)]">{ownerLabel(item)}</span>
                          {item.owner.email && item.owner.name ? ` · ${item.owner.email}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void decide(item, "approve")}
                          className={buttonClass("primary", "sm", "w-full sm:w-auto")}
                        >
                          {busy === `${item.id}:approve` ? "Autorizando…" : "Autorizar"}
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void decide(item, "deny")}
                          className={buttonClass("ghost", "sm", "w-full text-red-300 sm:w-auto [.light_&]:text-red-700")}
                        >
                          {busy === `${item.id}:deny` ? "Rechazando…" : "Rechazar"}
                        </button>
                      </div>
                    </div>
                    {item.authorizationMessage ? (
                      <blockquote className="mt-4 rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] px-4 py-3 text-sm text-[var(--text-primary)]">
                        <span className="mb-1 block text-xs text-[var(--text-tertiary)]">Nota del solicitante</span>
                        {item.authorizationMessage}
                      </blockquote>
                    ) : null}
                    <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                      Solicitado <span className="mv-data">{formatWhen(item.authorizationRequestedAt) ?? "hace un momento"}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
