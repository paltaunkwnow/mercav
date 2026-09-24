"use client";

import { useCookieConsentOptional } from "@/components/legal/CookieConsentProvider";

export function ManageCookiesLink({ className }: { className?: string }) {
  const ctx = useCookieConsentOptional();
  if (!ctx) {
    return (
      <a href="/?cookie_prefs=1" className={className}>
        Gestionar cookies
      </a>
    );
  }
  return (
    <button type="button" onClick={() => ctx.openCookieSettings()} className={className}>
      Gestionar cookies
    </button>
  );
}
