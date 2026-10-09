"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, Copy, Download, Loader2, Pause, Play, RotateCcw, Rocket } from "@/components/icons";
import { sendJson } from "@/lib/business/client";
import type { LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { cn } from "@/lib/utils";
import { copyText } from "./controls";
import { qrDataUrl } from "./qr";
import { STATUS_LABELS, statusDescription, type ProgramStatus } from "./status";

/** Origen del sitio (después de montar, para no desajustar el HTML del servidor). */
export function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

/** Link público para sumarse, con copiar y QR. */
export function JoinLink({ programSlug, compact }: { programSlug: string; compact?: boolean }) {
  const origin = useOrigin();
  const path = `/c/${programSlug}`;
  const url = origin ? `${origin}${path}` : "";
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    qrDataUrl(url, 512)
      .then((data) => alive && setQr(data))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [url]);

  async function copy() {
    if (!url) return;
    if (await copyText(url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={cn("flex gap-4", compact ? "items-center" : "flex-col items-start sm:flex-row sm:items-center")}>
      <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`Código QR para sumarse: ${url}`} className="h-full w-full" />
        ) : (
          <span className="h-full w-full animate-pulse rounded-lg bg-black/5 motion-reduce:animate-none" aria-hidden />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor={`join-${programSlug}`} className="text-xs font-semibold text-[var(--text-tertiary)]">
          Link para sumarse
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <input
            id={`join-${programSlug}`}
            readOnly
            value={url || path}
            onFocus={(e) => e.currentTarget.select()}
            className="mv-input h-10 min-w-0 flex-1 font-mono text-[13px]"
          />
          <button type="button" onClick={() => void copy()} disabled={!url} className="mv-btn mv-btn-secondary mv-btn-sm shrink-0" aria-live="polite">
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        {qr ? (
          <a href={qr} download={`qr-${programSlug}.png`} className="mv-link inline-flex w-fit items-center gap-1 text-xs">
            <Download className="h-3.5 w-3.5" aria-hidden />
            Descargar QR
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Estado del programa con sus acciones (activar, pausar, reactivar, archivar, restaurar). */
export function ProgramStatusBar({
  slug,
  programId,
  programSlug,
  status,
  type,
  canManage,
  hasActiveReward,
}: {
  slug: string;
  programId: string;
  programSlug: string;
  status: ProgramStatus;
  type: LoyaltyTypeKey;
  canManage: boolean;
  hasActiveReward: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function change(next: "ACTIVE" | "PAUSED" | "ARCHIVED") {
    if (next === "ARCHIVED" && !window.confirm("¿Archivar el programa? Tus clientes ya no van a poder sumar ni canjear. Podés restaurarlo después.")) return;
    setBusy(next);
    setError(null);
    const res = await sendJson(`/api/business/${slug}/loyalty/programs/${programId}`, "PATCH", { status: next });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  const spinner = (key: string, Icon: typeof Play) => (busy === key ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />);

  return (
    <section aria-label="Estado del programa" className={cn("mv-panel flex flex-col gap-5 p-5 sm:p-6", status === "DRAFT" && "border-[var(--color-border-gold)]")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
              status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" : status === "PAUSED" ? "bg-amber-500" : status === "DRAFT" ? "bg-gold" : "bg-[var(--text-tertiary)]",
            )}
          />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{STATUS_LABELS[status]}</p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{statusDescription(status, type)}</p>
          </div>
        </div>
        {canManage ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {status === "DRAFT" ? (
              <button type="button" onClick={() => void change("ACTIVE")} disabled={!!busy || !hasActiveReward} className="mv-btn mv-btn-primary mv-btn-sm">
                {spinner("ACTIVE", Rocket)}
                Activar programa
              </button>
            ) : null}
            {status === "ACTIVE" ? (
              <button type="button" onClick={() => void change("PAUSED")} disabled={!!busy} className="mv-btn mv-btn-secondary mv-btn-sm">
                {spinner("PAUSED", Pause)}
                Pausar
              </button>
            ) : null}
            {status === "PAUSED" ? (
              <button type="button" onClick={() => void change("ACTIVE")} disabled={!!busy || !hasActiveReward} className="mv-btn mv-btn-primary mv-btn-sm">
                {spinner("ACTIVE", Play)}
                Reactivar
              </button>
            ) : null}
            {status === "ARCHIVED" ? (
              <button type="button" onClick={() => void change("PAUSED")} disabled={!!busy} className="mv-btn mv-btn-secondary mv-btn-sm">
                {spinner("PAUSED", RotateCcw)}
                Restaurar
              </button>
            ) : (
              <button type="button" onClick={() => void change("ARCHIVED")} disabled={!!busy} className="mv-btn mv-btn-ghost mv-btn-sm">
                {spinner("ARCHIVED", Archive)}
                Archivar
              </button>
            )}
          </div>
        ) : null}
      </div>
      {canManage && !hasActiveReward && status !== "ARCHIVED" ? <p className="text-xs text-amber-500">Agregá al menos un premio activo en Ajustes para poder activarlo.</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      {status !== "ARCHIVED" ? (
        <div className="border-t border-[var(--mv-hairline)] pt-5">
          <JoinLink programSlug={programSlug} />
          {status !== "ACTIVE" ? <p className="mt-3 text-xs text-[var(--text-secondary)]">El link ya es tuyo, pero recién funciona cuando el programa esté activo.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
// creado por pato dev y askforvini
