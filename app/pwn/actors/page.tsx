"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { pwnFetch } from "@/components/pwn/api";
import { GovernmentPriorityBadge, SignalKindBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { focusRing, formatRelative } from "@/components/pwn/format";

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
    <FadeIn className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Autores</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Handles de foros y grupos que publican filtraciones. Un autor puede ser un vendedor de stealer logs o un grupo que reclama el robo a una empresa.
        </p>
      </header>

      {status.kind === "loading" ? <LoadingState label="Agrupando por autor…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Autores no disponibles" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/actors" /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}
      {status.kind === "ready" && status.items.length === 0 ? (
        <EmptyState
          title="Todavía no hay autores"
          description="Los autores aparecen cuando el archivo de Pwn guarda señales. Eso ocurre en segundo plano, no al entrar."
          action={
            <Link href="/pwn/signals" className={`text-sm text-gold underline-offset-4 hover:underline ${focusRing}`}>
              Ir a ciberpatrullaje
            </Link>
          }
        />
      ) : null}

      {status.kind === "ready" && status.items.length > 0 ? (
        <ul className="space-y-3">
          {status.items.map((item) => (
            <li key={item.author} className="rounded-3xl border border-white/10 bg-bg-secondary/70 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/pwn/signals?author=${encodeURIComponent(item.author)}`}
                  className={`font-display text-2xl text-white underline-offset-4 hover:text-gold hover:underline ${focusRing}`}
                >
                  {item.author}
                </Link>
                <GovernmentPriorityBadge active={item.isGovernment} />
                {item.kinds.map((kind) => (
                  <SignalKindBadge key={kind} kind={kind} />
                ))}
                {item.forum ? <span className="text-xs text-gray-500">{item.forum}</span> : null}
              </div>
              <p className="mt-2 font-mono text-xs text-gray-500">
                {item.signalCount === 1 ? "1 señal" : `${item.signalCount} señales`}
                {item.lastSeenAt ? ` · ${formatRelative(item.lastSeenAt) ?? item.lastSeenAt}` : ""}
              </p>
              {item.latestTitle ? <p className="mt-3 text-sm text-gray-300">{item.latestTitle}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </FadeIn>
  );
}
