"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { CookieConsentProvider } from "@/components/legal/CookieConsentProvider";
import { RecaptchaConsentBridge } from "@/components/legal/RecaptchaConsentBridge";
import { LiquidGlassRoot } from "@/components/ui/LiquidGlassRoot";
import { InspectGuard } from "@/components/security/InspectGuard";
import { installApiFetch } from "@/lib/api/client";

// Antes de cualquier llamada: los fetch a /api/… salen por api.mercav.lat cuando está configurado (lib/api/client.ts).
installApiFetch();

export function Providers({ children, privacy = false }: { children: React.ReactNode; privacy?: boolean }) {
  // Mercav Privacy (lib/seo/site.ts, isPrivacyMode): sin banner de cookies, sin reCAPTCHA y sin el detector de inspección.
  // La sesión queda vacía y sin pedidos a /api/auth: useSession() responde "unauthenticated" sin salir a la red.
  if (privacy) {
    return (
      <SessionProvider session={null} refetchOnWindowFocus={false}>
        <ThemeProvider>
          <LiquidGlassRoot />
          {children}
        </ThemeProvider>
      </SessionProvider>
    );
  }
  return (
    <SessionProvider>
      <ThemeProvider>
        <CookieConsentProvider>
          <LiquidGlassRoot />
          <InspectGuard />
          <RecaptchaConsentBridge>{children}</RecaptchaConsentBridge>
        </CookieConsentProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
// creado por pato dev y askforvini
