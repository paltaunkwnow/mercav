"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Loader2, MonitorSmartphone, Printer, Settings2 } from "@/components/icons";
import { Notice } from "@/components/business/ui";
import { resolvePalette } from "@/lib/business/loyalty/templates";
import { rewardLine } from "@/lib/business/loyalty/stats-core";
import type { LoyaltyDesign, LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { slugify } from "@/lib/business/slug";
import { JoinLink, useOrigin } from "./ProgramStatusBar";
import { downloadPoster } from "./poster";
import { qrDataUrl } from "./qr";
import type { ProgramStatus } from "./status";

/** Pestaña Mostrador: cartel con QR para imprimir y acceso a la pantalla de autoservicio. */
export function CounterPanel({
  slug,
  programId,
  programSlug,
  programName,
  status,
  type,
  design,
  stampsGoal,
  rewardName,
  welcomeBonus,
  selfService,
  canManage,
}: {
  slug: string;
  programId: string;
  programSlug: string;
  programName: string;
  status: ProgramStatus;
  type: LoyaltyTypeKey;
  design: LoyaltyDesign;
  stampsGoal: number;
  rewardName: string | null;
  welcomeBonus: number;
  selfService: boolean;
  canManage: boolean;
}) {
  const origin = useOrigin();
  const url = origin ? `${origin}/c/${programSlug}` : "";
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const palette = resolvePalette(design);
  const line = rewardLine(type, stampsGoal, rewardName);
  const welcome = welcomeBonus > 0 ? `Y te regalamos ${welcomeBonus} ${type === "STAMPS" ? (welcomeBonus === 1 ? "sello" : "sellos") : welcomeBonus === 1 ? "punto" : "puntos"} de bienvenida.` : null;
  const kioskReady = type === "STAMPS" && selfService;
  const kioskHref = `/business/${slug}/fidelizacion/${programId}/mostrador`;

  useEffect(() => {
    if (!url) return;
    let alive = true;
    qrDataUrl(url, 512)
      .then((d) => alive && setQr(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [url]);

  async function poster() {
    if (!url) return;
    setBusy(true);
    setError(null);
    try {
      await downloadPoster({
        businessName: design.displayName,
        programName,
        rewardLine: line,
        welcomeLine: welcome,
        url,
        design,
        fileName: `cartel-${slugify(programName)}.pdf`,
      });
    } catch {
      setError("No pudimos armar el PDF. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section aria-labelledby="poster-title" className="mv-panel flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
            <Printer className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 id="poster-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Cartel para imprimir
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">Tamaño A5, con el QR para sumarse. Pegalo cerca de la caja, a la altura de los ojos.</p>
          </div>
        </div>

        {/* Vista previa del cartel (misma composición que el PDF). */}
        <div aria-hidden className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] ring-1 ring-black/10" style={{ aspectRatio: "148 / 210" }}>
          <div className="flex h-[30.5%] flex-col items-center justify-center gap-1 px-4 text-center" style={{ background: palette.base, color: palette.text, borderBottom: `3px solid ${palette.accent}` }}>
            {design.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.logoDataUrl} alt="" className="h-8 w-8 object-contain" />
            ) : null}
            <p className="line-clamp-2 text-[15px] font-bold leading-tight">{design.displayName}</p>
            <p className="text-[9px]" style={{ color: palette.accent }}>
              {programName}
            </p>
          </div>
          <div className="flex flex-col items-center px-4 pt-3 text-center text-[#1a1714]">
            <p className="text-[13px] font-bold">Sumate a nuestro club</p>
            <p className="mt-1 line-clamp-3 text-[8.5px] leading-snug text-[#60584e]">{[line, welcome].filter(Boolean).join(" ")}</p>
            <div className="mt-2.5 w-[52%] rounded-md p-1" style={{ boxShadow: `0 0 0 1px ${palette.light ? palette.accent : palette.base}` }}>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="" className="block aspect-square w-full" />
              ) : (
                <span className="block aspect-square w-full animate-pulse rounded bg-black/5 motion-reduce:animate-none" />
              )}
            </div>
            <p className="mt-2 text-[8.5px] font-bold">Escaneá con la cámara de tu celular</p>
            <p className="text-[6.5px] text-[#60584e]">Sin descargar ninguna app. Es gratis.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => void poster()} disabled={busy || !url} className="mv-btn mv-btn-primary mv-btn-sm w-fit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            Descargar cartel (PDF A5)
          </button>
          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}
          {status !== "ACTIVE" ? <p className="text-xs text-amber-500">Ojo: el programa no está activo. El QR va a funcionar cuando lo actives.</p> : null}
        </div>

        <div className="border-t border-[var(--mv-hairline)] pt-5">
          <p className="mb-3 text-sm text-[var(--text-secondary)]">También podés mandar el link por WhatsApp o ponerlo en tus redes.</p>
          <JoinLink programSlug={programSlug} compact />
        </div>
      </section>

      <section aria-labelledby="kiosk-title" className="mv-panel flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
            <MonitorSmartphone className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 id="kiosk-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Autoservicio en el mostrador
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Una tablet o un celular en la caja muestra un QR que cambia cada 30 segundos. El cliente lo escanea con su tarjeta abierta y suma su sello solo. Como el código cambia, una foto no sirve para sumar desde la casa.
            </p>
          </div>
        </div>

        {type !== "STAMPS" ? (
          <Notice>El autoservicio es solo para programas de sellos. En los de puntos, el cajero carga el monto de la compra.</Notice>
        ) : !selfService ? (
          <Notice>
            Está apagado.{" "}
            {canManage ? (
              <>
                Prendelo en{" "}
                <Link href={`/business/${slug}/fidelizacion/${programId}/ajustes#extras`} className="mv-link">
                  Ajustes, en Extras
                </Link>
                .
              </>
            ) : (
              "Pedile a quien administra el programa que lo prenda."
            )}
          </Notice>
        ) : status !== "ACTIVE" ? (
          <Notice tone="warn">Activá el programa para usar la pantalla del mostrador.</Notice>
        ) : null}

        {kioskReady ? (
          <div className="flex flex-col gap-3">
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-[var(--text-secondary)]">
              <li>Abrí la pantalla en la tablet del mostrador, con tu cuenta o la de alguien del equipo.</li>
              <li>Tocá “Pantalla completa” y dejala enchufada.</li>
              <li>El cliente escanea el QR y suma. Vos ves cada sello en el historial.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Link href={kioskHref} className="mv-btn mv-btn-primary mv-btn-sm" aria-disabled={status !== "ACTIVE" || undefined}>
                <MonitorSmartphone className="h-4 w-4" aria-hidden />
                Abrir pantalla del mostrador
              </Link>
              <a href={kioskHref} target="_blank" rel="noopener" className="mv-btn mv-btn-ghost mv-btn-sm">
                <ExternalLink className="h-4 w-4" aria-hidden />
                En otra pestaña
              </a>
            </div>
          </div>
        ) : canManage && type === "STAMPS" ? (
          <Link href={`/business/${slug}/fidelizacion/${programId}/ajustes#extras`} className="mv-btn mv-btn-secondary mv-btn-sm w-fit">
            <Settings2 className="h-4 w-4" aria-hidden />
            Ir a Ajustes
          </Link>
        ) : null}
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
