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
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { PWN_FEEDS_UPDATED } from "@/components/pwn/events";
import { focusRing, formatRelative, formatWhen, pwnCardClass } from "@/components/pwn/format";
import { PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { ArrowUpRight, Pause, Play, RefreshCw, X } from "lucide-react";

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

function StatPill({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`mv-panel flex min-w-[8.5rem] shrink-0 flex-col-reverse gap-1 rounded-[1.25rem] px-4 py-3 ${strong ? "border-[var(--color-border-gold)]" : ""}`}>
      <dt className="text-xs text-[var(--text-secondary)]">{label}</dt>
      <dd className={`font-display text-2xl font-semibold tabular-nums ${strong ? "text-gold" : "text-[var(--text-primary)]"}`}>{value}</dd>
    </div>
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
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Señales"
        title="Ciberpatrullaje"
        lead="Titulares de foros, stealer logs, robos a empresas y reclamos de ransomware. El archivo ya está en base de datos; acá solo se consultan novedades y te avisamos si entra una filtración nueva. Solo metadatos: autor, título y enlace. Sin volcados ni .onion."
        actions={
          <>
            <span
              role="status"
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium ${
                live ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold" : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)]"
              }`}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? "bg-gold" : "bg-[var(--text-tertiary)]"}`} />
              {live ? "En vivo" : "Pausado"}
            </span>
            <button type="button" className={buttonClass("ghost", "sm", "w-full sm:w-auto")} onClick={() => setLive((value) => !value)}>
              {live ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {live ? "Pausar" : "Reanudar"}
            </button>
            <button type="button" onClick={() => void patrol()} disabled={patrolling} className={buttonClass("secondary", "sm", "w-full sm:w-auto")}>
              <RefreshCw className={`h-4 w-4 ${patrolling ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
              {patrolling ? "Actualizando…" : "Actualizar ahora"}
            </button>
          </>
        }
      >
        {syncAt ? (
          <p className="text-xs text-[var(--text-tertiary)]">
            Última sincronización: <span className="mv-data">{formatWhen(syncAt) ?? formatRelative(syncAt) ?? syncAt}</span>
          </p>
        ) : null}
        {authorFilter ? (
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] py-1 pl-3 pr-1 text-sm text-[var(--text-primary)]">
            Autor: <span className="font-semibold text-gold">{authorFilter}</span>
            <Link
              href="/pwn/signals?kind=LEAKS"
              aria-label="Quitar filtro de autor"
              className={`grid h-7 w-7 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] ${focusRing}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        ) : null}
      </PwnPageHeader>

      {stats ? (
        <dl className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Contadores">
          <StatPill label="Bolivia" value={stats.bolivia} strong />
          <StatPill label="Gobierno" value={stats.government} strong />
          <StatPill label="Empresas" value={stats.corporate} />
          <StatPill label="Stealer logs" value={stats.stealer} />
          <StatPill label="Bases de datos" value={stats.database} />
          <StatPill label="Cuentas" value={stats.credentials} />
          <StatPill label="Total" value={stats.total} />
        </dl>
      ) : null}

      <nav aria-label="Filtrar por tipo de señal" className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => {
          const href = buildSignalsUrl(f.id);
          const active = !authorFilter && activeFilter === f.id;
          return (
            <Link
              key={f.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color] duration-200 ${focusRing} ${
                active
                  ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold"
                  : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <Link
          href="/pwn/actors"
          className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-gold ${focusRing}`}
        >
          Por autor <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </nav>

      {loading ? <LoadingState label="Cargando señales…" /> : null}
      {!loading && result && !result.ok && result.reason === "disabled" ? <DisabledState title="Señales no disponibles" /> : null}
      {!loading && result && !result.ok && result.reason === "unauthorized" ? (
        <UnauthorizedState callbackPath="/pwn/signals" description="El ciberpatrullaje se muestra a cuentas con sesión iniciada." />
      ) : null}
      {!loading && result && !result.ok && result.reason !== "disabled" && result.reason !== "unauthorized" ? (
        <ErrorState message={result.message} onRetry={() => void load(activeFilter, authorFilter)} />
      ) : null}

      {!loading && result?.ok && items.length === 0 ? (
        <EmptyState
          title="Nada en este filtro"
          description="El archivo se mantiene en segundo plano. Si este filtro sigue vacío, probá Stealer logs, Empresas o Todas."
          action={
            <Link href="/pwn/signals?kind=ALL" className={buttonClass("secondary", "sm")}>
              Ver todas
            </Link>
          }
        />
      ) : null}

      {!loading && result?.ok && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`${pwnCardClass} ${
                item.isGovernment || item.isBolivia
                  ? "!border-red-400/40 [.light_&]:!border-red-700/30"
                  : "border-dashed !border-[var(--mv-hairline-strong)]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <BoliviaPriorityBadge active={item.isBolivia} />
                <GovernmentPriorityBadge active={item.isGovernment} />
                <SignalKindBadge kind={item.signalKind} />
                <VerificationBadge status={item.verificationStatus} />
                {item.breachName ? (
                  <span className="inline-flex h-6 items-center rounded-full border border-[var(--color-border-gold)] px-2.5 text-[11px] font-semibold text-gold">
                    HIBP · {item.breachName}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)] md:text-xl">{item.title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-tertiary)]">
                {item.author ? (
                  <>
                    <Link href={`/pwn/signals?author=${encodeURIComponent(item.author)}`} className={`font-medium text-gold underline-offset-4 hover:underline ${focusRing}`}>
                      {item.author}
                    </Link>
                    <span aria-hidden>·</span>
                  </>
                ) : null}
                {item.forum ? (
                  <>
                    <span>{item.forum}</span>
                    <span aria-hidden>·</span>
                  </>
                ) : null}
                <span className="mv-data">{formatWhen(item.publishedAt) ?? formatRelative(item.lastSeenAt) ?? "Fecha no indicada"}</span>
              </p>
              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <SourceBadge source={item.source} href={item.link} />
                <a href={item.link} target="_blank" rel="noopener noreferrer" className={`mv-link inline-flex items-center gap-1 text-sm ${focusRing}`}>
                  Abrir en la fuente <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </FadeIn>
  );
}
