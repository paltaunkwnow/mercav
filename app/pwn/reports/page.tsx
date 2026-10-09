"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pwnFetch,
  readOrganizations,
  readReport,
  readReportHistory,
  type OrganizationView,
  type Pagination,
  type ReportHistoryItem,
  type ReportView,
} from "@/components/pwn/api";
import { RiskBadge, riskTone } from "@/components/pwn/RiskBadge";
import { StatCard } from "@/components/pwn/StatCard";
import { PwnSelect } from "@/components/pwn/PwnSelect";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { formatCount, formatScore, formatWhen, pwnCardClass, pwnFieldLabelClass, pwnPanelClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnPageHeader, PwnSectionHeading } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { Download, FileText, Printer } from "@/components/icons";

const HISTORY_LIMIT = 20;
const ALL = "all";

type History =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: ReportHistoryItem[]; pagination: Pagination | null };

type Generation =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; report: ReportView; scope: string };

/** Lo que hace falta para descargar o imprimir un informe (las métricas solo las trae uno recién generado). */
type Exportable = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string | null;
  scope: string;
  metrics?: ReportView["metrics"];
};

const RISK_TEXT: Record<string, string> = {
  critical: "crítico",
  high: "alto",
  medium: "medio",
  low: "bajo",
  informational: "informativo",
};

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

// La API devuelve el informe sin la organización; el nombre sale de la lista que eligió el usuario.
function scopeLabel(organization: { name: string } | null, fresh: boolean) {
  if (organization) return organization.name;
  return fresh ? "Todos tus objetivos" : "Sin organización";
}

