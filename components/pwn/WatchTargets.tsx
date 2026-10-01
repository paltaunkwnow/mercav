"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pwnFetch,
  readCreatedTarget,
  readTargets,
  type MonitoringTarget,
} from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls, pageWindow } from "@/components/pwn/ListControls";
import { focusRing, formatWhen, pwnCardClass, pwnFieldClass, pwnFieldLabelClass, pwnPanelClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnSectionHeading, pwnErrorTextClass } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { PwnSelect } from "@/components/pwn/PwnSelect";
import {
  MONITOR_AUTH_MESSAGE_MAX,
  canRequestMonitorAuthorization,
  monitorAuthBadge,
  monitorAuthHint,
} from "@/lib/pwn/monitor-authorization";

type TargetType = "email" | "domain";

const TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "email", label: "Correo" },
  { value: "domain", label: "Dominio" },
];

const TYPE_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const BADGE_CLASS: Record<string, string> = {
  ok: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold",
  waiting: "border-dashed border-[var(--color-border-gold)] bg-transparent text-gold",
  denied: "border-red-400/40 bg-red-400/10 text-red-200 [.light_&]:border-red-700/30 [.light_&]:text-red-800",
  pending: "border-dashed border-[var(--text-tertiary)] bg-transparent text-[var(--text-secondary)]",
};

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: MonitoringTarget[] };

function normalize(value: string, type: TargetType) {
  const trimmed = value.trim().toLowerCase();
  return type === "domain" ? trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "") : trimmed;
}

function validate(value: string, type: TargetType) {
  if (!value) return "Escribí un objetivo.";
  if (type === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254)) return "El correo no es válido.";
  if (type === "domain" && !DOMAIN_RE.test(value)) return "El dominio no es válido.";
  return null;
}

function statusRank(status: string) {
  if (status === "REQUESTED") return 0;
  if (status === "PENDING" || status === "DENIED") return 1;
  return 2;
}

