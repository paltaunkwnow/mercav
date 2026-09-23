"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pwnFetch,
  readCreatedTarget,
  readTargets,
  readVerifiedTarget,
  type MonitoringTarget,
  type TargetVerification,
} from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls, pageWindow } from "@/components/pwn/ListControls";
import { FadeIn } from "@/components/pwn/PwnShell";
import { Button } from "@/components/ui/button";
import { focusRing, formatWhen } from "@/components/pwn/format";

type TargetType = "email" | "domain";

const TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "domain", label: "Dominio" },
  { value: "email", label: "Correo" },
];

const TYPE_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: MonitoringTarget[] };

type Instructions = { targetId: string; display: string; verification: TargetVerification };

type VerifyState = { domain: string; pending: boolean; message: string | null; tone: "error" | "ok" | null };

const inputClass = `h-11 w-full rounded-xl border border-white/10 bg-bg-tertiary/70 px-3 text-sm text-white ${focusRing}`;

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

export default function MonitorPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [target, setTarget] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("domain");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [knownDomains, setKnownDomains] = useState<Record<string, string>>({});
  const [verify, setVerify] = useState<Record<string, VerifyState>>({});
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
  }, [load]);

  async function createTarget() {
    const value = normalize(target, targetType);
    const error = validate(value, targetType);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
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
    if (created.target) {
      const id = created.target.id;
      if (targetType === "domain") setKnownDomains((current) => ({ ...current, [id]: value }));
      setInstructions(created.verification ? { targetId: id, display: created.target.targetDisplay, verification: created.verification } : null);
    }
    setTarget("");
    await load();
  }

  function verifyStateFor(item: MonitoringTarget): VerifyState {
    return verify[item.id] ?? { domain: item.targetLookup ?? knownDomains[item.id] ?? "", pending: false, message: null, tone: null };
  }

  function patchVerify(id: string, base: VerifyState, patch: Partial<VerifyState>) {
    setVerify((current) => ({ ...current, [id]: { ...(current[id] ?? base), ...patch } }));
  }

  async function verifyTarget(item: MonitoringTarget) {
    const base = verifyStateFor(item);
    const domain = normalize(base.domain, "domain");
    if (!DOMAIN_RE.test(domain)) {
      patchVerify(item.id, base, { message: "Escribe el dominio completo que registraste.", tone: "error" });
      return;
    }
    patchVerify(item.id, base, { pending: true, message: null, tone: null });
    const response = await pwnFetch("/api/pwn/monitoring/verify", {
      method: "POST",
      body: JSON.stringify({ targetId: item.id, domain }),
    });
    if (!response.ok) {
      if (response.reason === "unauthorized") {
        setStatus({ kind: "unauthorized" });
        return;
      }
      const message = response.reason === "disabled" ? "La verificación no está configurada." : response.message;
      patchVerify(item.id, base, { pending: false, message, tone: "error" });
      return;
    }
    const verified = readVerifiedTarget(response.data);
    patchVerify(item.id, base, { pending: false, message: "Dominio verificado.", tone: "ok" });
    if (instructions?.targetId === item.id) setInstructions(null);
    setStatus((current) => {
      if (current.kind !== "ready") return current;
      return {
        kind: "ready",
        items: current.items.map((row) =>
          row.id === item.id ? { ...row, verificationStatus: verified?.verificationStatus ?? "VERIFIED", verifiedAt: verified?.verifiedAt ?? row.verifiedAt } : row,
        ),
      };
    });
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
      return `${item.targetDisplay} ${TYPE_LABEL[item.targetType] ?? item.targetType}`.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.targetDisplay.localeCompare(b.targetDisplay, "es");
      if (sort === "pending") return Number(a.verificationStatus === "VERIFIED") - Number(b.verificationStatus === "VERIFIED");
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [status, query, sort]);

  const windowed = pageWindow(visible, page);

  return (
    <FadeIn className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Monitoreo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
          Añade el correo de tu cuenta o un dominio que controles. Los dominios se verifican con un registro DNS TXT antes de consultarlos o generar alertas.
        </p>
      </header>

      {status.kind === "loading" ? <LoadingState label="Cargando objetivos…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Monitoreo no configurado" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/monitor" description="Inicia sesión para ver y crear objetivos de monitoreo." /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

      {status.kind === "ready" ? (
        <>
          <form
            className="space-y-5 rounded-3xl border border-white/5 bg-bg-secondary/70 p-5 md:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void createTarget();
            }}
          >
            <h2 className="font-display text-2xl text-white">Nuevo objetivo</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="monitor-type" className="block text-sm font-medium text-white">
                  Tipo
                </label>
                <select id="monitor-type" className={inputClass} value={targetType} onChange={(event) => setTargetType(event.target.value as TargetType)}>
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="monitor-target" className="block text-sm font-medium text-white">
                  {targetType === "domain" ? "Dominio" : "Correo"}
                </label>
                <input
                  id="monitor-target"
                  className={inputClass}
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder={targetType === "domain" ? "empresa.com" : "ana@empresa.com"}
                  type={targetType === "email" ? "email" : "text"}
                  autoComplete="off"
                />
              </div>
            </div>
            {targetType === "email" ? <p className="text-xs text-gray-500">Solo se verifica automáticamente el correo de tu propia cuenta. Otros correos quedan pendientes y no se consultan.</p> : null}
            {formError ? (
              <p role="alert" className="text-sm text-red-200">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={saving} className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
              {saving ? "Guardando…" : "Crear objetivo"}
            </Button>
          </form>

          {instructions ? <VerificationPanel instructions={instructions} onDismiss={() => setInstructions(null)} /> : null}

          {status.items.length === 0 ? <EmptyState title="Todavía no hay objetivos" description="Cuando crees uno, quedará listado aquí." /> : null}
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
                  const canVerify = !verified && item.targetType === "DOMAIN" && item.active;
                  const v = verifyStateFor(item);
                  return (
                    <li key={item.id} className={`rounded-3xl border bg-bg-secondary/70 p-5 ${verified ? "border-white/5" : "border-dashed border-gold/30"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-mono text-lg text-white">{item.targetLookup ?? item.targetDisplay}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              verified ? "border-gold/40 bg-gold/10 text-gold" : "border-dashed border-gray-400 bg-transparent text-gray-200"
                            }`}
                          >
                            {verified ? "Verificado" : "Pendiente de verificación"}
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
                      {!verified ? (
                        <p className="mt-2 text-sm text-gray-300">
                          {item.targetType === "DOMAIN"
                            ? "No se consultará ni generará alertas hasta verificar el registro DNS TXT."
                            : "Este objetivo queda pendiente y no se consultará."}
                        </p>
                      ) : null}
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-gray-500">Creado</dt>
                          <dd className="text-white">{formatWhen(item.createdAt) ?? "No indicado"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Verificado</dt>
                          <dd className="text-white">{formatWhen(item.verifiedAt) ?? "Sin verificar"}</dd>
                        </div>
                      </dl>
                      {canVerify ? (
                        <form
                          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void verifyTarget(item);
                          }}
                        >
                          <div className="flex-1 space-y-2">
                            <label htmlFor={`verify-${item.id}`} className="block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                              Dominio a verificar
                            </label>
                            <input
                              id={`verify-${item.id}`}
                              className={inputClass}
                              value={v.domain}
                              onChange={(event) => patchVerify(item.id, v, { domain: event.target.value, message: null, tone: null })}
                              placeholder="empresa.com"
                              autoComplete="off"
                            />
                          </div>
                          <Button type="submit" variant="outline" disabled={v.pending} className={`rounded-xl border-white/10 text-white ${focusRing}`}>
                            {v.pending ? "Verificando…" : "Verificar DNS"}
                          </Button>
                        </form>
                      ) : null}
                      {v.message ? (
                        <p role={v.tone === "error" ? "alert" : "status"} className={`mt-3 text-sm ${v.tone === "error" ? "text-red-200" : "text-gold"}`}>
                          {v.message}
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
    </FadeIn>
  );
}

function VerificationPanel({ instructions, onDismiss }: { instructions: Instructions; onDismiss: () => void }) {
  const { verification } = instructions;
  return (
    <section aria-labelledby="verification-title" className="rounded-3xl border border-gold/30 bg-bg-secondary/80 p-5 md:p-6">
      <h2 id="verification-title" className="font-display text-2xl text-white">
        Verifica {instructions.display}
      </h2>
      {verification.method === "DNS_TXT" ? (
        <>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
            Crea este registro TXT en el DNS del dominio y pulsa «Verificar DNS» en el objetivo. El valor se muestra solo una vez: cópialo ahora. Si lo pierdes, vuelve a registrar el dominio para obtener uno nuevo.
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Tipo</dt>
              <dd className="font-mono text-white">TXT</dd>
            </div>
            <div>
              <dt className="text-gray-500">Nombre</dt>
              <dd className="break-all font-mono text-white">{verification.recordName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Valor</dt>
              <dd className="break-all font-mono text-gold">{verification.recordValue}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">{verification.message || "Este objetivo queda pendiente."}</p>
      )}
      <Button type="button" variant="outline" onClick={onDismiss} className={`mt-4 rounded-xl border-white/10 text-white ${focusRing}`}>
        Entendido
      </Button>
    </section>
  );
}
