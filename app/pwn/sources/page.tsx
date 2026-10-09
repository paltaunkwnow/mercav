"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pwnFetch } from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { formatWhen, pwnCardClass, pwnInsetClass, pwnWarnToneClass } from "@/components/pwn/format";
import { PwnNotice, PwnPageHeader, PwnSectionHeading, pwnErrorTextClass } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { Lock } from "@/components/icons";

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

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Disponible",
  DEGRADED: "Con fallas",
  DISABLED: "Desactivada",
  NOT_CONFIGURED: "Sin configurar",
};

// Tokens de Pwn: verde (gold) disponible, amarillo con fallas, neutro apagada o sin configurar.
const STATUS_TONE: Record<string, string> = {
  AVAILABLE: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold",
  DEGRADED: pwnWarnToneClass,
  DISABLED: "border-[var(--mv-hairline-strong)] bg-transparent text-[var(--text-secondary)]",
  NOT_CONFIGURED: "border-dashed border-[var(--mv-hairline-strong)] bg-transparent text-[var(--text-tertiary)]",
};

const JOB_LABEL: Record<string, string> = { SUCCESS: "correcto", FAILED: "falló", RUNNING: "en curso" };

/** Un AbortController por tipo de pedido: el nuevo cancela al anterior y al desmontar se cancela todo. */
function useAbortSlot() {
  const ref = useRef<AbortController | null>(null);
  useEffect(() => () => ref.current?.abort(), []);
  return useCallback(() => {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller.signal;
  }, []);
}

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
  const session = usePwnSession();
  const canLoad = session.status === "authenticated" && session.isAdmin;
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextLoadSignal = useAbortSlot();
  const nextToggleSignal = useAbortSlot();

  /** quiet: refresca sin volver al estado de carga (después de un cambio). */
  const load = useCallback(
    async (quiet = false) => {
      const signal = nextLoadSignal();
      if (!quiet) setStatus({ kind: "loading" });
      const response = await pwnFetch("/api/pwn/sources", { signal });
      if (signal.aborted || (!response.ok && response.reason === "aborted")) return;
      if (!response.ok) {
        if (response.reason === "disabled") setStatus({ kind: "disabled" });
        else if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
        else if (response.reason === "forbidden") setStatus({ kind: "forbidden" });
        else setStatus({ kind: "error", message: response.message });
        return;
      }
      setStatus({ kind: "ready", items: readSources(response.data) });
    },
    [nextLoadSignal],
  );

  // Sin sesión de administración no se pide nada.
  useEffect(() => {
    if (canLoad) void load();
  }, [canLoad, load]);

  async function toggleSource(item: SourceHealth) {
    const enabled = !item.enabled;
    setBusy(item.name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[item.name];
      return next;
    });
    const signal = nextToggleSignal();
    const response = await pwnFetch("/api/pwn/sources", {
      method: "PATCH",
      body: JSON.stringify({ name: item.name, enabled }),
      signal,
    });
    if (signal.aborted) return;
    setBusy(null);
    if (!response.ok) {
      if (response.reason === "aborted") return;
      if (response.reason === "unauthorized") {
        setStatus({ kind: "unauthorized" });
        return;
      }
      setErrors((prev) => ({
        ...prev,
        [item.name]: response.message || (enabled ? "No se pudo activar el feed. Probá de nuevo." : "No se pudo desactivar el feed. Probá de nuevo."),
      }));
      return;
    }
    // Se refleja ya y se confirma con el estado que devuelve la API.
    setStatus((prev) =>
      prev.kind === "ready"
        ? { kind: "ready", items: prev.items.map((source) => (source.name === item.name ? { ...source, enabled } : source)) }
        : prev,
    );
    void load(true);
  }

  const feeds = status.kind === "ready" ? status.items.filter((i) => i.group === "feed") : [];
  const apis = status.kind === "ready" ? status.items.filter((i) => i.group === "api") : [];

  function renderList(items: SourceHealth[]) {
    if (!items.length) {
      return <p className={`${pwnInsetClass} border-dashed text-sm text-[var(--text-secondary)]`}>Sin fuentes en este grupo.</p>;
    }
    return (
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const label = STATUS_LABEL[item.status] ?? item.status;
          const tone = STATUS_TONE[item.status] ?? STATUS_TONE.DISABLED;
          const jobLabel = item.lastStatus ? (JOB_LABEL[item.lastStatus] ?? item.lastStatus) : "ninguno";
          return (
            <li key={item.name} className={`${pwnCardClass} flex flex-col`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="mv-data min-w-0 break-all text-sm font-semibold text-[var(--text-primary)] md:text-base">{item.name}</h3>
                <span className={`inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold ${tone}`}>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  <span className="sr-only">Estado: </span>
                  {label}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Último trabajo: {jobLabel}
                {item.lastAt ? <span className="mv-data text-[var(--text-tertiary)]">{` · ${formatWhen(item.lastAt) ?? item.lastAt}`}</span> : ""}
              </p>
              {item.lastError ? <p className={`mt-2 break-words ${pwnErrorTextClass}`}>{item.lastError}</p> : null}
              {errors[item.name] ? (
                <div className="mt-3">
                  <PwnNotice tone="error">{errors[item.name]}</PwnNotice>
                </div>
              ) : null}
              {item.group === "feed" ? (
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    disabled={busy !== null}
                    aria-label={item.enabled ? `Desactivar feed ${item.name}` : `Activar feed ${item.name}`}
                    className={buttonClass(item.enabled ? "ghost" : "secondary", "sm", "min-h-11 w-full sm:w-auto")}
                    onClick={() => void toggleSource(item)}
                  >
                    {busy === item.name ? (item.enabled ? "Desactivando…" : "Activando…") : item.enabled ? "Desactivar feed" : "Activar feed"}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  const adminOnly = (
    <EmptyState
      icon={<Lock className="h-5 w-5" aria-hidden />}
      title="Solo administración"
      description="La salud de las fuentes está reservada a cuentas con rol ADMIN."
    />
  );

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="De dónde sale cada dato."
        lead="Conectores oficiales y feeds de titulares. Podés desactivar foros o RSS ruidosos; el patrullaje de Pwn respeta el interruptor."
      />
      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" ? <UnauthorizedState callbackPath="/pwn/sources" /> : null}
      {session.status === "authenticated" && !session.isAdmin ? adminOnly : null}

      {canLoad ? (
        <>
          {status.kind === "loading" ? <LoadingState label="Cargando fuentes…" /> : null}
          {status.kind === "disabled" ? <DisabledState title="Pwn no está activado" /> : null}
          {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/sources" /> : null}
          {status.kind === "forbidden" ? adminOnly : null}
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
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
