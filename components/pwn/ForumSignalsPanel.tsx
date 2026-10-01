"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { BoliviaPriorityBadge, GovernmentPriorityBadge, SignalKindBadge, VerificationBadge } from "@/components/pwn/RiskBadge";
import { EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
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
    if (result.reason === "unauthorized") {
      return <UnauthorizedState callbackPath="/pwn" description="La patrulla de filtraciones se muestra a cuentas con sesión iniciada." />;
    }
    return <ErrorState message={result.message} onRetry={onRetry} />;
  }
  const items = result.data.items.slice(0, 5);
  if (!items.length) {
    return (
      <EmptyState
        title="Sin señales todavía"
        description="El archivo junta stealer logs, robos a empresas, ransomware y dumps. Se mantiene al día en segundo plano y te avisa si entra una filtración nueva."
        action={
          <Link href="/pwn/signals" className={`mv-link text-sm ${focusRing}`}>
            Ver ciberpatrullaje
          </Link>
        }
      />
    );
  }
  return (
    <section aria-labelledby="pwn-forum-title" className="mv-panel flex h-full flex-col rounded-[1.75rem] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="pwn-forum-title" className="mv-h3 text-lg">
            Patrulla de filtraciones
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Titulares de foros y RSS. Solo metadatos.</p>
        </div>
        <Link href="/pwn/signals?kind=LEAKS" className={`mv-link inline-flex items-center gap-1 text-sm ${focusRing}`}>
          Ver todas <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-[var(--mv-hairline)]">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 py-4 first:pt-1 last:pb-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <BoliviaPriorityBadge active={item.isBolivia} />
              <GovernmentPriorityBadge active={item.isGovernment} />
              <SignalKindBadge kind={item.signalKind} />
              {item.breachName ? (
                <span className="inline-flex h-6 items-center rounded-full border border-[var(--color-border-gold)] px-2.5 text-[11px] font-semibold text-gold">
                  HIBP · {item.breachName}
                </span>
              ) : null}
              <VerificationBadge status={item.verificationStatus} />
            </div>
            <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">{item.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--text-tertiary)]">
              {item.author ? (
                <Link
                  href={`/pwn/signals?author=${encodeURIComponent(item.author)}`}
                  className={`font-medium text-gold underline-offset-4 hover:underline ${focusRing}`}
                >
                  {item.author}
                </Link>
              ) : null}
              {item.forum ? <span>{item.forum}</span> : null}
              <time className="mv-data" dateTime={item.publishedAt ?? item.lastSeenAt ?? undefined}>
                {formatRelative(item.publishedAt ?? item.lastSeenAt) ?? "Reciente"}
              </time>
              <SourceBadge source={item.source} href={item.link} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
// creado por pato dev y askforvini
