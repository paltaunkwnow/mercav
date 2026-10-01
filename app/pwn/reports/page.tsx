"use client";

import { useState } from "react";
import { pwnFetch, readReport, type ReportView } from "@/components/pwn/api";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { StatCard } from "@/components/pwn/StatCard";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatScore, formatWhen } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { FileText, RotateCw } from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; report: ReportView };

export default function ReportsPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function generate() {
    setStatus({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/reports");
    if (!response.ok) {
      if (response.reason === "aborted") return;
      setStatus(response.reason === "disabled" ? { kind: "disabled" } : response.reason === "unauthorized" ? { kind: "unauthorized" } : { kind: "error", message: response.message });
      return;
    }
    const report = readReport(response.data);
    setStatus(report ? { kind: "ready", report } : { kind: "error", message: "La respuesta no incluye un informe." });
  }

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Informes"
        title="El estado de tu exposición, en una página."
        lead="Generá un informe a partir de tus objetivos autorizados, las exposiciones guardadas y tus alertas. Cada generación queda registrada en tu cuenta."
        actions={
          status.kind !== "idle" && status.kind !== "disabled" && status.kind !== "unauthorized" ? (
            <button type="button" onClick={() => void generate()} disabled={status.kind === "loading"} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
              <RotateCw className="h-4 w-4" aria-hidden />
              {status.kind === "loading" ? "Generando…" : "Generar de nuevo"}
            </button>
          ) : null
        }
      />

      {status.kind === "idle" ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" aria-hidden />}
          title="Todavía no generaste un informe"
          description="El informe resume tus objetivos de monitoreo, exposiciones y alertas en este momento."
          action={
            <button type="button" onClick={() => void generate()} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
              Generar informe
            </button>
          }
        />
      ) : null}
      {status.kind === "loading" ? <LoadingState label="Generando informe…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Informes no configurados" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/reports" /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void generate()} /> : null}
      {status.kind === "ready" ? <ReportCard report={status.report} /> : null}
    </FadeIn>
  );
}

function ReportCard({ report }: { report: ReportView }) {
  const { metrics } = report;
  const hasExposures = (metrics.exposures ?? 0) > 0;
  return (
    <article className="mv-panel space-y-6 rounded-[1.75rem] p-5 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="mv-h3">{report.title}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Generado: <span className="mv-data">{formatWhen(report.createdAt) ?? "No indicado"}</span>
          </p>
        </div>
        {hasExposures && metrics.highestRisk?.level ? <RiskBadge level={metrics.highestRisk.level} /> : null}
      </header>
      {report.summary ? <p className="mv-body max-w-3xl">{report.summary}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Objetivos autorizados" value={metrics.monitoringTargets} />
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
