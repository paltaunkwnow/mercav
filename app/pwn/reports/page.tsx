"use client";

import { useState } from "react";
import { pwnFetch, readReport, type ReportView } from "@/components/pwn/api";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { StatCard } from "@/components/pwn/StatCard";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { Button } from "@/components/ui/button";
import { focusRing, formatScore, formatWhen } from "@/components/pwn/format";

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
    <FadeIn className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Informes</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            Genera un informe a partir de tus objetivos autorizados, las exposiciones guardadas y tus alertas. Cada generación queda registrada en tu cuenta.
          </p>
        </div>
        {status.kind !== "idle" && status.kind !== "disabled" && status.kind !== "unauthorized" ? (
          <Button type="button" onClick={() => void generate()} disabled={status.kind === "loading"} className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
            {status.kind === "loading" ? "Generando…" : "Generar de nuevo"}
          </Button>
        ) : null}
      </header>

      {status.kind === "idle" ? (
        <EmptyState
          title="Todavía no has generado un informe"
          description="El informe resume tus objetivos de monitoreo, exposiciones y alertas en este momento."
          action={
            <Button type="button" onClick={() => void generate()} className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
              Generar informe
            </Button>
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
    <article className="space-y-5 rounded-3xl border border-white/5 bg-bg-secondary/70 p-5 md:p-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl text-white">{report.title}</h2>
          {hasExposures && metrics.highestRisk?.level ? <RiskBadge level={metrics.highestRisk.level} /> : null}
        </div>
        <p className="mt-1 text-sm text-gray-400">Generado: {formatWhen(report.createdAt) ?? "No indicado"}</p>
      </header>
      {report.summary ? <p className="text-sm leading-relaxed text-gray-300">{report.summary}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Objetivos autorizados" value={metrics.monitoringTargets} />
        <StatCard label="Exposiciones" value={metrics.exposures} />
        <StatCard label="Alertas" value={metrics.alerts} />
        <StatCard label="Sin leer" value={metrics.unreadAlerts} />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Confianza promedio</dt>
          <dd className="text-white">{hasExposures ? (formatScore(metrics.averageConfidence) ?? "—") : "— (sin exposiciones)"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Riesgo máximo</dt>
          <dd className="text-white">{hasExposures ? (formatScore(metrics.highestRisk?.score) ?? "—") : "— (sin exposiciones)"}</dd>
        </div>
      </dl>
      <p className="text-xs text-gray-500">Las exposiciones en disputa no cuentan para la confianza ni el riesgo.</p>
    </article>
  );
}
// creado por pato dev y askforvini
