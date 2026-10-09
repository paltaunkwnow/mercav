"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pwnFetch, readAuthQueue, readAuthQueueMeta, type MonitorAuthRequest } from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { formatWhen, pwnCardClass, pwnInsetClass, pwnTagClass, pwnWarnToneClass } from "@/components/pwn/format";
import { PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { Lock } from "@/components/icons";

const TYPE_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: MonitorAuthRequest[]; mailerReady: boolean };

/** Un AbortController por tipo de pedido: el nuevo cancela al anterior y al desmontar se cancela todo. */
function useAbortSlot() {
  const ref = useRef<AbortController | null>(null);
  useEffect(() => () => ref.current?.abort(), []);
  return useCallback(() => {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller.signal;
  }, []);
}

function ownerLabel(item: MonitorAuthRequest) {
  return item.owner.name || item.owner.username || item.owner.email || "Usuario sin nombre";
}

/** De qué buzón se trata: el admin no ve el correo, solo si es el de la cuenta del solicitante. */
function mailboxKind(item: MonitorAuthRequest, owner: string) {
  if (item.isOwnerAccountEmail) {
    return item.owner.emailConfirmed
      ? `Es el correo de la cuenta de ${owner}.`
      : `Es el correo con el que se registró ${owner}, pero la cuenta nunca confirmó ese buzón.`;
  }
  return `Es otro buzón, distinto del correo de la cuenta de ${owner}.`;
}

