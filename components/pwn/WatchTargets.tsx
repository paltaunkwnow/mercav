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
import { Button } from "@/components/ui/button";
import { focusRing, formatWhen, pwnFieldClass, pwnFieldLabelClass, pwnPanelClass } from "@/components/pwn/format";
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
  ok: "border-gold/40 bg-gold/10 text-gold",
  waiting: "border-gold/50 bg-gold/5 text-gold",
  denied: "border-red-400/40 bg-red-400/10 text-red-200",
  pending: "border-dashed border-gray-400 bg-transparent text-gray-200",
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
  if (!value) return "Escribe un objetivo.";
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
        : created.verification?.message ?? "Puedes consultarlo ya. El patrullaje espera autorización.",
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
      <header>
        <h2 id="watch-title" className="font-display text-3xl font-black tracking-tight text-white">
          Seguimiento
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
          El correo de tu cuenta y cualquier dominio se siguen al añadirlos. Un correo distinto pide autorización solo para el patrullaje y las alertas; la consulta de arriba no espera.
        </p>
      </header>

      {status.kind === "loading" ? <LoadingState label="Cargando objetivos…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Seguimiento no configurado" /> : null}
      {status.kind === "unauthorized" ? (
        <UnauthorizedState callbackPath="/pwn/exposure" description="Inicia sesión para seguir correos y dominios y recibir alertas." />
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
            <h3 className="font-display text-2xl text-white">Añadir a seguimiento</h3>
            <div className="grid gap-4 md:grid-cols-2">
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
            <p className="text-xs text-gray-500">
              {targetType === "email"
                ? "Si no es el correo de esta cuenta, un administrador autoriza el patrullaje. La consulta de exposición no lo necesita."
                : "Los dominios se consultan y se patrullan al añadirlos."}
            </p>
            {formError ? (
              <p role="alert" className="text-sm text-red-200">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={saving} className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
              {saving ? "Guardando…" : "Seguir objetivo"}
            </Button>
          </form>

          {notice ? (
            <p role="status" className="text-sm text-gold">
              {notice}
            </p>
          ) : null}

          {status.items.length === 0 ? <EmptyState title="Todavía no hay objetivos en seguimiento" description="Después de consultar, puedes añadir el correo o el dominio aquí para alertas." /> : null}
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
                    <li key={item.id} className={`rounded-3xl border bg-bg-secondary/70 p-5 ${verified ? "border-white/5" : "border-dashed border-gold/30"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-mono text-lg text-white">{item.targetLookup ?? item.targetDisplay}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${BADGE_CLASS[badge.tone]}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs uppercase tracking-[0.14em] text-gray-400">{item.active ? "Activo" : "Pausado"}</span>
                          <button
                            type="button"
                            className={`rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-200 ${focusRing}`}
                            onClick={() => void setActive(item, !item.active)}
                          >
                            {item.active ? "Pausar" : "Reanudar"}
                          </button>
                          <button
                            type="button"
                            className={`rounded-full border border-red-400/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-200 ${focusRing}`}
                            onClick={() => void removeTarget(item)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{TYPE_LABEL[item.targetType] ?? item.targetType}</p>
                      {hint ? <p className="mt-2 text-sm text-gray-300">{hint}</p> : null}
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-gray-500">Creado</dt>
                          <dd className="text-white">{formatWhen(item.createdAt) ?? "No indicado"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">{verified ? "En seguimiento" : "Autorización"}</dt>
                          <dd className="text-white">
                            {verified
                              ? formatWhen(item.verifiedAt) ?? "Activo"
                              : formatWhen(item.authorizationRequestedAt) ?? "Sin solicitar"}
                          </dd>
                        </div>
                      </dl>
                      {canRequest ? (
                        <form
                          className="mt-4 space-y-3"
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
                              className={`${pwnFieldClass} h-auto min-h-[4.5rem] py-2.5`}
                              value={authNote[item.id] ?? ""}
                              maxLength={MONITOR_AUTH_MESSAGE_MAX}
                              onChange={(event) => setAuthNote((current) => ({ ...current, [item.id]: event.target.value }))}
                              placeholder="Por qué necesitas patrullar este correo"
                            />
                          </div>
                          <Button type="submit" disabled={authBusy === item.id} className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
                            {authBusy === item.id ? "Enviando…" : "Solicitar patrullaje"}
                          </Button>
                        </form>
                      ) : null}
                      {flash ? (
                        <p role={flash.tone === "error" ? "alert" : "status"} className={`mt-3 text-sm ${flash.tone === "error" ? "text-red-200" : "text-gold"}`}>
                          {flash.text}
                        </p>
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
