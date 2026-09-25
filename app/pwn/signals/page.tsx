"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  pwnFetch,
  readForumSignals,
  type ForumSignalKind,
  type ForumSignalStats,
  type ForumSignalView,
  type Paged,
  type PwnResult,
} from "@/components/pwn/api";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { GovernmentPriorityBadge, SignalKindBadge, VerificationBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { focusRing, formatRelative, formatWhen, pwnPanelClass } from "@/components/pwn/format";
import { Button } from "@/components/ui/button";

type KindFilter = "ALL" | "DATA" | "GOV" | ForumSignalKind;

const FILTERS: { id: KindFilter; label: string; query: string }[] = [
  { id: "DATA", label: "Bases de datos", query: "DATA" },
  { id: "GOV", label: "Gobierno", query: "gov" },
  { id: "DATABASE", label: "Solo DB", query: "DATABASE" },
  { id: "MIXED", label: "Mixto", query: "MIXED" },
  { id: "CREDENTIALS", label: "Cuentas / logs", query: "CREDENTIALS" },
  { id: "ALL", label: "Todas", query: "ALL" },
];

function filterFromParams(kind: string | null, gov: string | null): KindFilter {
  if (gov === "true") return "GOV";
  const v = (kind ?? "DATA").toUpperCase();
  if (v === "ALL") return "ALL";
  if (v === "DATA" || v === "DATABASE" || v === "MIXED" || v === "CREDENTIALS" || v === "OTHER") return v;
  return "DATA";
}

function buildSignalsUrl(filter: KindFilter): string {
  if (filter === "GOV") return "/pwn/signals?gov=true";
  if (filter === "ALL") return "/pwn/signals?kind=ALL";
  return `/pwn/signals?kind=${filter}`;
}

function apiQuery(filter: KindFilter): string {
  if (filter === "GOV") return "page=1&limit=30&gov=true";
  if (filter === "ALL") return "page=1&limit=30";
  return `page=1&limit=30&kind=${encodeURIComponent(filter)}`;
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-xl border border-white/10 bg-bg-secondary/80 px-3 py-2 text-xs text-gray-300">
      <span className="min-w-[1.25rem] font-mono text-sm font-semibold tabular-nums text-gold">{value}</span>
      <span className="text-gray-400">{label}</span>
    </span>
  );
}

export default function ForumSignalsPage() {
  const searchParams = useSearchParams();
  const activeFilter = filterFromParams(searchParams?.get("kind") ?? null, searchParams?.get("gov") ?? null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PwnResult<Paged<ForumSignalView>> | null>(null);
  const [stats, setStats] = useState<ForumSignalStats | null>(null);
  const [syncAt, setSyncAt] = useState<string | null>(null);

  const load = useCallback(async (filter: KindFilter, signal?: AbortSignal) => {
    setLoading(true);
    const response = await pwnFetch(`/api/pwn/forum-signals?${apiQuery(filter)}`, { signal });
    if (signal?.aborted) return;
    if (!response.ok) {
      setResult(response);
      setLoading(false);
      return;
    }
    const parsed = readForumSignals(response.data);
    if (!parsed) {
      setResult({ ok: false, reason: "error", message: "Formato de señales inesperado." });
      setLoading(false);
      return;
    }
    setSyncAt(parsed.sync?.lastFinishedAt ?? null);
    setStats(parsed.stats);
    setResult({ ok: true, data: { items: parsed.items, pagination: parsed.pagination } });
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(activeFilter, controller.signal);
    return () => controller.abort();
  }, [load, activeFilter]);

  const items = result?.ok ? result.data.items : [];

  return (
    <FadeIn className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Señales de filtraciones</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Titulares de foros y RSS allowlisted. Las filtraciones con impacto gubernamental suben primero; correlacionamos titulares con brechas HIBP cuando el nombre coincide.
        </p>
        {syncAt ? (
          <p className="mt-2 font-mono text-xs text-gray-500">Última sincronización: {formatWhen(syncAt) ?? formatRelative(syncAt) ?? syncAt}</p>
        ) : null}
      </header>

      {stats ? (
        <div className="flex flex-wrap gap-2" aria-label="Contadores">
          <StatPill label="Gobierno" value={stats.government} />
          <StatPill label="Bases de datos" value={stats.data} />
          <StatPill label="Cuentas / logs" value={stats.credentials} />
          {stats.other > 0 ? <StatPill label="Sin clasificar" value={stats.other} /> : null}
          <StatPill label="Total" value={stats.total} />
        </div>
      ) : null}

      <nav aria-label="Filtrar por tipo de señal" className={`flex flex-wrap gap-2 ${pwnPanelClass}`}>
        {FILTERS.map((f) => {
          const href = buildSignalsUrl(f.id);
          const active = activeFilter === f.id;
          return (
            <Link
              key={f.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${focusRing} ${
                active ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {loading ? <LoadingState label="Cargando señales…" /> : null}
      {!loading && result && !result.ok && result.reason === "disabled" ? <DisabledState title="Señales no disponibles" /> : null}
      {!loading && result && !result.ok && result.reason !== "disabled" ? (
        <ErrorState message={result.message} onRetry={() => void load(activeFilter)} />
      ) : null}

      {!loading && result?.ok && items.length === 0 ? (
        <EmptyState
          title="Nada en este filtro"
          description={
            activeFilter === "GOV"
              ? "No hay titulares gubernamentales en este momento. Prueba Bases de datos o Todas."
              : "Ejecuta el ciclo interno o prueba otra pestaña."
          }
          action={
            <div className="flex flex-wrap gap-2">
              {activeFilter !== "ALL" ? (
                <Button asChild variant="outline" className={`rounded-xl border-white/10 text-white ${focusRing}`}>
                  <Link href="/pwn/signals?kind=ALL">Ver todas ({stats?.total ?? "…"})</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className={`rounded-xl border-white/10 text-white ${focusRing}`}>
                <Link href="/pwn">Volver al resumen</Link>
              </Button>
            </div>
          }
        />
      ) : null}

      {!loading && result?.ok && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-3xl border bg-bg-secondary/70 p-5 ${
                item.isGovernment ? "border-red-400/40 border-solid" : "border-dashed border-white/20"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <GovernmentPriorityBadge active={item.isGovernment} />
                <SignalKindBadge kind={item.signalKind} />
                <VerificationBadge status={item.verificationStatus} />
                {item.breachName ? (
                  <span className="rounded-lg border border-gold/30 px-2 py-1 text-[10px] uppercase tracking-wide text-gold">
                    HIBP · {item.breachName}
                  </span>
                ) : null}
                {item.forum ? <span className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400">{item.forum}</span> : null}
              </div>
              <h2 className="mt-3 font-display text-xl text-white">{item.title}</h2>
              <p className="mt-2 text-xs text-gray-500">
                {item.author ? `${item.author} · ` : ""}
                {formatWhen(item.publishedAt) ?? formatRelative(item.lastSeenAt) ?? "Fecha no indicada"}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <SourceBadge source={item.source} href={item.link} />
                <a href={item.link} target="_blank" rel="noopener noreferrer" className={`text-sm text-gold underline-offset-4 hover:underline ${focusRing}`}>
                  Abrir en la fuente
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </FadeIn>
  );
}
// creado por Patodev y Invertilo
