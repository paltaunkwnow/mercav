"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  pwnFetch,
  readForumSignals,
  readForumSync,
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
import { PWN_FEEDS_UPDATED, PWN_NOTIFICATIONS_UPDATED } from "@/components/pwn/events";
import { usePwnSession } from "@/components/pwn/session";
import { focusRing, formatRelative, formatWhen, pwnCardClass, pwnInsetClass, pwnUnverifiedCardClass } from "@/components/pwn/format";
import { PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, RefreshCw, X } from "@/components/icons";
import { FORUM_SYNC_INTERVAL_MS } from "@/lib/pwn/forum-sync-policy";

const PAGE_SIZE = 30;
const SYNC_MINUTES = Math.round(FORUM_SYNC_INTERVAL_MS / 60_000);
// Misma marca que usa el patrullaje del shell para contar lo nuevo.
const WATERMARK_KEY = "mercav-pwn-signal-watermark";

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

type SyncResult = ReturnType<typeof readForumSync>;

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

function apiQuery(filter: KindFilter, author: string | null, page: number): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (author) params.set("author", author);
  else if (filter === "GOV") params.set("gov", "true");
  else if (filter === "BO") params.set("bolivia", "true");
  else if (filter !== "ALL") params.set("kind", filter);
  return params.toString();
}

function readWatermark(): string | null {
  try {
    return window.localStorage.getItem(WATERMARK_KEY);
  } catch {
    return null;
  }
}

