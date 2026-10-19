/**
 * Encabezados exclusivos de Mercav Mail. El webmail procesa información sensible:
 * no admite marcos, recursos remotos ni conexiones a otros orígenes.
 */
import { privacyNonce } from "@/lib/security/privacy-headers";

export type MailSecurity = { nonce: string; csp: string; headers: Record<string, string> };

export function mailSecurity({ dev = false, https = false }: { dev?: boolean; https?: boolean } = {}): MailSecurity {
  const nonce = privacyNonce();
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return {
    nonce,
    csp,
    headers: {
      "Content-Security-Policy": csp,
      "Cache-Control": "private, no-store, max-age=0",
      "Pragma": "no-cache",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
      ...(https ? { "Strict-Transport-Security": "max-age=63072000; includeSubDomains" } : {}),
    },
  };
}
