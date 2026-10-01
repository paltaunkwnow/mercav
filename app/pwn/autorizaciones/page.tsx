"use client";

import { useCallback, useEffect, useState } from "react";
import { pwnFetch, readAuthQueue, type MonitorAuthRequest } from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { Button } from "@/components/ui/button";
import { focusRing, formatWhen } from "@/components/pwn/format";

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
    <FadeIn className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Autorizaciones</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
          Revisa quién pide patrullar un correo que no es el de su cuenta. La consulta de exposición no espera esta autorización.
        </p>
      </header>

      {status.kind === "loading" ? <LoadingState label="Cargando solicitudes…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Pwn no está activado" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/autorizaciones" /> : null}
      {status.kind === "forbidden" ? (
        <EmptyState title="Solo administración" description="Las autorizaciones de consulta están reservadas a cuentas con rol ADMIN." />
      ) : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

      {status.kind === "ready" ? (
        <>
          {flash ? (
            <p role="status" className="text-sm text-gold">
              {flash}
            </p>
          ) : null}
          {status.items.length === 0 ? (
            <EmptyState title="No hay solicitudes pendientes" description="Cuando alguien pida consultar un correo o un dominio, aparecerá aquí." />
          ) : (
            <ul className="space-y-3">
              {status.items.map((item) => {
                const display = item.targetLookup ?? item.targetDisplay;
                return (
                  <li key={item.id} className="rounded-3xl border border-gold/30 bg-bg-secondary/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-400">{TYPE_LABEL[item.targetType] ?? item.targetType}</p>
                        <h2 className="mt-1 font-mono text-lg text-white">{display}</h2>
                        <p className="mt-2 text-sm text-gray-300">
                          Solicitado por {ownerLabel(item)}
                          {item.owner.email && item.owner.name ? ` · ${item.owner.email}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void decide(item, "approve")}
                          className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}
                        >
                          {busy === `${item.id}:approve` ? "Autorizando…" : "Autorizar"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() => void decide(item, "deny")}
                          className={`rounded-xl border-red-400/30 text-red-200 ${focusRing}`}
                        >
                          {busy === `${item.id}:deny` ? "Rechazando…" : "Rechazar"}
                        </Button>
                      </div>
                    </div>
                    {item.authorizationMessage ? (
                      <p className="mt-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-gray-200">{item.authorizationMessage}</p>
                    ) : null}
                    <p className="mt-3 text-xs text-gray-500">Solicitado {formatWhen(item.authorizationRequestedAt) ?? "hace un momento"}</p>
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
