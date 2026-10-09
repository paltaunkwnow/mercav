"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { CookieConsentProvider } from "@/components/legal/CookieConsentProvider";
import { LiquidGlassRoot } from "@/components/ui/LiquidGlassRoot";
import { InspectGuard } from "@/components/security/InspectGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CookieConsentProvider>
          <LiquidGlassRoot />
          <InspectGuard />
          {children}
        </CookieConsentProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
// creado por pato dev y askforvini
