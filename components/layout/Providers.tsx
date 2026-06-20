"use client";

import { SessionProvider } from "next-auth/react";
import { GoogleReCaptchaProvider, GoogleReCaptchaContext } from "react-google-recaptcha-v3";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  return (
    <SessionProvider>
      <ThemeProvider>
        {siteKey ? (
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
        ) : (
          <GoogleReCaptchaContext.Provider 
            value={{ 
              executeRecaptcha: async (action?: string) => "skip" 
            }}
          >
            {children}
          </GoogleReCaptchaContext.Provider>
        )}
      </ThemeProvider>
    </SessionProvider>
  );
}
