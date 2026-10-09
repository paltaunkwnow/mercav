"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { pwnFetch, readPagination, type Pagination } from "@/components/pwn/api";
import { GovernmentPriorityBadge, SignalKindBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { focusRing, formatRelative, pwnCardClass } from "@/components/pwn/format";
import { PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "@/components/icons";

const PAGE_SIZE = 40;

type ActorRow = {
  author: string;
  signalCount: number;
  lastSeenAt: string | null;
  latestTitle: string | null;
  latestLink: string | null;
  forum: string | null;
  kinds: string[];
  isGovernment: boolean;
};

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: ActorRow[]; pagination: Pagination | null };

function readActors(body: unknown): { items: ActorRow[]; pagination: Pagination | null } {
  const data = (body as { data?: { items?: unknown; pagination?: unknown } })?.data;
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (typeof row.author !== "string") return [];
      return [
        {
          author: row.author,
          signalCount: typeof row.signalCount === "number" ? row.signalCount : 0,
          lastSeenAt: typeof row.lastSeenAt === "string" ? row.lastSeenAt : null,
          latestTitle: typeof row.latestTitle === "string" ? row.latestTitle : null,
          latestLink: typeof row.latestLink === "string" ? row.latestLink : null,
          forum: typeof row.forum === "string" ? row.forum : null,
          kinds: Array.isArray(row.kinds) ? row.kinds.filter((kind): kind is string => typeof kind === "string") : [],
          isGovernment: row.isGovernment === true,
        },
      ];
    }),
    pagination: readPagination({ pagination: data?.pagination }),
  };
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

function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  return (
    <nav
      aria-label="Paginación de autores"
      className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <span className="mv-data font-semibold text-[var(--text-primary)]">{total}</span> {total === 1 ? "autor" : "autores"}
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

export default function ForumActorsPage() {
  const session = usePwnSession();
  const authenticated = session.status === "authenticated";
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const nextRequest = useLatestRequest();
  const resultsRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (targetPage: number, silent?: boolean) => {
      const signal = nextRequest();
      // El refresco en segundo plano no atenúa la lista; un cambio de página sí.
      if (!silent) {
        setBusy(true);
        setStatus((current) => (current.kind === "ready" ? current : { kind: "loading" }));
      }
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
      const response = await pwnFetch(`/api/pwn/actors?${params.toString()}`, { signal });
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
      setStatus({ kind: "ready", ...readActors(response.data) });
    },
    [nextRequest],
  );

  // Sin sesión no se pide nada.
  useEffect(() => {
    if (!authenticated) return;
    void load(page);
  }, [authenticated, load, page]);

  // Cuando el patrullaje trae novedades, se recarga la página actual (cancelando la anterior).
  usePwnFeedRefresh(
    useCallback(() => {
      if (!authenticated) return;
      void load(page, true);
    }, [authenticated, load, page]),
  );

  const serverPages = status.kind === "ready" ? Math.max(1, status.pagination?.pages ?? 1) : null;

  // Si la página pedida ya no existe (cambió el total), ir a la última.
  useEffect(() => {
    if (serverPages !== null && page > serverPages) setPage(serverPages);
  }, [serverPages, page]);

  const pages = serverPages ?? 1;
  const total = status.kind === "ready" ? (status.pagination?.total ?? status.items.length) : 0;

  function goToPage(next: number) {
    const target = Math.min(Math.max(1, next), pages);
    if (target === page) return;
    setPage(target);
    resultsRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Quién publica las filtraciones."
        lead="Handles de foros y grupos que publican filtraciones. Un autor puede ser un vendedor de stealer logs o un grupo que reclama el robo a una empresa."
      />

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" ? (
        <UnauthorizedState callbackPath="/pwn/actors" description="Los autores del ciberpatrullaje se muestran a cuentas con sesión iniciada." />
      ) : null}

      {authenticated ? (
        <div ref={resultsRef} className="scroll-mt-40 space-y-6">
          {status.kind === "loading" ? <LoadingState label="Agrupando por autor…" /> : null}
          {status.kind === "disabled" ? <DisabledState title="Autores no disponibles" /> : null}
          {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/actors" /> : null}
          {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load(page)} /> : null}
          {status.kind === "ready" && status.items.length === 0 && total === 0 ? (
            <EmptyState
              title="Todavía no hay autores"
              description="Los autores aparecen cuando el archivo de Pwn guarda señales. Eso ocurre en segundo plano, no al entrar."
              action={
                <Link href="/pwn/signals" className={`mv-link inline-flex min-h-11 items-center text-sm ${focusRing}`}>
                  Ir a ciberpatrullaje
                </Link>
              }
            />
          ) : null}

          {status.kind === "ready" && status.items.length > 0 ? (
            <>
              <p className="sr-only" role="status" aria-live="polite">
                {busy ? "Actualizando autores…" : ""}
              </p>
              <ul aria-busy={busy} className={`grid gap-3 transition-opacity duration-200 md:grid-cols-2 ${busy ? "opacity-60" : ""}`}>
                {status.items.map((item) => (
                  <li key={item.author}>
                    <Link
                      href={`/pwn/signals?author=${encodeURIComponent(item.author)}`}
                      className={`${pwnCardClass} mv-panel-interactive mv-focus group flex h-full flex-col`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="mv-h3 break-words transition-colors duration-200 group-hover:text-gold">{item.author}</h2>
                          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                            <span className="mv-data text-[var(--text-secondary)]">{item.signalCount === 1 ? "1 señal" : `${item.signalCount} señales`}</span>
                            {item.lastSeenAt ? ` · ${formatRelative(item.lastSeenAt) ?? item.lastSeenAt}` : ""}
                            {item.forum ? ` · ${item.forum}` : ""}
                          </p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-colors duration-200 group-hover:text-gold" aria-hidden />
                      </div>
                      {item.isGovernment || item.kinds.length ? (
                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          <GovernmentPriorityBadge active={item.isGovernment} />
                          {item.kinds.map((kind) => (
                            <SignalKindBadge key={kind} kind={kind} />
                          ))}
                        </div>
                      ) : null}
                      {item.latestTitle ? (
                        <p className="mt-4 border-t border-[var(--mv-hairline)] pt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                          <span className="block text-xs text-[var(--text-tertiary)]">Último titular</span>
                          {item.latestTitle}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {status.kind === "ready" && pages > 1 ? <Pager page={Math.min(page, pages)} pages={pages} total={total} onPage={goToPage} /> : null}
        </div>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
