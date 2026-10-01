"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { pwnFetch } from "@/components/pwn/api";
import { GovernmentPriorityBadge, SignalKindBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { focusRing, formatRelative } from "@/components/pwn/format";
import { PwnPageHeader } from "@/components/pwn/ui";
import { ArrowUpRight } from "lucide-react";

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
  | { kind: "ready"; items: ActorRow[] };

function readActors(body: unknown): ActorRow[] {
  const data = (body as { data?: { items?: unknown } })?.data;
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.flatMap((item) => {
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
  });
}

export default function ForumActorsPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const load = useCallback(async (signal?: AbortSignal, silent?: boolean) => {
    if (!silent) setStatus({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/actors?page=1&limit=40", { signal });
    if (signal?.aborted || (!response.ok && response.reason === "aborted")) return;
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
    setStatus({ kind: "ready", items: readActors(response.data) });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  usePwnFeedRefresh(
    useCallback(() => {
      void load(undefined, true);
    }, [load]),
  );

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Autores"
        title="Quién publica las filtraciones."
        lead="Handles de foros y grupos que publican filtraciones. Un autor puede ser un vendedor de stealer logs o un grupo que reclama el robo a una empresa."
      />

      {status.kind === "loading" ? <LoadingState label="Agrupando por autor…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Autores no disponibles" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/actors" /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}
      {status.kind === "ready" && status.items.length === 0 ? (
        <EmptyState
          title="Todavía no hay autores"
          description="Los autores aparecen cuando el archivo de Pwn guarda señales. Eso ocurre en segundo plano, no al entrar."
          action={
            <Link href="/pwn/signals" className={`mv-link text-sm ${focusRing}`}>
              Ir a ciberpatrullaje
            </Link>
          }
        />
      ) : null}

      {status.kind === "ready" && status.items.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {status.items.map((item) => (
            <li key={item.author}>
              <Link
                href={`/pwn/signals?author=${encodeURIComponent(item.author)}`}
                className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col rounded-[1.5rem] p-5 md:p-6"
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
      ) : null}
    </FadeIn>
  );
}