export function WatchTargets({
  refresh = 0,
  seed = null,
}: {
  refresh?: number;
  seed?: { type: TargetType; query: string } | null;
}) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [target, setTarget] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("email");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [authNote, setAuthNote] = useState<Record<string, string>>({});
  const [authBusy, setAuthBusy] = useState<string | null>(null);
  const [authFlash, setAuthFlash] = useState<Record<string, { text: string; tone: "error" | "ok" }>>({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/monitoring", { signal });
    if (signal?.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      setStatus(response.reason === "disabled" ? { kind: "disabled" } : response.reason === "unauthorized" ? { kind: "unauthorized" } : { kind: "error", message: response.message });
      return;
    }
    setStatus({ kind: "ready", items: readTargets(response.data) });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  useEffect(() => {
    if (!seed?.query) return;
    setTargetType(seed.type);
    setTarget(seed.query);
  }, [seed]);

  async function createTarget() {
    const value = normalize(target, targetType);
    const error = validate(value, targetType);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setNotice(null);
    setSaving(true);
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "POST",
      body: JSON.stringify({ type: targetType, query: value }),
    });
    setSaving(false);
    if (!response.ok) {
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "disabled") setStatus({ kind: "disabled" });
      else setFormError(response.message);
      return;
    }
    const created = readCreatedTarget(response.data);
    setNotice(
      created.target?.verificationStatus === "VERIFIED"
        ? "Quedó en seguimiento. El patrullaje puede generar alertas."
        : created.verification?.message ?? "Ya podés consultarlo. El patrullaje espera autorización.",
    );
    setTarget("");
    await load();
  }

  async function requestAuthorization(item: MonitoringTarget) {
    setAuthBusy(item.id);
    setAuthFlash((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    const response = await pwnFetch("/api/pwn/monitoring/authorize", {
      method: "POST",
      body: JSON.stringify({ id: item.id, message: authNote[item.id]?.trim() || undefined }),
    });
    setAuthBusy(null);
    if (!response.ok) {
      if (response.reason === "unauthorized") {
        setStatus({ kind: "unauthorized" });
        return;
      }
      setAuthFlash((current) => ({
        ...current,
        [item.id]: { text: response.message, tone: "error" },
      }));
      return;
    }
    setAuthFlash((current) => ({
      ...current,
      [item.id]: { text: "Solicitud enviada. Un administrador la revisará.", tone: "ok" },
    }));
    await load();
  }

  async function setActive(item: MonitoringTarget, active: boolean) {
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "PATCH",
      body: JSON.stringify({ id: item.id, active }),
    });
    if (!response.ok) {
      setFormError(response.message);
      return;
    }
    await load();
  }

  async function removeTarget(item: MonitoringTarget) {
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "DELETE",
      body: JSON.stringify({ id: item.id }),
    });
    if (!response.ok) {
      setFormError(response.message);
      return;
    }
    await load();
  }

  const visible = useMemo(() => {
    if (status.kind !== "ready") return [];
    const q = query.trim().toLowerCase();
    const filtered = status.items.filter((item) => {
      if (!q) return true;
      return `${item.targetDisplay} ${item.targetLookup ?? ""} ${TYPE_LABEL[item.targetType] ?? item.targetType}`.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.targetDisplay.localeCompare(b.targetDisplay, "es");
      if (sort === "pending") return statusRank(a.verificationStatus) - statusRank(b.verificationStatus);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [status, query, sort]);

  const windowed = pageWindow(visible, page);

  return (
    <section className="space-y-6" aria-labelledby="watch-title">
      <PwnSectionHeading
        id="watch-title"
        kicker="Seguimiento"
        title="Objetivos que vigilás"
        lead="El correo de tu cuenta y cualquier dominio se siguen al añadirlos. Un correo distinto pide autorización solo para el patrullaje y las alertas; la consulta de arriba no espera."
      />

      {status.kind === "loading" ? <LoadingState label="Cargando objetivos…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Seguimiento no configurado" /> : null}
      {status.kind === "unauthorized" ? (
        <UnauthorizedState callbackPath="/pwn/exposure" description="Iniciá sesión para seguir correos y dominios y recibir alertas." />
      ) : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

      {status.kind === "ready" ? (
        <>
          <form
            className={`space-y-5 ${pwnPanelClass}`}
            onSubmit={(event) => {
              event.preventDefault();
              void createTarget();
            }}
          >
            <h3 className="mv-h3 text-lg">Añadir a seguimiento</h3>
            <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
              <div className="space-y-2">
                <label htmlFor="monitor-type" className={pwnFieldLabelClass}>
                  Tipo
                </label>
                <PwnSelect
                  id="monitor-type"
                  value={targetType}
                  onValueChange={(value) => {
                    setTargetType(value as TargetType);
                    if (value === "email") {
                      queueMicrotask(() => document.getElementById("monitor-target")?.focus());
                    }
                  }}
                  options={TYPE_OPTIONS}
                  aria-label="Tipo"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="monitor-target" className={pwnFieldLabelClass}>
                  {targetType === "domain" ? "Dominio" : "Dirección de correo"}
                </label>
                <input
                  id="monitor-target"
                  className={pwnFieldClass}
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder={targetType === "domain" ? "empresa.com" : "ana@empresa.com"}
                  type={targetType === "email" ? "email" : "text"}
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
              {targetType === "email"
                ? "Si no es el correo de esta cuenta, un administrador autoriza el patrullaje. La consulta de exposición no lo necesita."
                : "Los dominios se consultan y se patrullan al añadirlos."}
            </p>
            {formError ? (
              <p role="alert" className={pwnErrorTextClass}>
                {formError}
              </p>
            ) : null}
            <button type="submit" disabled={saving} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
              {saving ? "Guardando…" : "Seguir objetivo"}
            </button>
          </form>

          {notice ? <PwnNotice>{notice}</PwnNotice> : null}

          {status.items.length === 0 ? <EmptyState title="Todavía no hay objetivos en seguimiento" description="Después de consultar, podés sumar el correo o el dominio acá para recibir alertas." /> : null}
          {status.items.length > 0 ? (
            <>
              <ListControls
                query={query}
                onQuery={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                queryLabel="Buscar objetivo"
                sort={sort}
                onSort={(value) => {
                  setSort(value);
                  setPage(1);
                }}
                sortOptions={[
                  { value: "recent", label: "Más recientes" },
                  { value: "pending", label: "Pendientes primero" },
                  { value: "name", label: "Nombre" },
                ]}
                page={windowed.page}
                pages={windowed.pages}
                total={windowed.total}
                onPage={setPage}
              />
              {windowed.total === 0 ? <EmptyState title="Ningún objetivo coincide" /> : null}
              <ul className="space-y-3">
                {windowed.slice.map((item) => {
                  const verified = item.verificationStatus === "VERIFIED";
                  const badge = monitorAuthBadge(item.verificationStatus);
                  const hint = monitorAuthHint(item.verificationStatus, item.targetType);
                  const canRequest =
                    item.targetType === "EMAIL" && !verified && canRequestMonitorAuthorization(item.verificationStatus);
                  const flash = authFlash[item.id];
                  return (
                    <li key={item.id} className={`${pwnCardClass} ${verified ? "" : "border-dashed !border-[var(--color-border-gold)]"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-tertiary)]">{TYPE_LABEL[item.targetType] ?? item.targetType}</p>
                          <h3 className="mv-data mt-1 break-all text-base text-[var(--text-primary)] md:text-lg">{item.targetLookup ?? item.targetDisplay}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${BADGE_CLASS[badge.tone]}`}
                          >
                            {badge.label}
                          </span>
                          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--mv-hairline-strong)] px-2.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-gold" : "bg-[var(--text-tertiary)]"}`} />
                            {item.active ? "Activo" : "Pausado"}
                          </span>
                        </div>
                      </div>
                      {hint ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{hint}</p> : null}
                      <MetaGrid className="lg:grid-cols-2">
                        <Meta label="Creado">{formatWhen(item.createdAt) ?? "No indicado"}</Meta>
                        <Meta label={verified ? "En seguimiento" : "Autorización"}>
                          {verified
                            ? formatWhen(item.verifiedAt) ?? "Activo"
                            : formatWhen(item.authorizationRequestedAt) ?? "Sin solicitar"}
                        </Meta>
                      </MetaGrid>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className={buttonClass("secondary", "sm", "flex-1 sm:flex-none")} onClick={() => void setActive(item, !item.active)}>
                          {item.active ? "Pausar" : "Reanudar"}
                        </button>
                        <button
                          type="button"
                          className={`mv-btn mv-btn-sm mv-btn-ghost flex-1 text-red-300 sm:flex-none [.light_&]:text-red-700 ${focusRing}`}
                          onClick={() => void removeTarget(item)}
                        >
                          Eliminar
                        </button>
                      </div>
                      {canRequest ? (
                        <form
                          className="mt-5 space-y-3 border-t border-[var(--mv-hairline)] pt-5"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void requestAuthorization(item);
                          }}
                        >
                          <div className="space-y-2">
                            <label htmlFor={`auth-note-${item.id}`} className={pwnFieldLabelClass}>
                              Nota para el administrador (opcional)
                            </label>
                            <textarea
                              id={`auth-note-${item.id}`}
                              className={`${pwnFieldClass} h-auto min-h-[5.5rem] py-3 leading-relaxed`}
                              value={authNote[item.id] ?? ""}
                              maxLength={MONITOR_AUTH_MESSAGE_MAX}
                              onChange={(event) => setAuthNote((current) => ({ ...current, [item.id]: event.target.value }))}
                              placeholder="Por qué necesitás patrullar este correo"
                            />
                          </div>
                          <button type="submit" disabled={authBusy === item.id} className={buttonClass("primary", "sm", "w-full sm:w-auto")}>
                            {authBusy === item.id ? "Enviando…" : "Solicitar patrullaje"}
                          </button>
                        </form>
                      ) : null}
                      {flash ? (
                        <div className="mt-3">
                          <PwnNotice tone={flash.tone === "error" ? "error" : "ok"}>{flash.text}</PwnNotice>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
// creado por pato dev y askforvini
