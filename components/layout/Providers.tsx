"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { CookieConsentProvider } from "@/components/legal/CookieConsentProvider";
import { RecaptchaConsentBridge } from "@/components/legal/RecaptchaConsentBridge";
import { LiquidGlassRoot } from "@/components/ui/LiquidGlassRoot";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CookieConsentProvider>
          <LiquidGlassRoot />
          <RecaptchaConsentBridge>{children}</RecaptchaConsentBridge>
        </CookieConsentProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
