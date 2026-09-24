import { LEGAL } from "@/lib/legal/site";

export const CONSENT_COOKIE = "mercav_cookie_consent";
export const CONSENT_MAX_AGE_DAYS = 365;

export type CookiePreferences = {
  version: number;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  thirdParty: boolean;
  decidedAt: string;
};

export const CONSENT_PRESETS = {
  all: (): CookiePreferences => ({
    version: LEGAL.cookiePolicyVersion,
    necessary: true,
    functional: true,
    analytics: true,
    thirdParty: true,
    decidedAt: new Date().toISOString(),
  }),
  necessaryOnly: (): CookiePreferences => ({
    version: LEGAL.cookiePolicyVersion,
    necessary: true,
    functional: false,
    analytics: false,
    thirdParty: false,
    decidedAt: new Date().toISOString(),
  }),
};

export function parseConsentCookie(raw: string | undefined | null): CookiePreferences | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const data = JSON.parse(decoded) as CookiePreferences;
    if (data.version !== LEGAL.cookiePolicyVersion) return null;
    if (data.necessary !== true) return null;
    return data;
  } catch {
    return null;
  }
}

export function readConsentFromDocument(): CookiePreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  return parseConsentCookie(match.split("=").slice(1).join("="));
}

export function writeConsentCookie(prefs: CookiePreferences) {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  const value = encodeURIComponent(JSON.stringify(prefs));
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearThirdPartyStorage() {
  if (typeof document === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("_g") || k.includes("recaptcha"))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
