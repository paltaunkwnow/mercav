"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pwnFetch, readAlerts, type AlertView, type Pagination } from "@/components/pwn/api";
import { AlertBody } from "@/components/pwn/AlertBody";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls } from "@/components/pwn/ListControls";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { formatStatus, formatWhen, pwnCardClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { BellRing, CheckCheck } from "@/components/icons";

const PAGE_SIZE = 20;
const QUERY_MAX = 120;
const QUERY_DEBOUNCE_MS = 300;

const TARGET_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

type StatusFilter = "all" | "unread" | "read" | "critical";
type Sort = "recent" | "severity";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "No leídas" },
  { value: "read", label: "Leídas" },
  { value: "critical", label: "Críticas" },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "severity", label: "Severidad" },
];

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: AlertView[]; pagination: Pagination | null };

type Params = { page: number; q: string; status: StatusFilter; sort: Sort };

function asStatusFilter(value: string): StatusFilter {
  return FILTER_OPTIONS.find((option) => option.value === value)?.value ?? "all";
}

function asSort(value: string): Sort {
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? "recent";
}

function alertsUrl({ page, q, status, sort }: Params) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  return `/api/pwn/alerts?${params.toString()}`;
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

export default function AlertsPage() {
  const session = usePwnSession();
  const authenticated = session.status === "authenticated";
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "neutral"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const nextRequest = useLatestRequest();

  const load = useCallback(
    async (params: Params) => {
      const signal = nextRequest();
      setBusy(true);
      // Si ya hay alertas, quedan a la vista mientras llega la página nueva.
      setStatus((current) => (current.kind === "ready" ? current : { kind: "loading" }));
      const response = await pwnFetch(alertsUrl(params), { signal });
      if (signal.aborted || (!response.ok && response.reason === "aborted")) return;
      setBusy(false);
      if (!response.ok) {
        setStatus(
          response.reason === "disabled"
            ? { kind: "disabled" }
            : response.reason === "unauthorized"
              ? { kind: "unauthorized" }
              : { kind: "error", message: response.message },
        );
        return;
      }
      const { items, pagination } = readAlerts(response.data);
      setStatus({ kind: "ready", items, pagination });
    },
    [nextRequest],
  );

  // La búsqueda va al servidor 300 ms después de dejar de escribir y vuelve a la página 1.
  useEffect(() => {
    const next = query.trim().slice(0, QUERY_MAX);
    if (next === appliedQuery) return;
    const id = window.setTimeout(() => {
      setAppliedQuery(next);
      setPage(1);
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query, appliedQuery]);

  // Sin sesión no se pide nada.
  useEffect(() => {
    if (!authenticated) return;
    void load({ page, q: appliedQuery, status: filter, sort });
  }, [authenticated, load, page, appliedQuery, filter, sort]);

  const serverPages = status.kind === "ready" ? Math.max(1, status.pagination?.pages ?? 1) : null;

  // Si la página pedida ya no existe (por ejemplo, al marcar todas con "No leídas"), ir a la última.
  useEffect(() => {
    if (serverPages !== null && page > serverPages) setPage(serverPages);
  }, [serverPages, page]);

  async function markRead(target: { id: string } | { all: true }) {
    setNotice(null);
    setPendingId("id" in target ? target.id : "all");
    const response = await pwnFetch("/api/pwn/alerts/read", {
      method: "POST",
      body: JSON.stringify(target),
    });
    setPendingId(null);
    if (!response.ok) {
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "disabled") setNotice({ tone: "neutral", text: "Marcar como leída no está configurado." });
      else setNotice({ tone: "error", text: response.message });
      return;
    }
    // Se marca al instante y después se recarga la página actual con los filtros del servidor.
    setStatus((current) => {
      if (current.kind !== "ready") return current;
      return {
        ...current,
        items: current.items.map((item) => ("all" in target || item.id === target.id ? { ...item, read: true, status: "READ" } : item)),
      };
    });
    await load({ page, q: appliedQuery, status: filter, sort });
  }

  const hasFilters = appliedQuery !== "" || filter !== "all";
  const total = status.kind === "ready" ? (status.pagination?.total ?? status.items.length) : 0;
  const pages = serverPages ?? 1;
  const showList = status.kind === "ready" && (total > 0 || hasFilters || query.trim() !== "");
  const hasUnread = authenticated && status.kind === "ready" && status.items.some((item) => !item.read);

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Lo que cambió en tus objetivos."
        lead="Avisos generados a partir de tus objetivos autorizados y de las fuentes consultadas."
        actions={
          hasUnread ? (
            <button
              type="button"
              disabled={pendingId === "all"}
              onClick={() => void markRead({ all: true })}
              className={buttonClass("secondary", "md", "w-full sm:w-auto")}
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              {pendingId === "all" ? "Marcando…" : "Marcar todas como leídas"}
            </button>
          ) : null
        }
      />

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" ? (
        <UnauthorizedState callbackPath="/pwn/alerts" description="Las alertas salen de los objetivos de tu cuenta: iniciá sesión para verlas." />
      ) : null}

      {authenticated ? (
        <>
          {notice ? <PwnNotice tone={notice.tone}>{notice.text}</PwnNotice> : null}

          {status.kind === "loading" ? <LoadingState label="Cargando alertas…" /> : null}
          {status.kind === "disabled" ? <DisabledState title="Alertas no configuradas" /> : null}
          {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/alerts" /> : null}
          {status.kind === "error" ? (
            <ErrorState message={status.message} onRetry={() => void load({ page, q: appliedQuery, status: filter, sort })} />
          ) : null}
          {status.kind === "ready" && !showList ? (
            <EmptyState
              icon={<BellRing className="h-5 w-5" aria-hidden />}
              title="No hay alertas"
              description="Cuando un objetivo produzca un aviso, va a aparecer acá."
            />
          ) : null}

          {status.kind === "ready" && showList ? (
            <>
              <ListControls
                query={query}
                onQuery={setQuery}
                queryLabel="Buscar alertas"
                filter={filter}
                onFilter={(value) => {
                  setFilter(asStatusFilter(value));
                  setPage(1);
                }}
                filterLabel="Estado"
                filterOptions={FILTER_OPTIONS}
                sort={sort}
                onSort={(value) => {
                  setSort(asSort(value));
                  setPage(1);
                }}
                sortOptions={SORT_OPTIONS}
                page={Math.min(page, pages)}
                pages={pages}
                total={total}
                onPage={(next) => setPage(Math.min(Math.max(1, next), pages))}
              />
              <p className="sr-only" role="status" aria-live="polite">
                {busy ? "Actualizando alertas…" : ""}
              </p>
              {status.items.length === 0 ? (
                <EmptyState title="Ninguna alerta con estos filtros" description="Probá con otra búsqueda o cambiá el estado." />
              ) : null}
              <ul aria-busy={busy} className={`space-y-4 transition-opacity duration-200 ${busy ? "opacity-60" : ""}`}>
                {status.items.map((item) => (
                  <li
                    key={item.id}
                    className={`${pwnCardClass} ${item.read ? "" : "!border-[color-mix(in_srgb,var(--p-alert)_45%,transparent)]"}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className="mv-h3 flex items-start gap-2.5">
                        {!item.read ? <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[var(--p-alert)]" /> : null}
                        <span>{item.title}</span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RiskBadge level={item.severity} />
                        <span className="inline-flex h-6 items-center rounded-full border border-[var(--mv-hairline-strong)] px-2.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                          {item.read ? "Leída" : "No leída"}
                        </span>
                      </div>
                    </div>
                    <AlertBody body={item.body} />
                    <MetaGrid className="lg:grid-cols-3">
                      {item.targetDisplay ? (
                        <Meta label={`Objetivo${item.targetType && TARGET_LABEL[item.targetType] ? ` (${TARGET_LABEL[item.targetType]})` : ""}`} mono>
                          {item.targetDisplay}
                        </Meta>
                      ) : null}
                      <Meta label="Creada">{formatWhen(item.createdAt) ?? "No indicada"}</Meta>
                      {formatStatus(item.status) ? <Meta label="Estado">{formatStatus(item.status)}</Meta> : null}
                    </MetaGrid>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <SourceBadge source={item.source} />
                      {!item.read ? (
                        <button
                          type="button"
                          disabled={pendingId === item.id || pendingId === "all"}
                          onClick={() => void markRead({ id: item.id })}
                          aria-label={`Marcar como leída: ${item.title}`}
                          className={buttonClass("secondary", "sm", "min-h-11 w-full sm:w-auto")}
                        >
                          {pendingId === item.id ? "Marcando…" : "Marcar como leída"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
