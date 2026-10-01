"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import type { CookiePreferences } from "@/lib/cookies/consent";
import { buttonClass } from "@/components/site/primitives";

type ToggleKey = "functional" | "analytics" | "thirdParty";

const CATEGORIES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "functional", label: "Funcionales", hint: "Recuerdan el tema y tus preferencias." },
  { key: "analytics", label: "Analíticas", hint: "Nos ayudan a entender qué partes se usan." },
  { key: "thirdParty", label: "Terceros", hint: "Google reCAPTCHA e inicio de sesión con Google." },
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

  const choiceClass = buttonClass("secondary", "md", "h-12 w-full sm:flex-1");

  if (!mounted) return null;

  // Portal to <body>: the sheet must never sit inside another backdrop-filter surface.
  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center px-3 pb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+4.5rem)] pt-[max(1rem,env(safe-area-inset-top,0px))] md:px-6 md:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="mv-fade absolute inset-0 bg-black/50" aria-hidden onClick={isInitial ? undefined : onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="mv-menu mv-pop relative flex max-h-full w-full max-w-xl flex-col overflow-y-auto rounded-[1.75rem] p-5 outline-none sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mv-kicker">Privacidad</p>
            <h2 id="cookie-banner-title" className="mt-2 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {isInitial ? "Elegí cómo usamos cookies" : "Preferencias de cookies"}
            </h2>
          </div>
          {!isInitial ? (
            <button type="button" onClick={onClose} aria-label="Cerrar preferencias" className="mv-focus -mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
              <X className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
        <p id="cookie-banner-desc" className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {isInitial
            ? "Las necesarias siempre están activas para la seguridad y tu sesión. El resto es opcional y podés cambiarlo cuando quieras."
            : "Actualizá tu elección. Los cambios se aplican de inmediato."}
        </p>

        {showCustomize ? (
          <ul className="mt-5 divide-y divide-[var(--mv-hairline)] rounded-[1.25rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel)]">
            <li className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Necesarias</p>
                <p className="text-xs text-[var(--text-tertiary)]">Sesión, seguridad y tu elección de cookies.</p>
              </div>
              <span className="mv-chip mv-chip-gold shrink-0">Siempre activas</span>
            </li>
            {CATEGORIES.map(({ key, label, hint }) => (
              <li key={key}>
                <label htmlFor={`cookie-${key}`} className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                    <span className="block text-xs text-[var(--text-tertiary)]">{hint}</span>
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
                      className="h-7 w-12 rounded-full border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)] transition-colors duration-200 peer-checked:border-gold peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-primary"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-[var(--text-primary)] shadow transition-transform duration-200 [transition-timing-function:var(--ease-out)] peer-checked:translate-x-5 peer-checked:bg-white"
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Accept and reject carry the same weight: the choice is the user's. */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onRejectNonEssential} className={choiceClass}>
            Solo necesarias
          </button>
          <button type="button" onClick={onAcceptAll} className={choiceClass}>
            Aceptar todas
          </button>
        </div>
        {showCustomize ? (
          <button type="button" onClick={() => onSave({ functional, analytics, thirdParty })} className={buttonClass("primary", "md", "mt-2 h-12 w-full")}>
            Guardar mi selección
          </button>
        ) : (
          <button type="button" onClick={() => setShowCustomize(true)} className={buttonClass("ghost", "sm", "mt-2 w-full")}>
            Elegir por categoría
          </button>
        )}

        <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
          Más detalle en la{" "}
          <Link href="/cookies" className="mv-link font-medium">
            política de cookies
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="mv-link font-medium">
            de privacidad
          </Link>
          .
        </p>
      </div>
    </div>,
    document.body,
  );
}
// creado por pato dev y askforvini
