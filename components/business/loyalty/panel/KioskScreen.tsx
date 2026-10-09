"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Maximize, Minimize, WifiOff, X } from "@/components/icons";
import { LoyaltyIcon } from "@/components/business/loyalty/icons";
import { resolvePalette } from "@/lib/business/loyalty/templates";
import type { LoyaltyDesign } from "@/lib/business/loyalty/types";
import { qrDataUrl } from "./qr";

type CodeState = { code: string; deadline: number; step: number };

const POLL_MS = 5000;
const RING = 2 * Math.PI * 44;

type FullscreenDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void>; webkitFullscreenEnabled?: boolean };
type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

/**
 * Pantalla de autoservicio para una tablet en el mostrador: QR rotativo que lleva a /c/<slug>/sellar?code=…
 * Pide el código cada 5 s y apenas vence. Ocupa toda la ventana y ofrece pantalla completa.
 */
export function KioskScreen({
  slug,
  programId,
  programSlug,
  businessName,
  design,
  exitHref,
  initialProblem,
}: {
  slug: string;
  programId: string;
  programSlug: string;
  businessName: string;
  design: LoyaltyDesign;
  exitHref: string;
  initialProblem: string | null;
}) {
  const api = `/api/business/${slug}/loyalty/programs/${programId}/kiosk-code`;
  const palette = resolvePalette(design);
  const rootRef = useRef<HTMLDivElement>(null);
  const fetching = useRef(false);
  const lastTry = useRef(0);
  const [state, setState] = useState<CodeState | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(initialProblem);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    lastTry.current = Date.now();
    try {
      const res = await fetch(api, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as { success?: boolean; data?: { code: string; expiresIn: number; step: number }; error?: string } | null;
      setOffline(false);
      if (!res.ok || !json?.success || !json.data) {
        setProblem(json?.error ?? "No pudimos cargar el código.");
        setState(null);
        return;
      }
      setProblem(null);
      const data = json.data;
      setState((prev) => (prev?.code === data.code ? { ...prev, deadline: Date.now() + data.expiresIn * 1000 } : { code: data.code, deadline: Date.now() + data.expiresIn * 1000, step: data.step }));
    } catch {
      setOffline(true);
    } finally {
      fetching.current = false;
    }
  }, [api]);

  useEffect(() => {
    setOrigin(window.location.origin);
    const d = document as FullscreenDoc;
    setCanFullscreen(!!(d.fullscreenEnabled || d.webkitFullscreenEnabled));
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Apenas vence el código, pedir el nuevo (sin esperar al próximo ciclo de 5 s).
  useEffect(() => {
    // Sin conexión no se reintenta en cada tic: como mucho cada 1 s.
    if (state && now >= state.deadline && now - lastTry.current > 1000) void load();
  }, [now, state, load]);

  useEffect(() => {
    if (!state || !origin) return;
    let alive = true;
    qrDataUrl(`${origin}/c/${programSlug}/sellar?code=${state.code}`, 1024)
      .then((data) => alive && setQr(data))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [state?.code, origin, programSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pantalla siempre encendida (si el navegador lo permite).
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } };
    let sentinel: Sentinel | null = null;
    const request = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === "visible") sentinel = await nav.wakeLock.request("screen");
      } catch {
        sentinel = null;
      }
    };
    void request();
    const onVisible = () => void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const d = document as FullscreenDoc;
    const onChange = () => setFullscreen(!!(d.fullscreenElement || d.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  async function toggleFullscreen() {
    const d = document as FullscreenDoc;
    const el = rootRef.current as FullscreenEl | null;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) await (d.exitFullscreen?.() ?? d.webkitExitFullscreen?.());
      else if (el) await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
    } catch {
      /* El navegador no lo permitió. */
    }
  }

  const remaining = state ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 0;
  const fraction = state ? Math.max(0, Math.min(1, (state.deadline - now) / (state.step * 1000))) : 0;
  // El servidor acepta también el código anterior: recién después de un ciclo extra el QR deja de servir.
  const stale = !state || now > state.deadline + state.step * 1000;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120] flex flex-col overflow-y-auto"
      style={{
        backgroundColor: palette.base,
        backgroundImage: `radial-gradient(90% 70% at 100% 0%, ${palette.accent}2e, transparent 60%), radial-gradient(60% 50% at 0% 100%, ${palette.accent}1a, transparent 60%)`,
        color: palette.text,
      }}
    >
      <div className="flex items-center justify-between gap-3 p-4 opacity-80 transition-opacity hover:opacity-100 focus-within:opacity-100 sm:p-6">
        <Link
          href={exitHref}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold outline-none ring-offset-2 focus-visible:ring-2"
          style={{ background: `${palette.text}14`, color: palette.text }}
        >
          <X className="h-4 w-4" aria-hidden />
          Salir
        </Link>
        {canFullscreen ? (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold outline-none ring-offset-2 focus-visible:ring-2"
            style={{ background: `${palette.text}14`, color: palette.text }}
          >
            {fullscreen ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
            {fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          </button>
        ) : null}
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-10 text-center md:flex-row md:gap-16 md:text-left">
        <div className="flex max-w-xl flex-col items-center gap-5 md:items-start">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: `${palette.text}12` }}>
              {design.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={design.logoDataUrl} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                <span style={{ color: palette.accent }}>
                  <LoyaltyIcon name={design.icon} className="h-7 w-7" />
                </span>
              )}
            </span>
            <p className="text-xl font-semibold sm:text-2xl">{businessName}</p>
          </div>
          <h1 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-tight">Escaneá para sumar tu sello</h1>
          <p className="max-w-md text-lg leading-relaxed sm:text-xl" style={{ color: palette.muted }}>
            Abrí la cámara del celular y apuntá al código. Si todavía no tenés tarjeta, te sumás en el momento.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="relative rounded-[2rem] bg-white p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-6">
            <div className="relative" style={{ width: "min(62vmin, 30rem)", height: "min(62vmin, 30rem)" }}>
              {qr && !problem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="Código QR para sumar un sello" className={stale ? "h-full w-full opacity-15" : "h-full w-full"} />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-xl bg-black/[0.04] p-6 text-center text-base font-medium text-[#1a1714]">
                  {problem ?? "Cargando código…"}
                </div>
              )}
              {offline && stale && !problem ? (
                <div className="absolute inset-0 grid place-items-center">
                  <p className="flex items-center gap-2 rounded-full bg-[#1a1714] px-4 py-2 text-sm font-semibold text-white">
                    <WifiOff className="h-4 w-4" aria-hidden />
                    Sin conexión. Reintentando…
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {state && !problem ? (
            <div className="flex items-center gap-3" aria-live="off">
              <svg viewBox="0 0 100 100" className="h-12 w-12 -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="9" stroke={`${palette.text}26`} />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  stroke={palette.accent}
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - fraction)}
                  className="transition-[stroke-dashoffset] duration-200 ease-linear motion-reduce:transition-none"
                />
              </svg>
              <p className="text-base" style={{ color: palette.muted }}>
                El código cambia en <span className="font-semibold tabular-nums" style={{ color: palette.text }}>{remaining} s</span>
              </p>
            </div>
          ) : null}
          {offline && !stale ? (
            <p className="flex items-center gap-2 text-sm" style={{ color: palette.muted }}>
              <WifiOff className="h-4 w-4" aria-hidden />
              Conexión inestable
            </p>
          ) : null}
        </div>
      </main>

      <p className="pb-5 text-center text-xs" style={{ color: palette.muted }}>
        Powered by mercav.lat
      </p>
    </div>
  );
}
// creado por pato dev y askforvini
