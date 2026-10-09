"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  pwnFetch,
  readAlerts,
  readOrganizations,
  readTargets,
  type AlertView,
  type MonitoringTarget,
  type OrganizationView,
  type PwnResult,
} from "@/components/pwn/api";
import { StatCard } from "@/components/pwn/StatCard";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { PwnSelect } from "@/components/pwn/PwnSelect";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import {
  formatWhen,
  pwnAlertToneClass,
  pwnCardClass,
  pwnFieldClass,
  pwnFieldLabelClass,
  pwnIconTileClass,
  pwnInsetClass,
  pwnPanelClass,
} from "@/components/pwn/format";
import { PwnNotice, PwnPageHeader, pwnErrorTextClass } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { Building2, Pencil, Trash2, X } from "@/components/icons";

const RECENT_ALERTS = 50;
// Mismo patrón que valida la API.
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready" };

type Draft = { id: string; name: string; domain: string; error: string | null };

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

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

function checkOrg(name: string, domain: string): string | null {
  if (name.length < 2) return "El nombre necesita al menos 2 caracteres.";
  if (name.length > 120) return "El nombre admite hasta 120 caracteres.";
  if (domain && !DOMAIN_RE.test(domain)) return "El dominio no es válido. Probá con algo como empresa.com.";
  return null;
}

function sortOrgs(list: OrganizationView[]) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

// La API devuelve una sola organización; readOrganizations espera una lista.
function readOneOrg(body: unknown): OrganizationView | null {
  const data = body && typeof body === "object" ? (body as { data?: unknown }).data : null;
  return readOrganizations({ data: [data] })[0] ?? null;
}

function targetState(target: MonitoringTarget): string {
  if (target.verificationStatus === "VERIFIED") return target.active ? "Verificado" : "Verificado · en pausa";
  if (target.verificationStatus === "REQUESTED") return "Esperando autorización";
  if (target.verificationStatus === "DENIED") return "Autorización rechazada";
  return "Sin verificar";
}