export default function AutorizacionesPage() {
  const session = usePwnSession();
  const canLoad = session.status === "authenticated" && session.isAdmin;
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const nextLoadSignal = useAbortSlot();
  const nextDecisionSignal = useAbortSlot();

  /** quiet: refresca la cola sin volver al estado de carga (después de decidir). */
  const load = useCallback(
    async (quiet = false) => {
      const signal = nextLoadSignal();
      if (!quiet) setStatus({ kind: "loading" });
      const response = await pwnFetch("/api/pwn/monitoring/authorize", { signal });
      if (signal.aborted || (!response.ok && response.reason === "aborted")) return;
      if (!response.ok) {
        if (response.reason === "disabled") setStatus({ kind: "disabled" });
        else if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
        else if (response.reason === "forbidden") setStatus({ kind: "forbidden" });
        else setStatus({ kind: "error", message: response.message });
        return;
      }
      setStatus({
        kind: "ready",
        items: readAuthQueue(response.data),
        mailerReady: readAuthQueueMeta(response.data).mailerReady,
      });
    },
    [nextLoadSignal],
  );

  // Sin sesión de administración no se pide nada.
  useEffect(() => {
    if (canLoad) void load();
  }, [canLoad, load]);

  async function decide(item: MonitorAuthRequest, decision: "approve" | "deny") {
    const display = item.targetDisplay;
    const owner = ownerLabel(item);
    setBusy(`${item.id}:${decision}`);
    setFlash(null);
    const signal = nextDecisionSignal();
    const response = await pwnFetch("/api/pwn/monitoring/authorize", {
      method: "PATCH",
      body: JSON.stringify({ id: item.id, decision }),
      signal,
    });
    if (signal.aborted) return;
    setBusy(null);
    setConfirming(null);
    if (!response.ok) {
      if (response.reason === "aborted") return;
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "forbidden") setStatus({ kind: "forbidden" });
      else setFlash({ tone: "error", text: response.message || "No se pudo registrar la decisión. Probá de nuevo." });
      return;
    }
    setFlash({
      tone: "ok",
      text:
        decision === "approve"
          ? `Autorizaste ${display} para ${owner}. La decisión quedó registrada con tu usuario.`
          : `Rechazaste ${display} para ${owner}.`,
    });
    // Sale de la cola ya y se confirma con la API.
    setStatus((prev) => (prev.kind === "ready" ? { ...prev, items: prev.items.filter((entry) => entry.id !== item.id) } : prev));
    void load(true);
  }

  const adminOnly = (
    <EmptyState
      icon={<Lock className="h-5 w-5" aria-hidden />}
      title="Solo administración"
      description="Las autorizaciones de consulta están reservadas a cuentas con rol ADMIN."
    />
  );

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Autorizaciones"
        lead="Pedidos para seguir un correo cuyo buzón Mercav no pudo confirmar. No ves el correo completo: solo quién lo pide y por qué. La consulta de exposición no espera esta autorización."
      />

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" ? <UnauthorizedState callbackPath="/pwn/autorizaciones" /> : null}
      {session.status === "authenticated" && !session.isAdmin ? adminOnly : null}

      {canLoad ? (
        <>
          {status.kind === "loading" ? <LoadingState label="Cargando solicitudes…" /> : null}
          {status.kind === "disabled" ? <DisabledState title="Pwn no está activado" /> : null}
          {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/autorizaciones" /> : null}
          {status.kind === "forbidden" ? adminOnly : null}
          {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

          {status.kind === "ready" ? (
            <>
              {status.mailerReady ? (
                <PwnNotice tone="neutral">
                  Este entorno ya envía correos: las solicitudes nuevas se resuelven con el enlace que llega al buzón, sin pasar por acá.
                  Las que ves abajo son anteriores.
                </PwnNotice>
              ) : null}
              {flash ? <PwnNotice tone={flash.tone}>{flash.text}</PwnNotice> : null}
              {status.items.length === 0 ? (
                <EmptyState title="No hay solicitudes pendientes" description="Cuando alguien pida seguir un correo sin confirmar, va a aparecer acá." />
              ) : (
                <ul className="space-y-3">
                  {status.items.map((item) => {
                    const display = item.targetDisplay;
                    const owner = ownerLabel(item);
                    const titleId = `pwn-auth-${item.id}`;
                    const isConfirming = confirming === item.id;
                    return (
                      <li key={item.id} className={pwnCardClass}>
                        <div className="min-w-0">
                          <h2 id={titleId} className="mv-data break-all text-base font-semibold text-[var(--text-primary)] md:text-lg">
                            {display}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={pwnTagClass}>{TYPE_LABEL[item.targetType] ?? item.targetType}</span>
                            <span className={pwnTagClass}>{item.isOwnerAccountEmail ? "Correo de su cuenta" : "Otro buzón"}</span>
                          </div>
                          <p className="mt-3 text-sm text-[var(--text-secondary)]">
                            Lo pide <span className="font-medium text-[var(--text-primary)]">{owner}</span>
                            {item.owner.email && item.owner.email !== owner ? (
                              <>
                                {" · "}
                                <span className="mv-data break-all">{item.owner.email}</span>
                              </>
                            ) : null}
                            {item.owner.emailConfirmed ? " · cuenta con correo confirmado" : " · cuenta sin correo confirmado"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{mailboxKind(item, owner)}</p>
                        </div>

                        <div className={`${pwnInsetClass} mt-4 space-y-2 text-sm text-[var(--text-primary)]`}>
                          <p>
                            <span className="font-semibold">Qué aprobás:</span> que {owner} vea el detalle de filtraciones y reciba alertas de{" "}
                            <span className="mv-data break-all">{display}</span>.
                          </p>
                          <p className="text-[var(--text-secondary)]">
                            {status.mailerReady
                              ? "Mercav no comprobó que ese buzón sea suyo (la solicitud se hizo cuando este entorno no enviaba correos de confirmación)"
                              : "Mercav no pudo comprobar que ese buzón sea suyo (este entorno no envía correos de confirmación)"}
                            {/* Si es el correo de su cuenta, el admin lo ve en los datos de la cuenta: no prometemos que esté oculto. */}
                            {item.isOwnerAccountEmail
                              ? "; registrarse con un correo no prueba que el buzón sea de uno."
                              : " y vos tampoco ves el correo completo."}{" "}
                            Aprobalo solo si conocés a la persona y el motivo. La decisión queda registrada con tu usuario.
                          </p>
                        </div>

                        {item.authorizationMessage ? (
                          <blockquote className={`${pwnInsetClass} mt-3 bg-[var(--mv-panel)] text-sm text-[var(--text-primary)]`}>
                            <span className="mb-1 block text-xs text-[var(--text-tertiary)]">Motivo que escribió {owner}</span>
                            {item.authorizationMessage}
                          </blockquote>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--text-tertiary)]">No escribió un motivo.</p>
                        )}

                        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-4 md:flex-row md:items-center md:justify-between">
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Solicitado <span className="mv-data">{formatWhen(item.authorizationRequestedAt) ?? "sin fecha registrada"}</span>
                          </p>
                          {isConfirming ? (
                            <div
                              role="group"
                              aria-label={`Confirmación pendiente para ${display}`}
                              className={`${pwnInsetClass} ${pwnWarnToneClass} flex flex-col gap-3 md:flex-row md:items-center`}
                            >
                              <p className="text-sm text-[var(--text-primary)]">¿Autorizás a {owner} sin prueba del buzón?</p>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                  type="button"
                                  disabled={busy !== null}
                                  onClick={() => void decide(item, "approve")}
                                  aria-label={`Confirmar autorización de ${display} para ${owner}`}
                                  className={buttonClass("primary", "sm", "min-h-11 w-full sm:w-auto")}
                                >
                                  {busy === `${item.id}:approve` ? "Autorizando…" : "Confirmar autorización"}
                                </button>
                                <button
                                  type="button"
                                  // El botón Autorizar desaparece: el foco queda en la salida segura.
                                  autoFocus
                                  disabled={busy === `${item.id}:approve`}
                                  onClick={() => setConfirming(null)}
                                  aria-label={`Cancelar la autorización de ${display} para ${owner}`}
                                  className={buttonClass("ghost", "sm", "min-h-11 w-full sm:w-auto")}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
                              <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => {
                                  setConfirming(item.id);
                                  setFlash(null);
                                }}
                                aria-label={`Autorizar ${display} para ${owner}`}
                                className={buttonClass("primary", "sm", "min-h-11 w-full sm:w-auto")}
                              >
                                Autorizar
                              </button>
                              <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => void decide(item, "deny")}
                                aria-label={`Rechazar ${display} para ${owner}`}
                                className={buttonClass("ghost", "sm", "min-h-11 w-full text-[var(--p-alert)] sm:w-auto")}
                              >
                                {busy === `${item.id}:deny` ? "Rechazando…" : "Rechazar"}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
