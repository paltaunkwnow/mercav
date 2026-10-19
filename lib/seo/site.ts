// Dominios canónicos para los buscadores.
// - mercav.lat: el sitio público (portada, quiénes somos, pitch, inversores, legales, feriados y páginas de producto).
// - app.mercav.lat: la app. Todo lo demás, incluidos Herramientas, Pwn, Business y Calendario.
// - kosher.mercav.lat: Mercav Kosher, servido desde /kosher.
// - privacy.mercav.lat: Mercav Privacy, servido desde /privacy. Sin rastreadores ni terceros (middleware.ts).
// - api.mercav.lat: la API (lib/api/origins.ts). pwn.mercav.lat sirve Pwn.
// www.mercav.lat ya no existe.

export const SITE_HOST = "mercav.lat";
export const APP_HOST = "app.mercav.lat";
export const PWN_HOST = "pwn.mercav.lat";
export const KOSHER_HOST = "kosher.mercav.lat";
export const PRIVACY_HOST = "privacy.mercav.lat";
export const MAIL_HOST = "mail.mercav.lat";

/**
 * Origen de una variable de entorno, o el dominio fijo de Mercav. Una variable vieja con www, un *.vercel.app
 * (antes mandaba la portada a Vercel) o, para la app, el dominio del sitio (armaría un bucle de redirecciones) se ignora.
 */
