// Canonical hosts for search engines.
// - mercav.lat: only the public site (landing, quiénes somos, pitch, inversores, legal).
// - app.mercav.lat: the product. Everything else, including Tools, Pwn (/pwn), Business and Calendario.
// - kosher.mercav.lat: Mercav Kosher, served from /kosher.
// pwn.mercav.lat now redirects to app.mercav.lat/pwn. Every URL resolves to exactly one canonical address.

// Each URL can be overridden with NEXT_PUBLIC_* env vars. On a Vercel preview the public site points at the preview
// itself (so OpenGraph images resolve there); production never uses the deployment URL as canonical.
const VERCEL_PREVIEW_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" && process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || VERCEL_PREVIEW_URL || "https://mercav.lat";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.mercav.lat";
export const PWN_URL = process.env.NEXT_PUBLIC_PWN_URL || `${APP_URL}/pwn`;
export const KOSHER_URL = process.env.NEXT_PUBLIC_KOSHER_URL || "https://kosher.mercav.lat";

export const SITE_HOST = "mercav.lat";
export const APP_HOST = "app.mercav.lat";
export const PWN_HOST = "pwn.mercav.lat";
export const KOSHER_HOST = "kosher.mercav.lat";

export const SITE_NAME = "Mercav";
export const SITE_DESCRIPTION =
  "Publicidad física, talento digital, empleo, RR.HH. y planillas para empresas, herramientas y ciberinteligencia defensiva para Latinoamérica. Una cuenta para todo.";

/** Pages that live on the public site (mercav.lat). Everything else belongs to app.mercav.lat. */
const MARKETING_EXACT = ["/", "/nosotros", "/pitch", "/inversores", "/terminos", "/privacidad", "/cookies", "/aviso-legal"];
const MARKETING_PREFIXES = ["/legal"];
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
  if (isMarketingPath(path)) return `${SITE_URL}${path}`;
  return `${APP_URL}${path}`;
}

/** Sections served under kosher.mercav.lat (folders of app/kosher): kosher.mercav.lat/x is rewritten to /kosher/x. */
const KOSHER_SEGMENTS = new Set([
  "calendario", "chat", "comunidad", "comunidades", "invitacion", "lugar", "mapa", "moderacion", "perfil", "sugerir", "terminos", "viaje",
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

/** The app path a request on a product subdomain maps to (kosher.mercav.lat/x → /kosher/x). */
export function appPathFor(host: string | undefined, pathname: string) {
  if (host === KOSHER_HOST && !matchesPrefix(pathname, "/kosher") && !kosherHostPassthrough(pathname)) {
    return pathname === "/" ? "/kosher" : `/kosher${pathname}`;
  }
  return pathname;
}

/**
 * Which product the request's host serves. Production hostnames only: 127.0.0.1, localhost and Vercel previews are
 * "dev" (every route on one origin, no host rules). pwn.mercav.lat only redirects to app.mercav.lat/pwn.
 */
export type HostKind = "site" | "app" | "kosher" | "dev";

export function hostKindFor(host: string | null | undefined): HostKind {
  const name = host?.split(":")[0]?.trim().toLowerCase();
  if (name === SITE_HOST || name === `www.${SITE_HOST}`) return "site";
  if (name === APP_HOST || name === PWN_HOST) return "app";
  if (name === KOSHER_HOST) return "kosher";
  return "dev";
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
  if (hostKind === "kosher") {
    // Here /x already means /kosher/x, so every other app path (even /calendario or /perfil) lives on another host.
    if (kosher) return `${path.slice(7) || "/"}${suffix}`;
    if (kosherHostPassthrough(path)) return href;
    return `${isMarketingPath(path) ? SITE_URL : APP_URL}${href}`;
  }
  if (kosher) return `${KOSHER_URL}${path.slice(7) || "/"}${suffix}`;
  if (hostKind === "site" && !isMarketingPath(path)) return `${APP_URL}${href}`;
  if (hostKind === "app" && isMarketingPath(path)) return `${SITE_URL}${href}`;
  return href;
}
// creado por pato dev y askforvini
