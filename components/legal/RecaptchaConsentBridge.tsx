"use client";

import { GoogleReCaptchaContext, GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import type { ReactNode } from "react";
import { useCookieConsentOptional } from "@/components/legal/CookieConsentProvider";
import { RECAPTCHA_SITE_KEY, RECAPTCHA_USE_ENTERPRISE } from "@/lib/recaptcha";

export function RecaptchaConsentBridge({ children }: { children: ReactNode }) {
  const consentCtx = useCookieConsentOptional();
  const siteKey = RECAPTCHA_SITE_KEY;
  const thirdPartyBlocked = Boolean(consentCtx?.hasDecided && !consentCtx.thirdPartyAllowed);

  if (!siteKey) {
    return (
      <GoogleReCaptchaContext.Provider value={{ executeRecaptcha: async () => "skip" }}>
        {children}
      </GoogleReCaptchaContext.Provider>
    );
  }

  if (thirdPartyBlocked) {
    return (
      <GoogleReCaptchaContext.Provider
        value={{
          executeRecaptcha: async () => {
            throw new Error("RECAPTCHA_CONSENT_REQUIRED");
          },
        }}
      >
        {children}
      </GoogleReCaptchaContext.Provider>
    );
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      useEnterprise={RECAPTCHA_USE_ENTERPRISE}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
// creado por pato dev y askforvini
