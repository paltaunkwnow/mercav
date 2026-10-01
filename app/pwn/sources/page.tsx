"use client";

import { useCallback, useEffect, useState } from "react";
import { pwnFetch } from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatWhen, pwnCardClass } from "@/components/pwn/format";
import { PwnPageHeader, PwnSectionHeading, pwnErrorTextClass } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";

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
    if (!items.length) {
      return <p className="rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-sm text-[var(--text-secondary)]">Sin fuentes en este grupo.</p>;
    }
    return (
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const on = item.configured && item.enabled;
          return (
            <li key={item.name} className={`${pwnCardClass} flex flex-col ${on ? "" : "border-dashed"}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="mv-data min-w-0 break-all text-sm font-semibold text-[var(--text-primary)] md:text-base">{item.name}</h3>
                <span
                  className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold ${
                    on ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold" : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)]"
                  }`}
                >
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${on ? "bg-gold" : "bg-[var(--text-tertiary)]"}`} />
                  {!item.configured ? "Sin configurar" : item.enabled ? item.status : "Desactivado"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Último trabajo: {item.lastStatus ?? "ninguno"}
                {item.lastAt ? <span className="mv-data text-[var(--text-tertiary)]">{` · ${formatWhen(item.lastAt) ?? item.lastAt}`}</span> : ""}
              </p>
              {item.lastError ? <p className={`mt-2 break-words ${pwnErrorTextClass}`}>{item.lastError}</p> : null}
              {item.group === "feed" ? (
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    disabled={busy === item.name}
                    className={buttonClass(item.enabled ? "ghost" : "secondary", "sm", "w-full sm:w-auto")}
                    onClick={() => void toggleSource(item.name, !item.enabled)}
                  >
                    {item.enabled ? "Desactivar feed" : "Activar feed"}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Fuentes"
        title="De dónde sale cada dato."
        lead="Conectores oficiales y feeds de titulares. Podés desactivar foros o RSS ruidosos; el patrullaje de Pwn respeta el interruptor."
      />
      {status.kind === "loading" ? <LoadingState label="Cargando fuentes…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Pwn no está activado" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/sources" /> : null}
      {status.kind === "forbidden" ? (
        <EmptyState title="Solo administración" description="La salud de las fuentes está reservada a cuentas con rol ADMIN." />
      ) : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}
      {status.kind === "ready" ? (
        <div className="space-y-12">
          <section aria-labelledby="pwn-sources-apis" className="space-y-5">
            <PwnSectionHeading id="pwn-sources-apis" title="APIs" lead="Conectores oficiales." />
            {renderList(apis)}
          </section>
          <section aria-labelledby="pwn-sources-feeds" className="space-y-5">
            <PwnSectionHeading id="pwn-sources-feeds" title="Foros y RSS" lead="Titulares de la lista permitida. Solo metadatos." />
            {renderList(feeds)}
          </section>
        </div>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
