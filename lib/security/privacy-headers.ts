/**
 * Encabezados de Mercav Privacy (privacy.mercav.lat, y /privacy en local y en las previews). La CSP no deja cargar nada
 * de terceros: ni scripts, ni fuentes, ni imágenes, ni conexiones.
 *
 * Los scripts en línea de Next (el arranque y el payload RSC) llevan el nonce de cada pedido: Next lo saca del
 * Content-Security-Policy del pedido (middleware.ts lo pone) y el layout raíz lo lee de x-nonce para su script del tema.
 * Por eso las páginas de /privacy se renderizan por pedido (el layout raíz es force-dynamic): una página estática saldría
 * sin nonce y sus scripts no correrían.
 */

export type PrivacySecurity = { nonce: string; csp: string; headers: Record<string, string> };

type Options = {
  /** next dev: React y el recargado en caliente usan eval y un websocket. */
  dev?: boolean;
  /** privacy.mercav.lat: HSTS y upgrade-insecure-requests (en 127.0.0.1 por http romperían la página). */
  https?: boolean;
};

/** 128 bits al azar en base64: sin los caracteres que Next rechaza en un nonce. */
export function privacyNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

export function privacyCsp(nonce: string, { dev = false, https = false }: Options = {}) {
  return [
    "default-src 'self'",
    // 'strict-dynamic': corren los scripts con nonce y los chunks que ellos cargan; nada más.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Los style="" que escriben React y Framer Motion necesitan 'unsafe-inline' (con un nonce en la lista se ignoraría).
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
}

export function privacySecurity(options: Options = {}): PrivacySecurity {
  const nonce = privacyNonce();
  const csp = privacyCsp(nonce, options);
  return {
    nonce,
    csp,
    headers: {
      "Content-Security-Policy": csp,
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Cross-Origin-Opener-Policy": "same-origin",
      ...(options.https ? { "Strict-Transport-Security": "max-age=63072000; includeSubDomains" } : {}),
    },
  };
}
// creado por pato dev y askforvini
