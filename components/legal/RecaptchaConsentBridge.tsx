"use client";

import { GoogleReCaptchaContext, GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import type { ReactNode } from "react";
import { useCookieConsentOptional } from "@/components/legal/CookieConsentProvider";

export function RecaptchaConsentBridge({ children }: { children: ReactNode }) {
  const consentCtx = useCookieConsentOptional();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const thirdParty = consentCtx?.thirdPartyAllowed ?? false;

  if (!siteKey) {
    return (
      <GoogleReCaptchaContext.Provider value={{ executeRecaptcha: async () => "skip" }}>
        {children}
      </GoogleReCaptchaContext.Provider>
    );
  }

  if (!thirdParty) {
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
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
// creado por pato dev y askforvini