function originFrom(value: string | undefined, fallback: string, notHosts: string[] = []) {
  if (!value) return fallback;
  try {
    const url = new URL(value.replace(/^(https?:\/\/)www\./i, "$1"));
    if (url.hostname.endsWith(".vercel.app") || notHosts.includes(url.hostname)) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

export const SITE_URL = originFrom(process.env.NEXT_PUBLIC_SITE_URL, `https://${SITE_HOST}`);
export const APP_URL = originFrom(process.env.NEXT_PUBLIC_APP_URL, `https://${APP_HOST}`, [SITE_HOST]);
export const PWN_URL = `${APP_URL}/pwn`;
export const KOSHER_URL =
  process.env.NEXT_PUBLIC_KOSHER_URL || "https://kosher.mercav.lat";
/** Nunca otro dominio de Mercav: mercav.lat/privacy, app.mercav.lat/privacy y kosher.mercav.lat/privacy redirigen acá. */
export const PRIVACY_URL = originFrom(process.env.NEXT_PUBLIC_PRIVACY_URL, `https://${PRIVACY_HOST}`, [SITE_HOST, APP_HOST, PWN_HOST, KOSHER_HOST]);
export const MAIL_URL = originFrom(process.env.NEXT_PUBLIC_MAIL_URL, `https://${MAIL_HOST}`, [SITE_HOST, APP_HOST, PWN_HOST, KOSHER_HOST, PRIVACY_HOST]);

export const SITE_NAME = "Mercav";
export const SITE_DESCRIPTION =
  "Caja, planillas, fidelización, ciberseguridad y el atlas Kosher en una sola cuenta para negocios de Latinoamérica. En español, con los precios y las normas de tu país.";

/** Perfiles oficiales de Mercav: los mismos en el footer y en los datos estructurados (sameAs). */
export const SOCIAL_PROFILES = {
  instagram: "https://www.instagram.com/mercav.lat",
  x: "https://x.com/mercavlat",
  tiktok: "https://www.tiktok.com/@mercav.ar",
  github: "https://github.com/invertilo",
} as const;
export const X_HANDLE = "@mercavlat";

/** Pages that live on the public site (mercav.lat). Everything else belongs to app.mercav.lat. */
const MARKETING_EXACT = ["/", "/nosotros", "/pitch", "/inversores", "/terminos", "/privacidad", "/cookies", "/aviso-legal", "/caja", "/planillas", "/fidelizacion"];
const MARKETING_PREFIXES = ["/legal", "/feriados", "/guias", "/b"];
/** Utility pages both hosts may serve. */
const SHARED_EXACT = ["/1337", "/maintenance", "/offline", "/forbidden"];

export function isMarketingPath(path: string) {
  const clean = path !== "/" ? path.replace(/\/+$/, "") : "/";
  return MARKETING_EXACT.includes(clean) || MARKETING_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

export function isSharedPath(path: string) {
  return SHARED_EXACT.includes(path.replace(/\/+$/, "") || "/");
}

/** First screen after login. On app.mercav.lat, "/" redirects here. */
export const APP_HOME = "/inicio";

/** Path prefixes that are personal, transactional or internal. Never indexed. */
export const PRIVATE_PREFIXES = [
  "/api",
  "/inicio",
  "/business",
  // Fidelización: customer cards (/c/<slug>/t/<serial>) are personal; the join page stays out of the index too.
  "/c",
  "/calendario",
  "/admin",
  "/dashboard",
  "/mensajes",
  "/checkout",
  "/notificaciones-settings",
  "/perfil/editar",
  "/perfil/configuracion",
  "/publicar",
  "/sancion",
  "/forbidden",
  "/maintenance",
  "/offline",
  "/1337",
  "/anuncios/publicar",
  "/anuncios/editar",
  "/anuncios/mis-espacios",
  "/servicios/publicar",
  "/servicios/editar",
  "/servicios/mis-servicios",
  "/empleos/publicar",
  "/empleos/editar",
  "/empleos/mis-empleos",
  "/pwn/alerts",
  "/pwn/autorizaciones",
  "/pwn/monitor",
  "/mail",
  "/kosher/moderacion",
  "/kosher/perfil",
  "/kosher/invitacion",
];

/** Thin or utility pages that should stay reachable but out of the index. */
const NOINDEX_EXACT = ["/login", "/register", "/buscar"];

function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isPrivatePath(path: string) {
  if (PRIVATE_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) return true;
  if (/^\/empleos\/[^/]+\/postular$/.test(path)) return true;
  if (/^\/kosher\/lugar\/[^/]+\/administrar$/.test(path)) return true;
  return false;
}

export function isNoindexPath(path: string) {
  return isPrivatePath(path) || NOINDEX_EXACT.includes(path);
}

/** Canonical absolute URL for an app path (the path Next.js routes, e.g. /pwn/breaches). */
export function canonicalFor(appPath: string) {
  const path = appPath !== "/" ? appPath.replace(/\/+$/, "") : "/";
  if (matchesPrefix(path, "/kosher")) return `${KOSHER_URL}${path.slice(7) || "/"}`;
  if (isPrivacyPath(path)) return `${PRIVACY_URL}${path.slice(PRIVACY_PREFIX.length) || "/"}`;
  if (matchesPrefix(path, "/mail")) return `${MAIL_URL}${path.slice(5) || "/"}`;
  if (isMarketingPath(path)) return `${SITE_URL}${path}`;
  return `${APP_URL}${path}`;
}

/** Sections served under kosher.mercav.lat (folders of app/kosher): kosher.mercav.lat/x is rewritten to /kosher/x. */
const KOSHER_SEGMENTS = new Set([
  "calendario", "chat", "ciudad", "comunidad", "comunidades", "festividades", "invitacion", "kashrut", "lugar", "mapa", "moderacion", "perfil", "sidur",
  "sugerir", "terminos", "viaje",
]);

/** Paths kosher.mercav.lat serves as they are, without the /kosher rewrite: auth, API, assets and shared utility pages. */
function kosherHostPassthrough(path: string) {
  return path.startsWith("/api") || path.startsWith("/_next") || path === "/login" || path === "/register" || isSharedPath(path);
}

/** Browser paths kosher.mercav.lat serves: its own sections, /kosher/x and the passthrough pages. The rest belongs to another host. */
export function isKosherHostPath(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/kosher") || kosherHostPassthrough(pathname)) return true;
  return KOSHER_SEGMENTS.has(pathname.split("/")[1] ?? "");
}

const PRIVACY_PREFIX = "/privacy";

/**
 * Secciones servidas en privacy.mercav.lat (carpetas de app/privacy): privacy.mercav.lat/x se reescribe a /privacy/x.
 * Una carpeta nueva en app/privacy se suma acá; lo que no está en la lista se manda a la app.
 */
export const PRIVACY_SEGMENTS: ReadonlySet<string> = new Set([
  "billeteras-frias", "celulares", "envios", "garantia", "instalacion", "pagos", "preguntas-frecuentes", "privacidad", "producto",
  "terminos",
]);

/** /privacy y lo que cuelga de ella (no /privacidad, que es la política del sitio). */
export function isPrivacyPath(path: string) {
  return matchesPrefix(path, PRIVACY_PREFIX);
}

/** Lo que privacy.mercav.lat sirve tal cual: API, assets y páginas utilitarias. El login queda en la app: Privacy no pide cuenta. */
function privacyHostPassthrough(path: string) {
  return path.startsWith("/api") || path.startsWith("/_next") || isSharedPath(path);
}

/** mail.mercav.lat es un producto privado: solo sus rutas, API y assets deben quedarse en el host. */
function mailHostPassthrough(path: string) {
  return path.startsWith("/api") || path.startsWith("/_next") || path === "/favicon.ico" || isSharedPath(path);
}

export function isMailHostPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/mail") || mailHostPassthrough(pathname) || ["/inbox", "/sent", "/drafts", "/spam", "/trash", "/settings"].some((segment) => pathname === segment || pathname.startsWith(`${segment}/`));
}

/** Browser paths privacy.mercav.lat serves: its own sections, /privacy/x and the passthrough pages. The rest belongs to another host. */
export function isPrivacyHostPath(pathname: string) {
  if (pathname === "/" || isPrivacyPath(pathname) || privacyHostPassthrough(pathname)) return true;
  return PRIVACY_SEGMENTS.has(pathname.split("/")[1] ?? "");
}

/** The app path a request on a product subdomain maps to (kosher.mercav.lat/x → /kosher/x, privacy.mercav.lat/x → /privacy/x). */
export function appPathFor(host: string | undefined, pathname: string) {
  if (host === KOSHER_HOST && !matchesPrefix(pathname, "/kosher") && !kosherHostPassthrough(pathname)) {
    return pathname === "/" ? "/kosher" : `/kosher${pathname}`;
  }
  if (host === PRIVACY_HOST && !isPrivacyPath(pathname) && !privacyHostPassthrough(pathname)) {
    return pathname === "/" ? PRIVACY_PREFIX : `${PRIVACY_PREFIX}${pathname}`;
  }
  if (host === MAIL_HOST && !matchesPrefix(pathname, "/mail") && !mailHostPassthrough(pathname)) {
    return pathname === "/" ? "/mail" : `/mail${pathname}`;
  }
  return pathname;
}

/**
 * Which product the request's host serves. Production hostnames only: 127.0.0.1, localhost and Vercel previews are
 * "dev" (every route on one origin, no host rules). pwn.mercav.lat only redirects to app.mercav.lat/pwn.
 */
export type HostKind = "site" | "app" | "kosher" | "privacy" | "mail" | "dev";

export function hostKindFor(host: string | null | undefined): HostKind {
  const name = host?.split(":")[0]?.trim().toLowerCase();
  if (name === SITE_HOST) return "site";
  if (name === APP_HOST || name === PWN_HOST) return "app";
  if (name === KOSHER_HOST) return "kosher";
  if (name === PRIVACY_HOST) return "privacy";
  if (name === MAIL_HOST) return "mail";
  return "dev";
}

/**
 * Mercav Privacy va sin rastreadores (sin reCAPTCHA, banner de cookies, sesión en el navegador ni terceros) y con su CSP:
 * siempre en privacy.mercav.lat; en local y en las previews, bajo /privacy.
 */
export function isPrivacyMode(hostKind: HostKind, appPath: string | null | undefined) {
  return hostKind === "privacy" || (hostKind === "dev" && !!appPath && isPrivacyPath(appPath));
}

export function isAbsoluteUrl(href: string) {
  return /^https?:\/\//i.test(href);
}

/**
 * Where a link to an app path (the route Next.js serves: /pwn, /kosher/mapa, /terminos…) should point from a page on
 * `hostKind`. A path that lives on another host comes back absolute so the caller renders a plain <a>: next/link would
 * prefetch and soft-navigate against this origin and get a cross-origin 307 from the middleware. "dev" never changes.
 */
export function hostHref(href: string, hostKind: HostKind): string {
  if (hostKind === "dev" || !href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const suffix = cut === -1 ? "" : href.slice(cut);
  if (path.startsWith("/api") || path.startsWith("/_next") || isSharedPath(path)) return href;

  const kosher = matchesPrefix(path, "/kosher");
  const privacy = isPrivacyPath(path);
  const mail = matchesPrefix(path, "/mail");
  // Here /x already means /kosher/x (or /privacy/x), so every other app path lives on another host.
  if (hostKind === "kosher") {
    if (kosher) return `${path.slice(7) || "/"}${suffix}`;
    if (kosherHostPassthrough(path)) return href;
  }
  if (hostKind === "privacy" && privacy) return `${path.slice(PRIVACY_PREFIX.length) || "/"}${suffix}`;
  if (hostKind === "mail" && mail) return `${path.slice(5) || "/"}${suffix}`;
  if (kosher) return `${KOSHER_URL}${path.slice(7) || "/"}${suffix}`;
  if (privacy) return `${PRIVACY_URL}${path.slice(PRIVACY_PREFIX.length) || "/"}${suffix}`;
  if (mail) return `${MAIL_URL}${path.slice(5) || "/"}${suffix}`;
  if (hostKind === "kosher" || hostKind === "privacy" || hostKind === "mail") return `${isMarketingPath(path) ? SITE_URL : APP_URL}${href}`;
  if (hostKind === "site" && !isMarketingPath(path)) return `${APP_URL}${href}`;
  if (hostKind === "app" && isMarketingPath(path)) return `${SITE_URL}${href}`;
  return href;
}
// creado por pato dev y askforvini