function writeWatermark(value: string) {
  try {
    window.localStorage.setItem(WATERMARK_KEY, value);
  } catch {
    /* modo privado */
  }
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/** Qué pasó al pedir novedades, en una línea y sin inventar números. */
function syncMessage(result: SyncResult): string {
  if (!result) return "Listo.";
  if (result.skipped && result.skipReason === "fresh") {
    const when = formatRelative(result.lastFinishedAt);
    const last = when ? ` Última sincronización ${lowerFirst(when)}.` : "";
    return `Ya está al día.${last} Las señales se renuevan cada ${SYNC_MINUTES} minutos.`;
  }
  if (result.skipReason === "in_flight") return "Ya hay una sincronización en curso.";
  if (result.freshCount === 0) return "Listo: no hay señales nuevas.";
  if (result.freshCount === 1) return "Listo: 1 señal nueva.";
  return `Listo: ${result.freshCount} señales nuevas.`;
}

/** Una sola solicitud viva: la nueva cancela la anterior (y se cancela al salir de la página). */
function useLatestRequest() {
  const ref = useRef<AbortController | null>(null);
  useEffect(() => () => ref.current?.abort(), []);
  return useCallback(() => {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller.signal;
  }, []);
}

function StatPill({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  // Magenta solo si hay algo que mirar: un cero no es una alerta.
  const alert = strong && value > 0;
  return (
    <div
      className={`mv-panel flex min-w-[8.5rem] shrink-0 flex-col-reverse gap-1 px-4 py-3 ${
        alert ? "!border-[color-mix(in_srgb,var(--p-alert)_45%,transparent)]" : ""
      }`}
    >
      <dt className="text-xs text-[var(--text-secondary)]">{label}</dt>
      <dd className={`font-display text-2xl font-semibold tabular-nums ${alert ? "text-[var(--p-alert)]" : "text-[var(--text-primary)]"}`}>{value}</dd>
    </div>
  );
}

function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  return (
    <nav
      aria-label="Paginación de señales"
      className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <span className="mv-data font-semibold text-[var(--text-primary)]">{total}</span> {total === 1 ? "señal" : "señales"}
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button type="button" className={buttonClass("secondary", "sm", "min-h-11 px-3")} onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Anterior
        </button>
        <span aria-live="polite" className="px-2 text-xs">
          Página <span className="mv-data text-[var(--text-primary)]">{page}</span> de <span className="mv-data">{pages}</span>
        </span>
        <button type="button" className={buttonClass("secondary", "sm", "min-h-11 px-3")} onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export default function ForumSignalsPage() {
  const session = usePwnSession();
  const authenticated = session.status === "authenticated";
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
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const nextRequest = useLatestRequest();
  const resultsRef = useRef<HTMLDivElement>(null);

  // La página vuelve a 1 cuando cambia el filtro o el autor (sin un pedido extra con la página vieja).
  const filterKey = `${activeFilter}|${authorFilter ?? ""}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;

  const load = useCallback(
    async (filter: KindFilter, author: string | null, targetPage: number, silent?: boolean) => {
      const signal = nextRequest();
      if (!silent) setLoading(true);
      const response = await pwnFetch(`/api/pwn/forum-signals?${apiQuery(filter, author, targetPage)}`, { signal });
      if (signal.aborted || (!response.ok && response.reason === "aborted")) return;
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
    },
    [nextRequest],
  );

  // Sin sesión no se pide nada.
  useEffect(() => {
    if (!authenticated) return;
    void load(activeFilter, authorFilter, page);
  }, [authenticated, load, activeFilter, authorFilter, page]);

  // Refresco en segundo plano con la misma ventana que el servidor (10 min), solo con la pestaña visible.
  useEffect(() => {
    if (!authenticated || !live) return;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void load(activeFilter, authorFilter, page, true);
    };
    const id = window.setInterval(tick, FORUM_SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [authenticated, live, load, activeFilter, authorFilter, page]);

  // Cuando el patrullaje del shell trae novedades, se recarga la página actual.
  usePwnFeedRefresh(
    useCallback(() => {
      if (!authenticated || !live) return;
      void load(activeFilter, authorFilter, page, true);
    }, [authenticated, live, load, activeFilter, authorFilter, page]),
  );

  const pagination = result?.ok ? result.data.pagination : null;
  const pages = Math.max(1, pagination?.pages ?? 1);

  // Si la página pedida ya no existe (cambió el total), ir a la última.
  useEffect(() => {
    if (pagination && page > pages) setPageState({ key: filterKey, page: pages });
  }, [pagination, page, pages, filterKey]);

  function goToPage(next: number) {
    const target = Math.min(Math.max(1, next), pages);
    if (target === page) return;
    setPageState({ key: filterKey, page: target });
    resultsRef.current?.scrollIntoView({ block: "start" });
  }

  function toggleLive() {
    setLive((value) => !value);
    // Al reanudar se trae lo último sin esperar al próximo ciclo.
    if (!live && authenticated) void load(activeFilter, authorFilter, page, true);
  }

  async function patrol() {
    if (patrolling) return;
    setPatrolling(true);
    setSyncNote(null);
    setSyncError(null);
    const params = new URLSearchParams();
    // Saltear la ventana de 10 min es solo para administradores (el servidor igual lo comprueba).
    if (session.isAdmin) params.set("force", "1");
    const since = readWatermark();
    if (since) params.set("since", since);
    const query = params.toString();
    const response = await pwnFetch(`/api/pwn/forum-signals${query ? `?${query}` : ""}`, { method: "POST" });
    setPatrolling(false);
    if (!response.ok) {
      if (response.reason === "aborted") return;
      setSyncError(
        response.reason === "unauthorized"
          ? "Tu sesión venció. Iniciá sesión de nuevo para buscar novedades."
          : response.reason === "disabled"
            ? "El ciberpatrullaje no está disponible en este entorno."
            : response.message || "No se pudieron buscar novedades. Probá de nuevo en unos minutos.",
      );
      return;
    }
    const parsed = readForumSync(response.data);
    setSyncNote(syncMessage(parsed));
    if (parsed?.skipReason === "in_flight") return;
    writeWatermark(new Date().toISOString());
    window.dispatchEvent(new Event(PWN_FEEDS_UPDATED));
    if (parsed?.notified) window.dispatchEvent(new Event(PWN_NOTIFICATIONS_UPDATED));
    // En vivo, el evento ya recarga la lista; en pausa se recarga acá.
    if (!live) void load(activeFilter, authorFilter, page, true);
  }

  const items = result?.ok ? result.data.items : [];
  const total = pagination?.total ?? items.length;
  const patrolLabel = session.isAdmin ? "Actualizar ahora" : "Buscar novedades";
  const patrolBusyLabel = session.isAdmin ? "Actualizando…" : "Buscando…";

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Ciberpatrullaje"
        lead="Titulares de foros, stealer logs, robos a empresas y reclamos de ransomware. El archivo ya está en base de datos; acá solo se consultan novedades y te avisamos si entra una filtración nueva. Solo metadatos: autor, título y enlace. Sin volcados ni .onion."
        actions={
          authenticated ? (
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
              <button type="button" className={buttonClass("ghost", "sm", "min-h-11 w-full sm:w-auto")} onClick={toggleLive}>
                {live ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {live ? "Pausar" : "Reanudar"}
              </button>
              <button
                type="button"
                onClick={() => void patrol()}
                disabled={patrolling}
                className={buttonClass("secondary", "sm", "min-h-11 w-full sm:w-auto")}
              >
                <RefreshCw className={`h-4 w-4 ${patrolling ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
                {patrolling ? patrolBusyLabel : patrolLabel}
              </button>
            </>
          ) : undefined
        }
      >
        {authenticated && syncAt ? (
          <p className="text-xs text-[var(--text-tertiary)]">
            Última sincronización: <span className="mv-data">{formatWhen(syncAt) ?? formatRelative(syncAt) ?? syncAt}</span>
          </p>
        ) : null}
        {authenticated ? (
          <div role="status" aria-live="polite">
            {syncNote ? <p className={`${pwnInsetClass} bg-[var(--mv-panel)] text-sm text-[var(--text-secondary)]`}>{syncNote}</p> : null}
          </div>
        ) : null}
        {authenticated && syncError ? <PwnNotice tone="error">{syncError}</PwnNotice> : null}
        {authenticated && authorFilter ? (
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] pl-4 text-sm text-[var(--text-primary)]">
            Autor: <span className="font-semibold text-gold">{authorFilter}</span>
            <Link
              href="/pwn/signals?kind=LEAKS"
              aria-label="Quitar filtro de autor"
              className={`grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] ${focusRing}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        ) : null}
      </PwnPageHeader>

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" ? (
        <UnauthorizedState callbackPath="/pwn/signals" description="El ciberpatrullaje se muestra a cuentas con sesión iniciada." />
      ) : null}

      {authenticated ? (
        <>
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
                  className={`inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color] duration-200 ${focusRing} ${
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
              className={`inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-gold ${focusRing}`}
            >
              Por autor <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </nav>

          <div ref={resultsRef} className="scroll-mt-40 space-y-6">
            {loading ? <LoadingState label="Cargando señales…" /> : null}
            {!loading && result && !result.ok && result.reason === "disabled" ? <DisabledState title="Señales no disponibles" /> : null}
            {!loading && result && !result.ok && result.reason === "unauthorized" ? (
              <UnauthorizedState callbackPath="/pwn/signals" description="El ciberpatrullaje se muestra a cuentas con sesión iniciada." />
            ) : null}
            {!loading && result && !result.ok && result.reason !== "disabled" && result.reason !== "unauthorized" ? (
              <ErrorState message={result.message} onRetry={() => void load(activeFilter, authorFilter, page)} />
            ) : null}

            {!loading && result?.ok && items.length === 0 ? (
              <EmptyState
                title="Nada en este filtro"
                description="El archivo se mantiene en segundo plano. Si este filtro sigue vacío, probá Stealer logs, Empresas o Todas."
                action={
                  <Link href="/pwn/signals?kind=ALL" className={buttonClass("secondary", "sm", "min-h-11")}>
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
                      item.isGovernment || item.isBolivia ? "!border-[color-mix(in_srgb,var(--p-alert)_45%,transparent)]" : pwnUnverifiedCardClass
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
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--text-tertiary)]">
                      {item.author ? (
                        <>
                          <Link
                            href={`/pwn/signals?author=${encodeURIComponent(item.author)}`}
                            className={`inline-flex min-h-11 items-center font-medium text-gold underline-offset-4 hover:underline ${focusRing}`}
                          >
                            {item.author}
                          </Link>
                          <span aria-hidden>·</span>
                        </>
                      ) : null}
                      {item.forum ? (
                        <>
                          <span className="inline-flex min-h-11 items-center">{item.forum}</span>
                          <span aria-hidden>·</span>
                        </>
                      ) : null}
                      <span className="mv-data inline-flex min-h-11 items-center">
                        {formatWhen(item.publishedAt) ?? formatRelative(item.lastSeenAt) ?? "Fecha no indicada"}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <SourceBadge source={item.source} href={item.link} />
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mv-link inline-flex min-h-11 items-center gap-1 text-sm ${focusRing}`}
                      >
                        Abrir en la fuente <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only"> (abre en otra pestaña)</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {result?.ok && pages > 1 ? <Pager page={page} pages={pages} total={total} onPage={goToPage} /> : null}
          </div>
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
