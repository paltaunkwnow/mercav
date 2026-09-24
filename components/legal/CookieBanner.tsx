"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import type { CookiePreferences } from "@/lib/cookies/consent";

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

  const isInitial = mode === "initial";

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
    >
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden
        onClick={isInitial ? undefined : onClose}
      />
      <div className="liquid-glass liquid-glass-lens relative w-full max-w-lg rounded-3xl p-6 md:p-8">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <Cookie className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 id="cookie-banner-title" className="font-display text-lg font-bold text-white light:text-[#1a1714]">
              {isInitial ? "Usamos cookies" : "Preferencias de cookies"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-400 light:text-gray-600">
              {isInitial
                ? "Debes elegir cómo tratamos cookies y tecnologías similares. Las necesarias siempre están activas para seguridad y sesión."
                : "Actualiza tu elección. Los cambios se aplican de inmediato."}
            </p>
          </div>
        </div>

        {showCustomize ? (
          <ul className="mb-5 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 light:border-black/10">
              <span className="text-gray-300 light:text-gray-700">Necesarias</span>
              <span className="text-xs font-semibold uppercase text-gold">Siempre</span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 light:border-black/10">
              <label htmlFor="cookie-functional" className="text-gray-300 light:text-gray-700">
                Funcionales (tema, preferencias)
              </label>
              <input
                id="cookie-functional"
                type="checkbox"
                checked={functional}
                onChange={(e) => setFunctional(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-gold)]"
              />
            </li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 light:border-black/10">
              <label htmlFor="cookie-analytics" className="text-gray-300 light:text-gray-700">
                Analíticas
              </label>
              <input
                id="cookie-analytics"
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-gold)]"
              />
            </li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 light:border-black/10">
              <label htmlFor="cookie-third" className="text-gray-300 light:text-gray-700">
                Terceros (Google reCAPTCHA / Google login)
              </label>
              <input
                id="cookie-third"
                type="checkbox"
                checked={thirdParty}
                onChange={(e) => setThirdParty(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-gold)]"
              />
            </li>
          </ul>
        ) : null}

        <p className="mb-5 text-xs text-gray-500">
          Más información en{" "}
          <Link href="/cookies" className="text-gold hover:underline">
            Política de cookies
          </Link>{" "}
          y{" "}
          <Link href="/privacidad" className="text-gold hover:underline">
            Privacidad
          </Link>
          .
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onAcceptAll}
            className="h-11 flex-1 rounded-xl bg-gold px-4 text-sm font-semibold text-black hover:bg-gold-light"
          >
            Aceptar todas
          </button>
          {!showCustomize ? (
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm font-medium text-white hover:border-gold/30 light:border-black/10 light:text-[#1a1714]"
            >
              Personalizar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSave({ functional, analytics, thirdParty })}
              className="h-11 flex-1 rounded-xl border border-gold/40 bg-gold/10 px-4 text-sm font-semibold text-gold"
            >
              Guardar preferencias
            </button>
          )}
          {isInitial ? (
            <button
              type="button"
              onClick={onRejectNonEssential}
              className="h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm text-gray-300 hover:text-white light:text-gray-700"
            >
              Solo necesarias
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm text-gray-400 light:text-gray-600"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
