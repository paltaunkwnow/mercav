// Canonical hosts for search engines. Pwn and Kosher live on their own subdomains;
// the same pages are also reachable under mercav.lat/pwn and mercav.lat/kosher,
// so every URL resolves to exactly one canonical address.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://mercav.lat");
export const PWN_URL = process.env.NEXT_PUBLIC_PWN_URL || "https://pwn.mercav.lat";
export const KOSHER_URL = process.env.NEXT_PUBLIC_KOSHER_URL || "https://kosher.mercav.lat";

export const SITE_NAME = "Mercav";
export const SITE_DESCRIPTION =
  "Publicidad física, talento digital, empleo, caja para tu local, herramientas y ciberinteligencia defensiva para Latinoamérica. Una cuenta para todo.";

/** Path prefixes that are personal, transactional or internal. Never indexed. */
export const PRIVATE_PREFIXES = [
  "/api",
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
  if (matchesPrefix(path, "/pwn")) return `${PWN_URL}${path.slice(4) || "/"}`;
  if (matchesPrefix(path, "/kosher")) return `${KOSHER_URL}${path.slice(7) || "/"}`;
  return `${SITE_URL}${path}`;
}

/** The app path a request on a product subdomain maps to (pwn.mercav.lat/x → /pwn/x). */
export function appPathFor(host: string | undefined, pathname: string) {
  if (host === "pwn.mercav.lat" && !matchesPrefix(pathname, "/pwn")) return pathname === "/" ? "/pwn" : `/pwn${pathname}`;
  if (host === "kosher.mercav.lat" && !matchesPrefix(pathname, "/kosher")) return pathname === "/" ? "/kosher" : `/kosher${pathname}`;
  return pathname;
}
// creado por pato dev y askforvini
