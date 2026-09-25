"use client";

import Link from "next/link";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { GovernmentPriorityBadge, SignalKindBadge, VerificationBadge } from "@/components/pwn/RiskBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { focusRing, formatRelative } from "@/components/pwn/format";
import type { ForumSignalView, PwnResult } from "@/components/pwn/api";

export function ForumSignalsPanel({
  result,
  loading,
  onRetry,
}: {
  result: PwnResult<{ items: ForumSignalView[] }> | null;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) return <LoadingState label="Cargando señales de foros…" />;
  if (!result) return null;
  if (!result.ok) {
    if (result.reason === "disabled") return null;
    return <ErrorState message={result.message} onRetry={onRetry} />;
  }
  const items = result.data.items.slice(0, 5);
  if (!items.length) {
    return (
      <EmptyState
        title="Sin señales de DB todavía"
        description="El ciclo horario prioriza titulares de volcados SQL/NoSQL y filtraciones masivas. Lanza el ciclo con CRON_SECRET en local si acabas de activar Pwn."
        action={
          <Link href="/pwn/signals" className={`text-sm text-gold underline-offset-4 hover:underline ${focusRing}`}>
            Ver señales
          </Link>
        }
      />
    );
  }
  return (
    <section aria-label="Señales de foros recientes" className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-white">Filtraciones de bases de datos</h2>
        <Link href="/pwn/signals?kind=DATA" className={`text-sm text-gold underline-offset-4 hover:underline ${focusRing}`}>
          Ver todas
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-white/5">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <GovernmentPriorityBadge active={item.isGovernment} />
                <SignalKindBadge kind={item.signalKind} />
                {item.breachName ? (
                  <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
                    HIBP · {item.breachName}
                  </span>
                ) : null}
                <VerificationBadge status={item.verificationStatus} />
                {item.forum ? <span className="text-xs text-gray-500">{item.forum}</span> : null}
              </div>
              <p className="mt-2 text-sm font-medium text-white">{item.title}</p>
              <time className="mt-1 block font-mono text-xs text-gray-500" dateTime={item.publishedAt ?? item.lastSeenAt ?? undefined}>
                {formatRelative(item.publishedAt ?? item.lastSeenAt) ?? "Reciente"}
              </time>
            </div>
            <SourceBadge source={item.source} href={item.link} />
          </li>
        ))}
      </ul>
    </section>
  );
}
// creado por Patodev y Invertilo
