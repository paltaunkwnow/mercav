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
import { BoliviaPriorityBadge, GovernmentPriorityBadge, SignalKindBadge, VerificationBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { PWN_FEEDS_UPDATED } from "@/components/pwn/events";
import { focusRing, formatRelative, formatWhen, pwnPanelClass } from "@/components/pwn/format";
import { Button } from "@/components/ui/button";

type KindFilter = "ALL" | "LEAKS" | "DATA" | "GOV" | "BO" | ForumSignalKind;

const FILTERS: { id: KindFilter; label: string; query: string }[] = [
  { id: "LEAKS", label: "Patrulla", query: "LEAKS" },
  { id: "BO", label: "Bolivia", query: "bolivia" },
  { id: "STEALER", label: "Stealer logs", query: "STEALER" },
  { id: "CORPORATE", label: "Empresas", query: "CORPORATE" },
  { id: "GOV", label: "Gobierno", query: "gov" },
  { id: "DATABASE", label: "Bases de datos", query: "DATABASE" },
  { id: "CREDENTIALS", label: "Cuentas", query: "CREDENTIALS" },
  { id: "ALL", label: "Todas", query: "ALL" },
];

function filterFromParams(kind: string | null, gov: string | null, author: string | null, bolivia: string | null): KindFilter {
  if (author) return "ALL";
  if (bolivia === "true") return "BO";
  if (gov === "true") return "GOV";
  const v = (kind ?? "LEAKS").toUpperCase();
  if (v === "ALL" || v === "LEAKS" || v === "DATA") return v;
  if (v === "DATABASE" || v === "STEALER" || v === "CORPORATE" || v === "MIXED" || v === "CREDENTIALS" || v === "OTHER") {
    return v;
  }
  return "LEAKS";
}

function buildSignalsUrl(filter: KindFilter): string {
  if (filter === "GOV") return "/pwn/signals?gov=true";
  if (filter === "BO") return "/pwn/signals?bolivia=true";
  if (filter === "ALL") return "/pwn/signals?kind=ALL";
  return `/pwn/signals?kind=${filter}`;
}

function apiQuery(filter: KindFilter, author: string | null): string {
  const params = new URLSearchParams({ page: "1", limit: "30" });
  if (author) params.set("author", author);
  else if (filter === "GOV") params.set("gov", "true");
  else if (filter === "BO") params.set("bolivia", "true");
  else if (filter !== "ALL") params.set("kind", filter);
  return params.toString();
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
  const authorFilter = searchParams?.get("author")?.trim() || null;
  const activeFilter = filterFromParams(
    searchParams?.get("kind") ?? null,
    searchParams?.get("gov") ?? null,
    authorFilter,
    searchParams?.get("bolivia") ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [patrolling, setPatrolling] = useState(false);
  const [live, setLive] = useState(true);
  const [result, setResult] = useState<PwnResult<Paged<ForumSignalView>> | null>(null);
  const [stats, setStats] = useState<ForumSignalStats | null>(null);
  const [syncAt, setSyncAt] = useState<string | null>(null);

  const load = useCallback(async (filter: KindFilter, author: string | null, silent?: boolean, signal?: AbortSignal) => {
    if (!silent) setLoading(true);
    const response = await pwnFetch(`/api/pwn/forum-signals?${apiQuery(filter, author)}`, { signal });
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
    void load(activeFilter, authorFilter, false, controller.signal);
    return () => controller.abort();
  }, [load, activeFilter, authorFilter]);

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void load(activeFilter, authorFilter, true);
    };
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, [live, load, activeFilter, authorFilter]);

  usePwnFeedRefresh(
    useCallback(() => {
      void load(activeFilter, authorFilter, true);
    }, [load, activeFilter, authorFilter]),
  );

  async function patrol() {
    setPatrolling(true);
    const params = new URLSearchParams({ force: "1" });
    try {
      const since = window.localStorage.getItem("mercav-pwn-signal-watermark");
      if (since) params.set("since", since);
    } catch {
      /* private mode */
    }
    const response = await pwnFetch(`/api/pwn/forum-signals?${params.toString()}`, { method: "POST" });
    setPatrolling(false);
    if (response.ok) {
      window.dispatchEvent(new Event(PWN_FEEDS_UPDATED));
      void load(activeFilter, authorFilter);
    }
  }

  const items = result?.ok ? result.data.items : [];

  return (
    <FadeIn className="space-y-6">
      <header className="max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Ciberpatrullaje</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide ${live ? "border-emerald-400/40 text-emerald-200" : "border-white/10 text-gray-500"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-300" : "bg-gray-500"}`} />
              {live ? "En vivo" : "Pausado"}
            </span>
            <Button type="button" variant="outline" className={`rounded-xl border-white/10 text-white ${focusRing}`} onClick={() => setLive((value) => !value)}>
              {live ? "Pausar" : "Reanudar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void patrol()} disabled={patrolling} className={`rounded-xl border-white/10 text-white ${focusRing}`}>
              {patrolling ? "Actualizando…" : "Actualizar ahora"}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Titulares de foros, stealer logs, robos a empresas y reclamos de ransomware. El archivo ya está en base de datos; aquí solo se consultan novedades y te avisamos si entra una filtración nueva. Solo metadatos: autor, título y enlace. Sin volcados ni .onion.
        </p>
        {syncAt ? (
          <p className="mt-2 font-mono text-xs text-gray-500">Última sincronización: {formatWhen(syncAt) ?? formatRelative(syncAt) ?? syncAt}</p>
        ) : null}
        {authorFilter ? (
          <p className="mt-2 text-sm text-gold">
            Autor: {authorFilter}{" "}
            <Link href="/pwn/signals?kind=LEAKS" className={`underline-offset-4 hover:underline ${focusRing}`}>
              quitar filtro
            </Link>
          </p>
        ) : null}
      </header>

      {stats ? (
        <div className="flex flex-wrap gap-2" aria-label="Contadores">
          <StatPill label="Bolivia" value={stats.bolivia} />
          <StatPill label="Gobierno" value={stats.government} />
          <StatPill label="Empresas" value={stats.corporate} />
          <StatPill label="Stealer logs" value={stats.stealer} />
          <StatPill label="Bases de datos" value={stats.database} />
          <StatPill label="Cuentas" value={stats.credentials} />
          <StatPill label="Total" value={stats.total} />
        </div>
      ) : null}

      <nav aria-label="Filtrar por tipo de señal" className={`flex flex-wrap gap-2 ${pwnPanelClass}`}>
        {FILTERS.map((f) => {
          const href = buildSignalsUrl(f.id);
          const active = !authorFilter && activeFilter === f.id;
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
        <Link href="/pwn/actors" className={`rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white ${focusRing}`}>
          Por autor
        </Link>
      </nav>

      {loading ? <LoadingState label="Cargando señales…" /> : null}
      {!loading && result && !result.ok && result.reason === "disabled" ? <DisabledState title="Señales no disponibles" /> : null}
      {!loading && result && !result.ok && result.reason !== "disabled" ? (
        <ErrorState message={result.message} onRetry={() => void load(activeFilter, authorFilter)} />
      ) : null}

      {!loading && result?.ok && items.length === 0 ? (
        <EmptyState
          title="Nada en este filtro"
          description="El archivo se mantiene en segundo plano. Si este filtro sigue vacío, prueba Stealer logs, Empresas o Todas."
          action={
            <Button asChild variant="outline" className={`rounded-xl border-white/10 text-white ${focusRing}`}>
              <Link href="/pwn/signals?kind=ALL">Ver todas</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && result?.ok && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-3xl border bg-bg-secondary/70 p-5 ${
                item.isGovernment || item.isBolivia ? "border-red-400/40 border-solid" : "border-dashed border-white/20"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <BoliviaPriorityBadge active={item.isBolivia} />
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
                {item.author ? (
                  <>
                    <Link href={`/pwn/signals?author=${encodeURIComponent(item.author)}`} className={`text-gold underline-offset-4 hover:underline ${focusRing}`}>
                      {item.author}
                    </Link>
                    {" · "}
                  </>
                ) : null}
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
