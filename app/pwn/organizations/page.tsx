"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { pwnFetch, readAlerts, readTargets, type AlertView, type MonitoringTarget, type PwnResult } from "@/components/pwn/api";
import { StatCard } from "@/components/pwn/StatCard";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatWhen, pwnFieldClass, pwnFieldLabelClass, pwnPanelClass } from "@/components/pwn/format";
import { PwnNotice, PwnPageHeader, pwnErrorTextClass } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { Building2 } from "lucide-react";

const RECENT_ALERTS = 50;

type OrgCard = {
  id: string;
  name: string;
  domain: string | null;
  targets: MonitoringTarget[];
  alerts: AlertView[];
};

type OrgRecord = { id: string; name: string; domain: string | null };

function readOrganizations(body: unknown): OrgRecord[] {
  const data = (body as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; name?: unknown; domain?: unknown };
    if (typeof row.id !== "string" || typeof row.name !== "string") return [];
    return [{ id: row.id, name: row.name, domain: typeof row.domain === "string" ? row.domain : null }];
  });
}

function buildOrgs(orgs: OrgRecord[], targets: MonitoringTarget[], alerts: AlertView[]): OrgCard[] {
  const map = new Map<string, OrgCard>();
  const orgByTarget = new Map<string, string>();
  for (const org of orgs) {
    map.set(org.id, { id: org.id, name: org.name, domain: org.domain, targets: [], alerts: [] });
  }
  for (const target of targets) {
    if (!target.organizationId) continue;
    const org = map.get(target.organizationId) ?? {
      id: target.organizationId,
      name: "Organización",
      domain: null,
      targets: [],
      alerts: [],
    };
    org.targets.push(target);
    map.set(target.organizationId, org);
    orgByTarget.set(target.id, target.organizationId);
  }
  for (const alert of alerts) {
    const orgId = alert.targetId ? orgByTarget.get(alert.targetId) : undefined;
    if (orgId) map.get(orgId)?.alerts.push(alert);
  }
  return [...map.values()];
}

export default function OrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgCard[]>([]);
  const [failure, setFailure] = useState<PwnResult<unknown> | null>(null);
  const [notes, setNotes] = useState<{ kind: "error" | "disabled"; text: string }[]>([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFailure(null);
    const [monitoringRes, alertsRes, orgsRes] = await Promise.all([
      pwnFetch("/api/pwn/monitoring", { signal }),
      pwnFetch(`/api/pwn/alerts?page=1&limit=${RECENT_ALERTS}`, { signal }),
      pwnFetch("/api/pwn/organizations", { signal }),
    ]);
    if (signal?.aborted) return;

    for (const res of [monitoringRes, alertsRes, orgsRes]) {
      if (!res.ok && res.reason === "unauthorized") {
        setFailure(res);
        setLoading(false);
        return;
      }
    }
    if (!monitoringRes.ok && monitoringRes.reason === "disabled") {
      setFailure({ ok: false, reason: "disabled", message: "" });
      setLoading(false);
      return;
    }

    const nextNotes: { kind: "error" | "disabled"; text: string }[] = [];
    if (!monitoringRes.ok) nextNotes.push({ kind: "error", text: monitoringRes.message });
    if (!alertsRes.ok && alertsRes.reason === "disabled") nextNotes.push({ kind: "disabled", text: "Las alertas no están configuradas." });
    else if (!alertsRes.ok) nextNotes.push({ kind: "error", text: alertsRes.message });

    const targets = monitoringRes.ok ? readTargets(monitoringRes.data) : [];
    const alerts = alertsRes.ok ? readAlerts(alertsRes.data).items : [];
    const records = orgsRes.ok ? readOrganizations(orgsRes.data) : [];
    if (!orgsRes.ok && orgsRes.reason !== "disabled") nextNotes.push({ kind: "error", text: orgsRes.message });
    setNotes(nextNotes);
    setOrgs(buildOrgs(records, targets, alerts));
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Organizaciones"
        title="Tus objetivos, agrupados por cliente o equipo."
        lead="Objetivos de monitoreo agrupados por la organización a la que están asociados, con sus alertas recientes."
      />

      <form
        className={`space-y-5 ${pwnPanelClass}`}
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            const trimmed = name.trim();
            if (trimmed.length < 2) {
              setFormError("El nombre necesita al menos 2 caracteres.");
              return;
            }
            setSaving(true);
            setFormError(null);
            const response = await pwnFetch("/api/pwn/organizations", {
              method: "POST",
              body: JSON.stringify({ name: trimmed, ...(domain.trim() ? { domain: domain.trim().toLowerCase() } : {}) }),
            });
            setSaving(false);
            if (!response.ok) {
              setFormError(response.message || "No se pudo crear la organización.");
              return;
            }
            setName("");
            setDomain("");
            await load();
          })();
        }}
      >
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

      {loading ? <LoadingState label="Cargando organizaciones…" /> : null}
      {!loading && failure && !failure.ok && failure.reason === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/organizations" /> : null}
      {!loading && failure && !failure.ok && failure.reason === "disabled" ? <DisabledState title="Organizaciones no disponibles" /> : null}
      {!loading && !failure && notes.length ? (
        <div role="status" className="space-y-3">
          {notes.map((note) => (
            <PwnNotice key={note.text} tone="neutral">
              {note.text}
            </PwnNotice>
          ))}
          <button type="button" onClick={() => void load()} className={buttonClass("secondary", "sm", "w-full sm:w-auto")}>
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading && !failure && orgs.length === 0 && !notes.some((note) => note.kind === "error") ? (
        <EmptyState
          title="No hay objetivos asociados a una organización"
          description="Los objetivos de monitoreo aparecen aquí cuando se registran con una organización."
          action={
            <Link href="/pwn/exposure" className={buttonClass("primary", "md")}>
              Ir a Exposición
            </Link>
          }
        />
      ) : null}

      {!loading && !failure
        ? orgs.map((org) => {
            const verified = org.targets.filter((target) => target.verificationStatus === "VERIFIED").length;
            return (
              <article key={org.id} className="mv-panel space-y-6 rounded-[1.75rem] p-5 md:p-7">
                <header className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
                    <Building2 className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="mv-h3 break-words">{org.name}</h2>
                    <p className="mv-data mt-1 text-sm text-[var(--text-secondary)]">{org.domain ?? "Sin dominio"}</p>
                  </div>
                </header>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatCard label="Objetivos" value={org.targets.length} />
                  <StatCard label="Verificados" value={verified} />
                  <StatCard label="Pendientes" value={org.targets.length - verified} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Objetivos</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {org.targets.map((target) => (
                      <li
                        key={target.id}
                        className={`mv-data inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${
                          target.verificationStatus === "VERIFIED"
                            ? "border-[var(--mv-hairline-strong)] text-[var(--text-primary)]"
                            : "border-dashed border-[var(--color-border-gold)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {target.targetDisplay}
                        {target.verificationStatus === "VERIFIED" ? "" : " · pendiente"}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Alertas recientes</h3>
                  {org.alerts.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">No hay alertas recientes para esta organización.</p>
                  ) : (
                    <ul className="mt-2 flex flex-col divide-y divide-[var(--mv-hairline)]">
                      {org.alerts.map((alert) => (
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
                </div>
              </article>
            );
          })
        : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
