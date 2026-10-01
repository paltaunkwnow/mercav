"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pwnFetch, readAlerts, type AlertView, type Pagination } from "@/components/pwn/api";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls } from "@/components/pwn/ListControls";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatStatus, formatWhen, pwnCardClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { BellRing, CheckCheck } from "lucide-react";

const PAGE_SIZE = 20;

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

const TARGET_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: AlertView[]; pagination: Pagination | null };

export default function AlertsPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const unreadOnly = filter === "unread";

  const load = useCallback(async (targetPage: number, onlyUnread: boolean, signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
    if (onlyUnread) params.set("unread", "true");
    const response = await pwnFetch(`/api/pwn/alerts?${params.toString()}`, { signal });
    if (signal?.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      setStatus(response.reason === "disabled" ? { kind: "disabled" } : response.reason === "unauthorized" ? { kind: "unauthorized" } : { kind: "error", message: response.message });
      return;
    }
    const { items, pagination } = readAlerts(response.data);
    setStatus({ kind: "ready", items, pagination });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(page, unreadOnly, controller.signal);
    return () => controller.abort();
  }, [load, page, unreadOnly]);

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
      else if (response.reason === "disabled") setNotice("Marcar como leída no está configurado.");
      else setNotice(response.message);
      return;
    }
    if (unreadOnly || "all" in target) {
      await load(page, unreadOnly);
      return;
    }
    setStatus((current) => {
      if (current.kind !== "ready") return current;
      return { ...current, items: current.items.map((item) => (item.id === target.id ? { ...item, read: true, status: "READ" } : item)) };
    });
  }

  const visible = useMemo(() => {
    if (status.kind !== "ready") return [];
    const q = query.trim().toLowerCase();
    const filtered = status.items.filter((item) => {
      if (filter === "read" && !item.read) return false;
      if (filter === "critical" && (item.severity ?? "").toUpperCase() !== "CRITICAL") return false;
      if (!q) return true;
      return [item.title, item.body, item.targetDisplay, item.source].join(" ").toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "severity") {
        return (SEVERITY_RANK[(a.severity ?? "").toUpperCase()] ?? 9) - (SEVERITY_RANK[(b.severity ?? "").toUpperCase()] ?? 9);
      }
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [status, query, filter, sort]);

  const total = status.kind === "ready" ? (status.pagination?.total ?? status.items.length) : 0;
  const pages = status.kind === "ready" ? Math.max(1, status.pagination?.pages ?? 1) : 1;
  const hasUnread = status.kind === "ready" && status.items.some((item) => !item.read);

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Alertas"
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
              Marcar todas como leídas
            </button>
          ) : null
        }
      />
      {notice ? <PwnNotice tone="neutral">{notice}</PwnNotice> : null}

      {status.kind === "loading" ? <LoadingState label="Cargando alertas…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Alertas no configuradas" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/alerts" /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load(page, unreadOnly)} /> : null}
      {status.kind === "ready" && total === 0 && !unreadOnly ? <EmptyState icon={<BellRing className="h-5 w-5" aria-hidden />} title="No hay alertas" description="Cuando un objetivo produzca un aviso, va a aparecer acá." /> : null}

      {status.kind === "ready" && (total > 0 || unreadOnly) ? (
        <>
          <ListControls
            query={query}
            onQuery={setQuery}
            queryLabel="Buscar en esta página"
            filter={filter}
            onFilter={(value) => {
              setFilter(value);
              setPage(1);
            }}
            filterLabel="Estado"
            filterOptions={[
              { value: "all", label: "Todas" },
              { value: "unread", label: "No leídas" },
              { value: "read", label: "Leídas" },
              { value: "critical", label: "Críticas" },
            ]}
            sort={sort}
            onSort={setSort}
            sortOptions={[
              { value: "recent", label: "Más recientes" },
              { value: "severity", label: "Severidad" },
            ]}
            page={Math.min(page, pages)}
            pages={pages}
            total={total}
            onPage={(next) => setPage(Math.min(Math.max(1, next), pages))}
          />
          {visible.length === 0 ? <EmptyState title="Ninguna alerta con estos filtros" /> : null}
          <ul className="space-y-4">
            {visible.map((item) => (
              <li key={item.id} className={`${pwnCardClass} ${item.read ? "" : "!border-[var(--color-border-gold)]"}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="mv-h3 flex items-start gap-2.5">
                    {!item.read ? <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-gold" /> : null}
                    <span>{item.title}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RiskBadge level={item.severity} />
                    <span className="inline-flex h-6 items-center rounded-full border border-[var(--mv-hairline-strong)] px-2.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {item.read ? "Leída" : "No leída"}
                    </span>
                  </div>
                </div>
                {item.body ? <p className="mv-body mt-3">{item.body}</p> : null}
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
                      disabled={pendingId === item.id}
                      onClick={() => void markRead({ id: item.id })}
                      className={buttonClass("secondary", "sm", "w-full sm:w-auto")}
                    >
                      Marcar como leída
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
