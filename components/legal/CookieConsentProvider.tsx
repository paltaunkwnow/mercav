"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CONSENT_PRESETS,
  clearThirdPartyStorage,
  readConsentFromDocument,
  writeConsentCookie,
  type CookiePreferences,
} from "@/lib/cookies/consent";
import { CookieBanner } from "@/components/legal/CookieBanner";

type CookieConsentContextValue = {
  consent: CookiePreferences | null;
  hasDecided: boolean;
  thirdPartyAllowed: boolean;
  functionalAllowed: boolean;
  analyticsAllowed: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (partial: Pick<CookiePreferences, "functional" | "analytics" | "thirdParty">) => void;
  openCookieSettings: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsentFromDocument());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cookie_prefs") === "1") {
      setSettingsOpen(true);
      params.delete("cookie_prefs");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  const persist = useCallback((prefs: CookiePreferences) => {
    writeConsentCookie(prefs);
    setConsent(prefs);
    if (!prefs.thirdParty) clearThirdPartyStorage();
  }, []);

  const acceptAll = useCallback(() => {
    persist(CONSENT_PRESETS.all());
    setSettingsOpen(false);
  }, [persist]);

  const rejectNonEssential = useCallback(() => {
    persist(CONSENT_PRESETS.necessaryOnly());
    setSettingsOpen(false);
  }, [persist]);

  const savePreferences = useCallback(
    (partial: Pick<CookiePreferences, "functional" | "analytics" | "thirdParty">) => {
      persist({
        ...CONSENT_PRESETS.necessaryOnly(),
        ...partial,
      });
      setSettingsOpen(false);
    },
    [persist],
  );

  const openCookieSettings = useCallback(() => setSettingsOpen(true), []);

  const value = useMemo(
    (): CookieConsentContextValue => ({
      consent,
      hasDecided: consent !== null,
      thirdPartyAllowed: consent?.thirdParty ?? false,
      functionalAllowed: consent?.functional ?? false,
      analyticsAllowed: consent?.analytics ?? false,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openCookieSettings,
    }),
    [acceptAll, consent, openCookieSettings, rejectNonEssential, savePreferences],
  );

  const showOverlay = hydrated && (consent === null || settingsOpen);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showOverlay ? (
        <CookieBanner
          mode={consent === null ? "initial" : "settings"}
          initialPrefs={consent ?? CONSENT_PRESETS.necessaryOnly()}
          onAcceptAll={acceptAll}
          onRejectNonEssential={rejectNonEssential}
          onSave={savePreferences}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}

export function useCookieConsentOptional() {
  return useContext(CookieConsentContext);
}
// creado por Patodev y Invertilo
