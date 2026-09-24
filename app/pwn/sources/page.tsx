"use client";

import { useCallback, useEffect, useState } from "react";
import { pwnFetch } from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { focusRing, formatWhen } from "@/components/pwn/format";
import { Button } from "@/components/ui/button";

type SourceHealth = {
  name: string;
  group: "api" | "feed";
  configured: boolean;
  status: string;
  enabled: boolean;
  lastStatus: string | null;
  lastAt: string | null;
  lastError: string | null;
};

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: SourceHealth[] };

function readSources(body: unknown): SourceHealth[] {
  const data = (body as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as {
      name?: unknown;
      group?: unknown;
      configured?: unknown;
      status?: unknown;
      source?: { enabled?: unknown } | null;
      lastIngestionJob?: { status?: unknown; finishedAt?: unknown; startedAt?: unknown; error?: unknown } | null;
    };
    if (typeof row.name !== "string") return [];
    const job = row.lastIngestionJob;
    return [
      {
        name: row.name,
        group: row.group === "feed" ? "feed" : "api",
        configured: row.configured === true,
        status: typeof row.status === "string" ? row.status : "UNKNOWN",
        enabled: row.source?.enabled !== false,
        lastStatus: typeof job?.status === "string" ? job.status : null,
        lastAt: typeof job?.finishedAt === "string" ? job.finishedAt : typeof job?.startedAt === "string" ? job.startedAt : null,
        lastError: typeof job?.error === "string" ? job.error : null,
      },
    ];
  });
}

export default function SourcesPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/sources", { signal });
    if (signal?.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      if (response.reason === "disabled") setStatus({ kind: "disabled" });
      else if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "forbidden") setStatus({ kind: "forbidden" });
      else setStatus({ kind: "error", message: response.message });
      return;
    }
    setStatus({ kind: "ready", items: readSources(response.data) });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function toggleSource(name: string, enabled: boolean) {
    setBusy(name);
    const response = await pwnFetch("/api/pwn/sources", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, enabled }),
    });
    setBusy(null);
    if (!response.ok) return;
    void load();
  }

  const feeds = status.kind === "ready" ? status.items.filter((i) => i.group === "feed") : [];
  const apis = status.kind === "ready" ? status.items.filter((i) => i.group === "api") : [];

  function renderList(items: SourceHealth[]) {
    return (
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name} className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-white">{item.name}</h2>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${focusRing} ${
                  item.configured && item.enabled ? "border-gold/40 text-gold" : "border-white/10 text-gray-400"
                }`}
              >
                {!item.configured ? "Sin configurar" : item.enabled ? item.status : "Desactivado"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Último trabajo: {item.lastStatus ?? "ninguno"}
              {item.lastAt ? ` · ${formatWhen(item.lastAt) ?? item.lastAt}` : ""}
            </p>
            {item.lastError ? <p className="mt-2 text-sm text-red-200">{item.lastError}</p> : null}
            {item.group === "feed" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy === item.name}
                  className={`rounded-xl border-white/10 text-white ${focusRing}`}
                  onClick={() => void toggleSource(item.name, !item.enabled)}
                >
                  {item.enabled ? "Desactivar feed" : "Activar feed"}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <FadeIn className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Fuentes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
          Conectores oficiales y feeds de titulares. Puedes desactivar foros o RSS ruidosos; el ciclo horario respeta el interruptor.
        </p>
      </header>
      {status.kind === "loading" ? <LoadingState label="Cargando fuentes…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Pwn no está activado" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/sources" /> : null}
      {status.kind === "forbidden" ? (
        <EmptyState title="Solo administración" description="La salud de las fuentes está reservada a cuentas con rol ADMIN." />
      ) : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}
      {status.kind === "ready" ? (
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-xl text-white">APIs</h2>
            {renderList(apis)}
          </section>
          <section>
            <h2 className="font-display text-xl text-white">Foros y RSS</h2>
            {renderList(feeds)}
          </section>
        </div>
      ) : null}
    </FadeIn>
  );
}
