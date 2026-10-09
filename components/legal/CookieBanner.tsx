"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown, X } from "@/components/icons";
import { Mervi } from "@/components/mervi/Mervi";
import type { CookiePreferences } from "@/lib/cookies/consent";

type ToggleKey = "functional" | "analytics" | "thirdParty";

const CATEGORIES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "functional", label: "Funcionales", hint: "Recuerdan el tema y tus preferencias." },
  { key: "analytics", label: "Analíticas", hint: "Nos ayudan a entender qué partes se usan." },
  { key: "thirdParty", label: "Terceros", hint: "Inicio de sesión con Google." },
];

export function CookieBanner({
  mode,
  initialPrefs,
  onAcceptAll,
  onRejectNonEssential,
  onSave,
  onClose,
}: {
  mode: "initial" | "settings";
  initialPrefs: CookiePreferences;
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
  onSave: (partial: Pick<CookiePreferences, "functional" | "analytics" | "thirdParty">) => void;
  onClose: () => void;
}) {
  const [functional, setFunctional] = useState(initialPrefs.functional);
  const [analytics, setAnalytics] = useState(initialPrefs.analytics);
  const [thirdParty, setThirdParty] = useState(initialPrefs.thirdParty);
  const [showCustomize, setShowCustomize] = useState(mode === "settings");
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const isInitial = mode === "initial";
  const values: Record<ToggleKey, boolean> = { functional, analytics, thirdParty };
  const setters: Record<ToggleKey, (v: boolean) => void> = {
    functional: setFunctional,
    analytics: setAnalytics,
    thirdParty: setThirdParty,
  };

  // Move focus into the dialog so keyboard and screen-reader users land on the choice.
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted) dialogRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    if (isInitial) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isInitial, onClose]);

  if (!mounted) return null;

  // Portal to <body>: the sheet must never sit inside another backdrop-filter surface.
  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center px-3 pb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+4.5rem)] pt-[calc(max(1rem,env(safe-area-inset-top,0px))+5.75rem)] md:px-6 md:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="mv-fade absolute inset-0 bg-[rgba(11,10,9,0.55)]" aria-hidden onClick={isInitial ? undefined : onClose} />
      {/* El envoltorio no recorta: Mervi se sienta sobre el borde del cartel aunque la tarjeta haga scroll. */}
      <div className="c-sheet relative flex max-h-full w-full max-w-xl flex-col">
        <Mervi pose={isInitial ? "saludando" : "pensativo"} scale={1} className="pointer-events-none absolute left-4 top-[calc(var(--mervi-unit)*-91)] z-10 sm:left-6" />
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="cartel flex max-h-full w-full flex-col overflow-y-auto rounded-[2px] shadow-[0_0_0_2px_var(--c-line-strong),var(--c-shadow)] outline-none [scrollbar-width:thin]"
        >
          <div className="c-band c-ink-yellow flex items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-7 sm:pt-7">
            <h2 id="cookie-banner-title" className="c-display text-[clamp(2.1rem,1.7rem+1.6vw,2.85rem)] [text-wrap:balance]">
              {isInitial ? "Elegí cómo usamos cookies" : "Preferencias de cookies"}
            </h2>
            {!isInitial ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar preferencias"
                className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-[2px] shadow-[inset_0_0_0_2px_currentColor] transition-colors duration-150 hover:bg-[rgba(11,10,9,0.1)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col px-5 pb-5 pt-5 sm:px-7 sm:pb-7">
            <p id="cookie-banner-desc" className="text-[0.98rem] leading-relaxed text-[var(--c-soft)]">
              {isInitial
                ? "Las necesarias siempre están activas para la seguridad y tu sesión. El resto es opcional y podés cambiarlo cuando quieras."
                : "Actualizá tu elección. Los cambios se aplican de inmediato."}
            </p>

            {showCustomize ? (
              <ul className="mt-5 border-t-2 border-[var(--c-line)]" aria-label="Categorías de cookies">
                <li className="flex min-h-[4.25rem] items-center justify-between gap-4 border-b-2 border-[var(--c-line)] py-3">
                  <span className="min-w-0">
                    <span className="c-label block text-[1.2rem] text-[var(--c-text)]">Necesarias</span>
                    <span className="mt-1 block text-[0.88rem] leading-snug text-[var(--c-muted)]">Sesión, seguridad y tu elección de cookies.</span>
                  </span>
                  <span className="c-band c-ink-green c-label shrink-0 rounded-[2px] px-2.5 py-1.5 text-[0.9rem]">Siempre activas</span>
                </li>
                {CATEGORIES.map(({ key, label, hint }) => (
                  <li key={key} className="border-b-2 border-[var(--c-line)]">
                    <label htmlFor={`cookie-${key}`} className="flex min-h-[4.25rem] cursor-pointer items-center justify-between gap-4 py-3">
                      <span className="min-w-0">
                        <span className="c-label block text-[1.2rem] text-[var(--c-text)]">{label}</span>
                        <span className="mt-1 block text-[0.88rem] leading-snug text-[var(--c-muted)]">{hint}</span>
                      </span>
                      <span className="relative inline-flex shrink-0">
                        <input
                          id={`cookie-${key}`}
                          type="checkbox"
                          role="switch"
                          aria-checked={values[key]}
                          checked={values[key]}
                          onChange={(e) => setters[key](e.target.checked)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className="h-8 w-14 rounded-[2px] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-[background-color,box-shadow] duration-150 peer-checked:bg-[var(--c-yellow)] peer-checked:shadow-[inset_0_0_0_2px_var(--c-yellow)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--c-text)]"
                        />
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-[1px] bg-[var(--c-muted)] transition-[translate,background-color] duration-[var(--mv-spring-ms,300ms)] [transition-timing-function:var(--mv-spring,ease-out)] peer-checked:translate-x-6 peer-checked:bg-[#0b0a09]"
                        />
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Aceptar y rechazar pesan lo mismo: la elección es de la persona. */}
            <div className="mt-6 flex flex-col gap-2 text-[var(--c-text)] sm:flex-row">
              <button type="button" onClick={onRejectNonEssential} className="c-btn c-btn-ghost w-full sm:flex-1">
                Solo necesarias
              </button>
              <button type="button" onClick={onAcceptAll} className="c-btn c-btn-ghost w-full sm:flex-1">
                Aceptar todas
              </button>
            </div>
            {showCustomize ? (
              <button type="button" onClick={() => onSave({ functional, analytics, thirdParty })} className="c-btn mt-2 w-full">
                Guardar mi selección
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="c-label mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 self-center rounded-[2px] px-3 text-[1.1rem] text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]"
              >
                Elegir por categoría
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            )}

            <p className="mt-4 border-t-2 border-[var(--c-line)] pt-4 text-[0.85rem] leading-relaxed text-[var(--c-muted)]">
              Más detalle en la{" "}
              <Link href="/cookies" className="c-link font-semibold text-[var(--c-text)]">
                política de cookies
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="c-link font-semibold text-[var(--c-text)]">
                de privacidad
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
// creado por pato dev y askforvini
