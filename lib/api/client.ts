/**
 * Las llamadas del navegador a /api/… salen por api.mercav.lat (api.mercav.lat/jobs es /api/jobs).
 *
 * Se activa con NEXT_PUBLIC_API_URL=https://api.mercav.lat y solo en los dominios de Mercav: en local, en las previews y
 * en *.vercel.app todo sigue por el mismo origen. Si algo falla, alcanza con quitar esa variable y volver a deployar.
 * La sesión viaja porque la cookie es de .mercav.lat (AUTH_COOKIE_DOMAIN en lib/auth.ts).
 *
 * Quedan en el dominio de la app: /api/auth (next-auth arma sus llamadas y Google tiene registradas esas URLs) y
 * /api/socket (el socket de los pedidos).
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

/** "/api/jobs?x=1" → "/jobs?x=1", o null si esa ruta no pasa por api.mercav.lat. */
function apiPath(pathAndQuery: string): string | null {
  if (!pathAndQuery.startsWith("/api/")) return null;
  if (pathAndQuery.startsWith("/api/auth/") || pathAndQuery.startsWith("/api/socket")) return null;
  return pathAndQuery.slice("/api".length);
}

/** Una vez, al cargar la app: desde ahí cada fetch a /api/… (también los de pwnFetch, kosherFetch y demás) sale por la API. */
export function installApiFetch() {
  if (!API_BASE || typeof window === "undefined") return;
  if (!/(^|\.)mercav\.lat$/.test(window.location.hostname)) return;
  const w = window as Window & { __mercavApiFetch?: boolean };
  if (w.__mercavApiFetch) return;
  w.__mercavApiFetch = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    let url: URL;
    try {
      url = new URL(raw, window.location.href);
    } catch {
      return nativeFetch(input, init);
    }
    const path = url.origin === window.location.origin ? apiPath(url.pathname + url.search) : null;
    if (path === null) return nativeFetch(input, init);

    const target = `${API_BASE}${path}`;
    // api.mercav.lat es otro origen del mismo sitio: "same-origin" dejaría la sesión afuera.
    const credentials: RequestCredentials = init?.credentials === "omit" ? "omit" : "include";
    if (input instanceof Request) return nativeFetch(new Request(target, input), { ...init, credentials });
    return nativeFetch(target, { ...init, credentials });
  };
}
// creado por pato dev y askforvini