export default function OrganizationsPage() {
  const session = usePwnSession();
  const authenticated = session.status === "authenticated";
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [orgs, setOrgs] = useState<OrganizationView[]>([]);
  const [targets, setTargets] = useState<MonitoringTarget[]>([]);
  const [alerts, setAlerts] = useState<AlertView[]>([]);
  const [targetsNote, setTargetsNote] = useState<string | null>(null);
  const [alertsNote, setAlertsNote] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // Alta
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Acciones sobre cada organización
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});
  const [assignChoice, setAssignChoice] = useState<Record<string, string>>({});

  const nextLoadSignal = useAbortSlot();
  const nextCreateSignal = useAbortSlot();
  const nextActionSignal = useAbortSlot();

  const load = useCallback(async () => {
    const signal = nextLoadSignal();
    setStatus({ kind: "loading" });
    const [orgsRes, targetsRes, alertsRes] = await Promise.all([
      pwnFetch("/api/pwn/organizations", { signal }),
      pwnFetch("/api/pwn/monitoring", { signal }),
      pwnFetch(`/api/pwn/alerts?page=1&limit=${RECENT_ALERTS}`, { signal }),
    ]);
    if (signal.aborted) return;
    const results = [orgsRes, targetsRes, alertsRes];
    if (results.some((res) => !res.ok && res.reason === "unauthorized")) {
      setStatus({ kind: "unauthorized" });
      return;
    }
    if (!orgsRes.ok) {
      setStatus(orgsRes.reason === "disabled" ? { kind: "disabled" } : { kind: "error", message: orgsRes.message });
      return;
    }
    setOrgs(readOrganizations(orgsRes.data));
    setTargets(targetsRes.ok ? readTargets(targetsRes.data) : []);
    setTargetsNote(targetsRes.ok ? null : targetsRes.message || "No se pudieron cargar tus objetivos.");
    setAlerts(alertsRes.ok ? readAlerts(alertsRes.data).items : []);
    setAlertsNote(
      alertsRes.ok
        ? null
        : alertsRes.reason === "disabled"
          ? "Las alertas no están configuradas en este entorno."
          : alertsRes.message || "No se pudieron cargar las alertas.",
    );
    setStatus({ kind: "ready" });
  }, [nextLoadSignal]);

  // Sin sesión no se pide nada.
  useEffect(() => {
    if (authenticated) void load();
  }, [authenticated, load]);

  function clearOrgError(orgId: string) {
    setOrgErrors((prev) => {
      if (!(orgId in prev)) return prev;
      const next = { ...prev };
      delete next[orgId];
      return next;
    });
  }

  /** Muestra el error de una acción en la tarjeta de la organización. */
  function reportFailure(orgId: string, result: PwnResult<unknown>, fallback: string) {
    if (result.ok || result.reason === "aborted") return;
    if (result.reason === "unauthorized") {
      setStatus({ kind: "unauthorized" });
      return;
    }
    setOrgErrors((prev) => ({ ...prev, [orgId]: result.message || fallback }));
  }

  async function createOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const cleanDomain = normalizeDomain(domain);
    const problem = checkOrg(trimmed, cleanDomain);
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError(null);
    setFlash(null);
    const signal = nextCreateSignal();
    const response = await pwnFetch("/api/pwn/organizations", {
      method: "POST",
      body: JSON.stringify({ name: trimmed, ...(cleanDomain ? { domain: cleanDomain } : {}) }),
      signal,
    });
    if (signal.aborted) return;
    setSaving(false);
    if (!response.ok) {
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else setFormError(response.message || "No se pudo crear la organización.");
      return;
    }
    setName("");
    setDomain("");
    const created = readOneOrg(response.data);
    if (!created || status.kind !== "ready") {
      void load();
      return;
    }
    setOrgs((prev) => sortOrgs([...prev.filter((org) => org.id !== created.id), created]));
    setFlash(`Creaste ${created.name}. Asignale objetivos desde su tarjeta.`);
  }

  function startEdit(org: OrganizationView) {
    setDraft({ id: org.id, name: org.name, domain: org.domain ?? "", error: null });
    setConfirmDelete(null);
    clearOrgError(org.id);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>, org: OrganizationView) {
    event.preventDefault();
    if (!draft) return;
    const trimmed = draft.name.trim();
    const cleanDomain = normalizeDomain(draft.domain);
    const problem = checkOrg(trimmed, cleanDomain);
    if (problem) {
      setDraft({ ...draft, error: problem });
      return;
    }
    setBusy(`${org.id}:save`);
    setFlash(null);
    setDraft({ ...draft, error: null });
    const signal = nextActionSignal();
    const response = await pwnFetch("/api/pwn/organizations", {
      method: "PATCH",
      body: JSON.stringify({ id: org.id, name: trimmed, domain: cleanDomain || null }),
      signal,
    });
    if (signal.aborted) return;
    setBusy(null);
    if (!response.ok) {
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else setDraft((prev) => (prev ? { ...prev, error: response.message || "No se pudieron guardar los cambios." } : prev));
      return;
    }
    const saved = readOneOrg(response.data);
    setOrgs((prev) =>
      sortOrgs(
        prev.map((item) =>
          item.id === org.id ? { ...item, name: saved?.name ?? trimmed, domain: saved ? saved.domain : cleanDomain || null } : item,
        ),
      ),
    );
    setDraft(null);
    setFlash(`Guardaste los cambios de ${saved?.name ?? trimmed}.`);
  }

  async function removeOrg(org: OrganizationView) {
    setBusy(`${org.id}:delete`);
    setFlash(null);
    clearOrgError(org.id);
    const signal = nextActionSignal();
    const response = await pwnFetch("/api/pwn/organizations", {
      method: "DELETE",
      body: JSON.stringify({ id: org.id }),
      signal,
    });
    if (signal.aborted) return;
    setBusy(null);
    if (!response.ok) {
      reportFailure(org.id, response, "No se pudo borrar la organización.");
      return;
    }
    setOrgs((prev) => prev.filter((item) => item.id !== org.id));
    setTargets((prev) => prev.map((target) => (target.organizationId === org.id ? { ...target, organizationId: null } : target)));
    setConfirmDelete(null);
    setFlash(`Borraste ${org.name}. Sus objetivos e informes quedaron sin organización.`);
  }

  /** Asigna un objetivo a la organización (o lo quita con null). */
  async function moveTarget(target: MonitoringTarget, org: OrganizationView, organizationId: string | null) {
    setBusy(`${target.id}:move`);
    setFlash(null);
    clearOrgError(org.id);
    const signal = nextActionSignal();
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "PATCH",
      body: JSON.stringify({ id: target.id, organizationId }),
      signal,
    });
    if (signal.aborted) return;
    setBusy(null);
    if (!response.ok) {
      reportFailure(org.id, response, organizationId ? "No se pudo asignar el objetivo." : "No se pudo quitar el objetivo.");
      return;
    }
    setTargets((prev) => prev.map((item) => (item.id === target.id ? { ...item, organizationId } : item)));
    setAssignChoice((prev) => {
      const next = { ...prev };
      delete next[org.id];
      return next;
    });
    setFlash(organizationId ? `Asignaste ${target.targetDisplay} a ${org.name}.` : `Quitaste ${target.targetDisplay} de ${org.name}.`);
  }

  const orgById = new Map(orgs.map((org) => [org.id, org]));
  const targetsKnown = targetsNote === null;
  const alertsKnown = alertsNote === null;

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Tus objetivos, agrupados por cliente o equipo."
        lead="Creá una organización, asignale tus objetivos de monitoreo y mirá sus alertas recientes en un solo lugar."
      />

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" || status.kind === "unauthorized" ? (
        <UnauthorizedState callbackPath="/pwn/organizations" />
      ) : null}

      {authenticated && status.kind === "disabled" ? <DisabledState title="Organizaciones no disponibles" /> : null}

      {authenticated && status.kind !== "unauthorized" && status.kind !== "disabled" ? (
        <form className={`space-y-5 ${pwnPanelClass}`} onSubmit={(event) => void createOrg(event)} noValidate>
          <div>
            <h2 className="mv-h3 text-lg">Nueva organización</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Agrupá dominios y objetivos de monitoreo bajo un mismo cliente o equipo.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="pwn-org-name" className={pwnFieldLabelClass}>
                Nombre
              </label>
              <input
                id="pwn-org-name"
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? "pwn-org-error" : undefined}
                className={pwnFieldClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="organization"
                maxLength={120}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pwn-org-domain" className={pwnFieldLabelClass}>
                Dominio <span className="text-[var(--text-tertiary)]">(opcional)</span>
              </label>
              <input
                id="pwn-org-domain"
                inputMode="url"
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? "pwn-org-error" : undefined}
                className={pwnFieldClass}
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="empresa.com"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
          {formError ? (
            <p id="pwn-org-error" role="alert" className={pwnErrorTextClass}>
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
              {saving ? "Guardando…" : "Crear organización"}
            </button>
          </div>
        </form>
      ) : null}

      {authenticated && status.kind === "loading" ? <LoadingState label="Cargando organizaciones…" /> : null}
      {authenticated && status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

      {authenticated && status.kind === "ready" ? (
        <>
          {flash ? <PwnNotice>{flash}</PwnNotice> : null}
          {targetsNote || alertsNote ? (
            <div className="space-y-3">
              {targetsNote ? <PwnNotice tone="error">{targetsNote}</PwnNotice> : null}
              {alertsNote ? <PwnNotice tone="neutral">{alertsNote}</PwnNotice> : null}
              <button type="button" onClick={() => void load()} className={buttonClass("secondary", "sm", "min-h-11 w-full sm:w-auto")}>
                Reintentar
              </button>
            </div>
          ) : null}

          {orgs.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-5 w-5" aria-hidden />}
              title="Todavía no tenés organizaciones"
              description={
                targetsKnown && targets.length === 0
                  ? "Creá una con el formulario de arriba. Para asignarle objetivos, primero seguí un correo o un dominio desde Exposición."
                  : "Creá una con el formulario de arriba y después asignale tus objetivos de monitoreo."
              }
              action={
                targetsKnown && targets.length === 0 ? (
                  <Link href="/pwn/exposure" className={buttonClass("secondary", "md")}>
                    Ir a Exposición
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-6">
              {orgs.map((org) => {
                const orgTargets = targets.filter((target) => target.organizationId === org.id);
                const orgTargetIds = new Set(orgTargets.map((target) => target.id));
                const orgAlerts = alerts.filter((alert) => alert.targetId && orgTargetIds.has(alert.targetId));
                const verified = orgTargets.filter((target) => target.verificationStatus === "VERIFIED").length;
                const candidates = targets.filter((target) => target.organizationId !== org.id);
                const choice = candidates.some((target) => target.id === assignChoice[org.id])
                  ? assignChoice[org.id]
                  : (candidates[0]?.id ?? "");
                const chosen = candidates.find((target) => target.id === choice) ?? null;
                const editing = draft?.id === org.id ? draft : null;
                const confirming = confirmDelete === org.id;
                const titleId = `pwn-org-${org.id}-title`;
                return (
                  <article key={org.id} aria-labelledby={titleId} className={`${pwnCardClass} space-y-6`}>
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <span className={pwnIconTileClass}>
                          <Building2 className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h2 id={titleId} className="mv-h3 break-words">
                            {org.name}
                          </h2>
                          <p className="mv-data mt-1 break-all text-sm text-[var(--text-secondary)]">{org.domain ?? "Sin dominio"}</p>
                        </div>
                      </div>
                      {!editing && !confirming ? (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(org)}
                            disabled={busy !== null}
                            aria-label={`Editar ${org.name}`}
                            className={buttonClass("ghost", "sm", "min-h-11 flex-1 sm:flex-none")}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDelete(org.id);
                              setDraft(null);
                              clearOrgError(org.id);
                            }}
                            disabled={busy !== null}
                            aria-label={`Borrar ${org.name}`}
                            className={buttonClass("ghost", "sm", "min-h-11 flex-1 text-[var(--p-alert)] sm:flex-none")}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            Borrar
                          </button>
                        </div>
                      ) : null}
                    </header>

                    {editing ? (
                      <form
                        aria-label={`Editar ${org.name}`}
                        className={`${pwnInsetClass} space-y-4`}
                        onSubmit={(event) => void saveEdit(event, org)}
                        noValidate
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label htmlFor={`pwn-org-${org.id}-name`} className={pwnFieldLabelClass}>
                              Nombre
                            </label>
                            <input
                              id={`pwn-org-${org.id}-name`}
                              // Al abrir la edición el foco va al primer campo.
                              autoFocus
                              className={pwnFieldClass}
                              value={editing.name}
                              onChange={(event) => setDraft({ ...editing, name: event.target.value })}
                              aria-invalid={editing.error ? true : undefined}
                              autoComplete="organization"
                              maxLength={120}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor={`pwn-org-${org.id}-domain`} className={pwnFieldLabelClass}>
                              Dominio <span className="text-[var(--text-tertiary)]">(opcional)</span>
                            </label>
                            <input
                              id={`pwn-org-${org.id}-domain`}
                              inputMode="url"
                              className={pwnFieldClass}
                              value={editing.domain}
                              onChange={(event) => setDraft({ ...editing, domain: event.target.value })}
                              aria-invalid={editing.error ? true : undefined}
                              placeholder="empresa.com"
                              autoComplete="off"
                              spellCheck={false}
                            />
                          </div>
                        </div>
                        {editing.error ? <PwnNotice tone="error">{editing.error}</PwnNotice> : null}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button type="submit" disabled={busy !== null} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
                            {busy === `${org.id}:save` ? "Guardando…" : "Guardar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraft(null)}
                            disabled={busy === `${org.id}:save`}
                            className={buttonClass("ghost", "md", "w-full sm:w-auto")}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {confirming ? (
                      <div role="group" aria-label={`Confirmar borrado de ${org.name}`} className={`${pwnInsetClass} ${pwnAlertToneClass} space-y-3`}>
                        <p className="text-sm text-[var(--text-primary)]">
                          ¿Borrar {org.name}? Sus objetivos e informes quedan sin organización.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => void removeOrg(org)}
                            disabled={busy !== null}
                            aria-label={`Confirmar: borrar ${org.name}`}
                            className={buttonClass("secondary", "sm", "min-h-11 w-full text-[var(--p-alert)] sm:w-auto")}
                          >
                            {busy === `${org.id}:delete` ? "Borrando…" : "Confirmar"}
                          </button>
                          <button
                            type="button"
                            // El botón Borrar desaparece: el foco queda en la salida segura.
                            autoFocus
                            onClick={() => setConfirmDelete(null)}
                            disabled={busy === `${org.id}:delete`}
                            aria-label={`Cancelar el borrado de ${org.name}`}
                            className={buttonClass("ghost", "sm", "min-h-11 w-full sm:w-auto")}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {orgErrors[org.id] ? <PwnNotice tone="error">{orgErrors[org.id]}</PwnNotice> : null}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <StatCard label="Objetivos" value={targetsKnown ? orgTargets.length : org.targetCount} />
                      <StatCard label="Verificados" value={targetsKnown ? verified : null} hint="Probaste que son tuyos" />
                      <StatCard label="Pendientes" value={targetsKnown ? orgTargets.length - verified : null} hint="Todavía sin verificar" />
                    </div>

                    <section aria-labelledby={`${titleId}-targets`} className="space-y-3">
                      <h3 id={`${titleId}-targets`} className="text-sm font-semibold text-[var(--text-primary)]">
                        Objetivos
                      </h3>
                      {!targetsKnown ? (
                        <p className="text-sm text-[var(--text-secondary)]">No se pudieron cargar los objetivos. Probá con Reintentar.</p>
                      ) : orgTargets.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)]">Todavía no asignaste objetivos a esta organización.</p>
                      ) : (
                        <ul className="flex flex-col divide-y divide-[var(--mv-hairline)]">
                          {orgTargets.map((target) => (
                            <li key={target.id} className="flex items-center justify-between gap-3 py-2">
                              <div className="min-w-0">
                                <p className="mv-data break-all text-sm text-[var(--text-primary)]">{target.targetDisplay}</p>
                                <p
                                  className={`text-xs ${target.verificationStatus === "VERIFIED" ? "text-gold" : "text-[var(--text-tertiary)]"}`}
                                >
                                  {targetState(target)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void moveTarget(target, org, null)}
                                disabled={busy !== null}
                                aria-label={`Quitar ${target.targetDisplay} de ${org.name}`}
                                className={buttonClass("ghost", "sm", "min-h-11 shrink-0")}
                              >
                                <X className="h-4 w-4" aria-hidden />
                                {busy === `${target.id}:move` ? "Quitando…" : "Quitar"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {targetsKnown ? (
                        candidates.length ? (
                          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1 space-y-2 sm:max-w-md">
                              <label htmlFor={`${titleId}-assign`} className={pwnFieldLabelClass}>
                                Asignar objetivo
                              </label>
                              <PwnSelect
                                id={`${titleId}-assign`}
                                aria-label={`Objetivo para asignar a ${org.name}`}
                                value={choice}
                                onValueChange={(value) => setAssignChoice((prev) => ({ ...prev, [org.id]: value }))}
                                disabled={busy !== null}
                                options={candidates.map((target) => {
                                  const current = target.organizationId ? orgById.get(target.organizationId) : null;
                                  return {
                                    value: target.id,
                                    label: current ? `${target.targetDisplay} (ahora en ${current.name})` : target.targetDisplay,
                                  };
                                })}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (chosen) void moveTarget(chosen, org, org.id);
                              }}
                              disabled={busy !== null || !chosen}
                              aria-label={chosen ? `Asignar ${chosen.targetDisplay} a ${org.name}` : `Asignar objetivo a ${org.name}`}
                              className={buttonClass("secondary", "md", "w-full sm:w-auto")}
                            >
                              {chosen && busy === `${chosen.id}:move` ? "Asignando…" : "Asignar"}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-tertiary)]">
                            {targets.length ? "Todos tus objetivos ya están en esta organización." : "Todavía no seguís objetivos. Agregalos desde Exposición."}
                          </p>
                        )
                      ) : null}
                    </section>

                    <section aria-labelledby={`${titleId}-alerts`}>
                      <h3 id={`${titleId}-alerts`} className="text-sm font-semibold text-[var(--text-primary)]">
                        Alertas recientes
                      </h3>
                      {!alertsKnown ? (
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">No hay datos de alertas para mostrar.</p>
                      ) : orgAlerts.length === 0 ? (
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">No hay alertas recientes para esta organización.</p>
                      ) : (
                        <ul className="mt-2 flex flex-col divide-y divide-[var(--mv-hairline)]">
                          {orgAlerts.map((alert) => (
                            <li key={alert.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)]">{alert.title}</p>
                                <p className="mv-data text-xs text-[var(--text-tertiary)]">{formatWhen(alert.createdAt) ?? "Fecha no indicada"}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <RiskBadge level={alert.severity} />
                                <SourceBadge source={alert.source} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