/** Fecha local para el nombre del archivo (YYYY-MM-DD). */
function fileDay(value: string | null): string {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function reportText(report: Exportable): string {
  const lines = [
    report.title,
    `Fecha: ${formatWhen(report.createdAt) ?? "No indicada"}`,
    `Organización: ${report.scope}`,
  ];
  if (report.summary) lines.push("", "Resumen", report.summary);
  const metrics = report.metrics;
  if (metrics) {
    const count = (value: number | null) => (value === null ? "sin dato" : String(value));
    const hasExposures = (metrics.exposures ?? 0) > 0;
    const level = metrics.highestRisk?.level ? RISK_TEXT[riskTone(metrics.highestRisk.level)] : null;
    const risk = formatScore(metrics.highestRisk?.score);
    lines.push(
      "",
      "Métricas",
      `Objetivos verificados: ${count(metrics.monitoringTargets)}`,
      `Exposiciones: ${count(metrics.exposures)}`,
      `Alertas: ${count(metrics.alerts)}`,
      `Alertas sin leer: ${count(metrics.unreadAlerts)}`,
      `Confianza promedio: ${hasExposures ? (formatScore(metrics.averageConfidence) ?? "sin dato") : "sin exposiciones"}`,
      `Riesgo máximo: ${hasExposures ? [risk ?? "sin dato", level ? `(${level})` : null].filter(Boolean).join(" ") : "sin exposiciones"}`,
    );
  }
  lines.push("", "Generado con Mercav Pwn.");
  return `${lines.join("\n")}\n`;
}

function downloadReport(report: Exportable) {
  const blob = new Blob([reportText(report)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `informe-pwn-${fileDay(report.createdAt)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se libera después del clic para que el navegador alcance a leerlo.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ReportActions({ report, onPrint }: { report: Exportable; onPrint: (id: string) => void }) {
  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row print:hidden">
      <button
        type="button"
        onClick={() => downloadReport(report)}
        aria-label={`Descargar ${report.title}`}
        className={buttonClass("secondary", "sm", "min-h-11 w-full sm:w-auto")}
      >
        <Download className="h-4 w-4" aria-hidden />
        Descargar
      </button>
      <button
        type="button"
        onClick={() => onPrint(report.id)}
        aria-label={`Imprimir ${report.title}`}
        className={buttonClass("ghost", "sm", "min-h-11 w-full sm:w-auto")}
      >
        <Printer className="h-4 w-4" aria-hidden />
        Imprimir
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const session = usePwnSession();
  const authenticated = session.status === "authenticated";
  const [history, setHistory] = useState<History>({ kind: "loading" });
  const [orgs, setOrgs] = useState<OrganizationView[]>([]);
  const [scope, setScope] = useState<string>(ALL);
  const [generation, setGeneration] = useState<Generation>({ kind: "idle" });
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  // Al imprimir uno, los demás se ocultan en papel.
  const [printJob, setPrintJob] = useState<{ id: string; n: number } | null>(null);

  const nextLoadSignal = useAbortSlot();
  const nextGenerateSignal = useAbortSlot();

  const loadHistory = useCallback(async () => {
    const signal = nextLoadSignal();
    setHistory({ kind: "loading" });
    setMoreLoading(false);
    setMoreError(null);
    const [historyRes, orgsRes] = await Promise.all([
      pwnFetch(`/api/pwn/reports?page=1&limit=${HISTORY_LIMIT}`, { signal }),
      pwnFetch("/api/pwn/organizations", { signal }),
    ]);
    if (signal.aborted) return;
    // Sin organizaciones el informe igual se puede generar para todos los objetivos.
    setOrgs(orgsRes.ok ? readOrganizations(orgsRes.data) : []);
    if (!historyRes.ok) {
      if (historyRes.reason === "aborted") return;
      setHistory(
        historyRes.reason === "disabled"
          ? { kind: "disabled" }
          : historyRes.reason === "unauthorized"
            ? { kind: "unauthorized" }
            : { kind: "error", message: historyRes.message },
      );
      return;
    }
    const page = readReportHistory(historyRes.data);
    setHistory({ kind: "ready", items: page.items, pagination: page.pagination });
  }, [nextLoadSignal]);

  // Sin sesión no se pide nada.
  useEffect(() => {
    if (authenticated) void loadHistory();
  }, [authenticated, loadHistory]);

  useEffect(() => {
    if (!printJob) return;
    const reset = () => setPrintJob(null);
    window.addEventListener("afterprint", reset);
    window.print();
    return () => window.removeEventListener("afterprint", reset);
  }, [printJob]);

  const onPrint = useCallback((id: string) => setPrintJob({ id, n: Date.now() }), []);

  async function loadMore() {
    if (history.kind !== "ready" || !history.pagination) return;
    const nextPage = history.pagination.page + 1;
    const signal = nextLoadSignal();
    setMoreLoading(true);
    setMoreError(null);
    const response = await pwnFetch(`/api/pwn/reports?page=${nextPage}&limit=${HISTORY_LIMIT}`, { signal });
    if (signal.aborted) return;
    setMoreLoading(false);
    if (!response.ok) {
      if (response.reason === "unauthorized") setHistory({ kind: "unauthorized" });
      else setMoreError(response.message || "No se pudieron cargar más informes.");
      return;
    }
    const page = readReportHistory(response.data);
    setHistory((prev) => {
      if (prev.kind !== "ready") return prev;
      const seen = new Set(prev.items.map((item) => item.id));
      return {
        kind: "ready",
        items: [...prev.items, ...page.items.filter((item) => !seen.has(item.id))],
        pagination: page.pagination ?? prev.pagination,
      };
    });
  }

  async function generate() {
    const organization = scope === ALL ? null : (orgs.find((org) => org.id === scope) ?? null);
    const signal = nextGenerateSignal();
    setGeneration({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/reports", {
      method: "POST",
      body: JSON.stringify(organization ? { organizationId: organization.id } : {}),
      signal,
    });
    if (signal.aborted) return;
    if (!response.ok) {
      if (response.reason === "aborted") return;
      if (response.reason === "unauthorized") {
        setGeneration({ kind: "idle" });
        setHistory({ kind: "unauthorized" });
        return;
      }
      if (response.reason === "disabled") {
        setGeneration({ kind: "idle" });
        setHistory({ kind: "disabled" });
        return;
      }
      setGeneration({ kind: "error", message: response.message || "No se pudo generar el informe." });
      return;
    }
    const report = readReport(response.data);
    if (!report) {
      setGeneration({ kind: "error", message: "La respuesta no incluye un informe. Probá de nuevo." });
      return;
    }
    setGeneration({ kind: "ready", report, scope: scopeLabel(organization, true) });
    // El nuevo también queda en el historial.
    setHistory((prev) => {
      if (prev.kind !== "ready") return prev;
      const entry: ReportHistoryItem = {
        id: report.id,
        title: report.title,
        summary: report.summary,
        createdAt: report.createdAt,
        organization: organization ? { id: organization.id, name: organization.name } : null,
      };
      return {
        kind: "ready",
        items: [entry, ...prev.items.filter((item) => item.id !== report.id)],
        pagination: prev.pagination ? { ...prev.pagination, total: prev.pagination.total + 1 } : null,
      };
    });
  }

  const fresh = generation.kind === "ready" ? generation : null;
  const hiddenInPrint = (id: string) => (printJob && printJob.id !== id ? "print:hidden" : "");
  const pastItems = history.kind === "ready" ? history.items.filter((item) => item.id !== fresh?.report.id) : [];
  const total = history.kind === "ready" ? (history.pagination?.total ?? history.items.length) : 0;
  const hasMore = history.kind === "ready" && history.pagination ? history.pagination.page < history.pagination.pages : false;

  return (
    <FadeIn className="space-y-8">
      <div className="print:hidden">
        <PwnPageHeader
          title="El estado de tu exposición, en una página."
          lead="Generá un informe a partir de tus objetivos verificados, las exposiciones guardadas y tus alertas. Cada informe queda guardado en tu cuenta."
        />
      </div>

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" || history.kind === "unauthorized" ? (
        <UnauthorizedState callbackPath="/pwn/reports" />
      ) : null}
      {authenticated && history.kind === "disabled" ? <DisabledState title="Informes no configurados" /> : null}

      {authenticated && history.kind !== "unauthorized" && history.kind !== "disabled" ? (
        <>
          <section aria-labelledby="pwn-report-new" className={`${pwnPanelClass} space-y-5 print:hidden`}>
            <div>
              <h2 id="pwn-report-new" className="mv-h3 text-lg">
                Nuevo informe
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Cuenta solo los objetivos activos que probaste que son tuyos, con sus exposiciones y alertas en este momento.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {orgs.length ? (
                <div className="space-y-2 sm:w-72">
                  <label htmlFor="pwn-report-scope" className={pwnFieldLabelClass}>
                    Organización
                  </label>
                  <PwnSelect
                    id="pwn-report-scope"
                    value={scope}
                    onValueChange={setScope}
                    disabled={generation.kind === "loading"}
                    options={[{ value: ALL, label: "Todas" }, ...orgs.map((org) => ({ value: org.id, label: org.name }))]}
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void generate()}
                disabled={generation.kind === "loading"}
                className={buttonClass("primary", "md", "w-full sm:w-auto")}
              >
                <FileText className="h-4 w-4" aria-hidden />
                {generation.kind === "loading" ? "Generando…" : "Generar informe"}
              </button>
            </div>
            {generation.kind === "error" ? <PwnNotice tone="error">{generation.message}</PwnNotice> : null}
          </section>

          {generation.kind === "loading" ? <LoadingState label="Generando informe…" /> : null}
          {fresh ? (
            <div className={hiddenInPrint(fresh.report.id)}>
              <ReportCard report={fresh.report} scope={fresh.scope} onPrint={onPrint} />
            </div>
          ) : null}

          <section aria-labelledby="pwn-report-history" className="space-y-5">
            <PwnSectionHeading
              id="pwn-report-history"
              title="Historial"
              lead={
                history.kind === "ready" && total
                  ? `${formatCount(total)} ${total === 1 ? "informe guardado" : "informes guardados"} en tu cuenta.`
                  : undefined
              }
              className="print:hidden"
            />
            {history.kind === "loading" ? <LoadingState label="Cargando historial…" /> : null}
            {history.kind === "error" ? <ErrorState message={history.message} onRetry={() => void loadHistory()} /> : null}
            {history.kind === "ready" && pastItems.length === 0 ? (
              fresh ? (
                <p className="text-sm text-[var(--text-secondary)] print:hidden">No hay informes anteriores.</p>
              ) : (
                <EmptyState
                  icon={<FileText className="h-5 w-5" aria-hidden />}
                  title="Todavía no generaste un informe"
                  description="Generá el primero con el botón de arriba. Resume tus objetivos verificados, exposiciones y alertas en este momento."
                />
              )
            ) : null}
            {pastItems.length ? (
              <ul className="space-y-3">
                {pastItems.map((item) => {
                  const exportable: Exportable = {
                    id: item.id,
                    title: item.title,
                    summary: item.summary,
                    createdAt: item.createdAt,
                    scope: scopeLabel(item.organization, false),
                  };
                  return (
                    <li key={item.id} className={`${pwnCardClass} ${hiddenInPrint(item.id)}`}>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="mv-h3 text-lg">{item.title}</h3>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            <span className="mv-data">{formatWhen(item.createdAt) ?? "Fecha no indicada"}</span>
                            {" · "}
                            {exportable.scope}
                          </p>
                        </div>
                        <ReportActions report={exportable} onPrint={onPrint} />
                      </div>
                      {item.summary ? <p className="mv-body mt-3 max-w-3xl text-sm">{item.summary}</p> : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {moreError ? <PwnNotice tone="error">{moreError}</PwnNotice> : null}
            {hasMore ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={moreLoading}
                className={buttonClass("secondary", "md", "w-full sm:w-auto print:hidden")}
              >
                {moreLoading ? "Cargando…" : "Ver informes anteriores"}
              </button>
            ) : null}
          </section>
        </>
      ) : null}
    </FadeIn>
  );
}

function ReportCard({ report, scope, onPrint }: { report: ReportView; scope: string; onPrint: (id: string) => void }) {
  const { metrics } = report;
  const hasExposures = (metrics.exposures ?? 0) > 0;
  return (
    <article aria-labelledby={`pwn-report-${report.id}`} className={`${pwnCardClass} space-y-6`}>
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 id={`pwn-report-${report.id}`} className="mv-h3">
            {report.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Generado: <span className="mv-data">{formatWhen(report.createdAt) ?? "No indicado"}</span>
            {" · "}
            {scope}
          </p>
          {hasExposures && metrics.highestRisk?.level ? (
            <div className="mt-3">
              <RiskBadge level={metrics.highestRisk.level} />
            </div>
          ) : null}
        </div>
        <ReportActions report={{ id: report.id, title: report.title, summary: report.summary, createdAt: report.createdAt, scope, metrics }} onPrint={onPrint} />
      </header>
      {report.summary ? <p className="mv-body max-w-3xl">{report.summary}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Objetivos verificados" value={metrics.monitoringTargets} />
        <StatCard label="Exposiciones" value={metrics.exposures} />
        <StatCard label="Alertas" value={metrics.alerts} />
        <StatCard label="Sin leer" value={metrics.unreadAlerts} />
      </div>
      <MetaGrid className="lg:grid-cols-2">
        <Meta label="Confianza promedio">{hasExposures ? (formatScore(metrics.averageConfidence) ?? "—") : "— (sin exposiciones)"}</Meta>
        <Meta label="Riesgo máximo">{hasExposures ? (formatScore(metrics.highestRisk?.score) ?? "—") : "— (sin exposiciones)"}</Meta>
      </MetaGrid>
      <p className="text-xs text-[var(--text-tertiary)]">Las exposiciones en disputa no cuentan para la confianza ni el riesgo.</p>
    </article>
  );
}
// creado por pato dev y askforvini
