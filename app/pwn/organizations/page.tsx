"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { pwnFetch, readAlerts, readTargets, type AlertView, type MonitoringTarget, type PwnResult } from "@/components/pwn/api";
import { StatCard } from "@/components/pwn/StatCard";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { Button } from "@/components/ui/button";
import { focusRing, formatWhen } from "@/components/pwn/format";

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
    <FadeIn className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Organizaciones</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">Objetivos de monitoreo agrupados por la organización a la que están asociados, con sus alertas recientes.</p>
      </header>

      <form
        className="space-y-4 rounded-3xl border border-white/5 bg-bg-secondary/70 p-5"
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
        <h2 className="font-display text-2xl text-white">Nueva organización</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-white">
            Nombre
            <input className={`h-11 w-full rounded-xl border border-white/10 bg-bg-tertiary/70 px-3 ${focusRing}`} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-white">
            Dominio (opcional)
            <input className={`h-11 w-full rounded-xl border border-white/10 bg-bg-tertiary/70 px-3 ${focusRing}`} value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="empresa.com" />
          </label>
        </div>
        {formError ? <p role="alert" className="text-sm text-red-200">{formError}</p> : null}
        <Button type="submit" disabled={saving} className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
          {saving ? "Guardando…" : "Crear organización"}
        </Button>
      </form>

      {loading ? <LoadingState label="Cargando organizaciones…" /> : null}
      {!loading && failure && !failure.ok && failure.reason === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/organizations" /> : null}
      {!loading && failure && !failure.ok && failure.reason === "disabled" ? <DisabledState title="Organizaciones no disponibles" /> : null}
      {!loading && !failure && notes.length ? (
        <div role="status" className="space-y-2">
          {notes.map((note) => (
            <p key={note.text} className="text-sm text-gray-400">
              {note.text}
            </p>
          ))}
          <Button type="button" variant="outline" onClick={() => void load()} className={`rounded-xl border-white/10 text-white ${focusRing}`}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {!loading && !failure && orgs.length === 0 && !notes.some((note) => note.kind === "error") ? (
        <EmptyState
          title="No hay objetivos asociados a una organización"
          description="Los objetivos de monitoreo aparecen aquí cuando se registran con una organización."
          action={
            <Button asChild className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
              <Link href="/pwn/monitor">Ir a monitoreo</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && !failure
        ? orgs.map((org) => {
            const verified = org.targets.filter((target) => target.verificationStatus === "VERIFIED").length;
            return (
              <article key={org.id} className="space-y-4 rounded-3xl border border-white/5 bg-bg-secondary/70 p-5 md:p-6">
                <header>
                  <h2 className="font-display text-3xl text-white">{org.name}</h2>
                  <p className="mt-1 text-sm text-gray-400">{org.domain ?? "Sin dominio"}</p>
                </header>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatCard label="Objetivos" value={org.targets.length} />
                  <StatCard label="Verificados" value={verified} />
                  <StatCard label="Pendientes" value={org.targets.length - verified} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Objetivos</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {org.targets.map((target) => (
                      <li
                        key={target.id}
                        className={`rounded-lg border px-2 py-1 font-mono text-xs ${target.verificationStatus === "VERIFIED" ? "border-white/10 text-gray-300" : "border-dashed border-gold/30 text-gray-400"}`}
                      >
                        {target.targetDisplay}
                        {target.verificationStatus === "VERIFIED" ? "" : " · pendiente"}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Alertas recientes</h3>
                  {org.alerts.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-400">No hay alertas recientes para esta organización.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {org.alerts.map((alert) => (
                        <li key={alert.id} className="flex flex-col gap-2 rounded-2xl border border-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-white">{alert.title}</p>
                            <p className="text-xs text-gray-500">{formatWhen(alert.createdAt) ?? "Fecha no indicada"}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
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
