/**
 * Reglas puras que usa el middleware: agrupar rutas para el limitador en memoria
 * y bloquear escrituras de otro origen hacia /api/pwn. Sin imports de Next para poder testearlas.
 */

import { isMercavOrigin } from "../api/origins";

const AUTH_SESSION_READS = new Set(["session", "csrf", "providers"]);
const AUTH_ROUTES = new Set(["signin", "signout", "callback", "error", "verify-request", "register", "check-username", "_log"]);
const PWN_ROUTES = new Set([
  "exposure",
  "passwords",
  "monitoring",
  "alerts",
  "breaches",
  "vulnerabilities",
  "forum-signals",
  "actors",
  "organizations",
  "reports",
  "sources",
  "ingest",
  "internal",
  "summary",
]);
const SAFE_SEGMENT = /^[a-z0-9][a-z0-9-]{0,39}$/;

function segmentsOf(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/**
 * Clave estable del grupo de rutas: un id, un username o un segmento inventado no abren un balde nuevo.
 * - /api/auth/session|csrf|providers conservan su propio grupo (lectura barata, tope alto).
 * - /api/auth/<x> y /api/pwn/<x> solo usan <x> si es una ruta conocida.
 * - El resto agrupa por el primer segmento después de /api.
 */
export function apiRouteGroup(pathname: string): string {
  const [api, first, second] = segmentsOf(pathname.toLowerCase());
  if (api !== "api" || !first) return "/api";
  if (first === "auth") {
    if (second && AUTH_SESSION_READS.has(second)) return `/api/auth/${second}`;
    return `/api/auth/${second && AUTH_ROUTES.has(second) ? second : "other"}`;
  }
  if (first === "pwn") {
    return `/api/pwn/${second && PWN_ROUTES.has(second) ? second : "other"}`;
  }
  return `/api/${SAFE_SEGMENT.test(first) ? first : "other"}`;
}

export type HitBucket = { count: number; resetAt: number };

/**
 * Libera lugar sin vaciar el mapa entero: primero las ventanas vencidas,
 * después las más viejas (el Map conserva el orden de inserción).
 */
export function evictHitBuckets(map: Map<string, HitBucket>, now: number, max: number): void {
  if (map.size < max) return;
  for (const [key, bucket] of map) {
    if (bucket.resetAt <= now) map.delete(key);
  }
  const target = Math.floor(max * 0.9);
  if (map.size <= target) return;
  for (const key of map.keys()) {
    if (map.size <= target) break;
    map.delete(key);
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type PwnCsrfInput = {
  method: string;
  pathname: string;
  secFetchSite: string | null;
  contentType: string | null;
  contentLength: string | null;
  transferEncoding: string | null;
  authorization: string | null;
  /** Encabezado Origin. app.mercav.lat → api.mercav.lat llega como "same-site" y pasa solo si es un dominio de Mercav. */
  origin?: string | null;
};

function isCronPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "");
  return path === "/api/pwn/internal/cycle" || path === "/api/pwn/internal/forums";
}

function hasBody(input: PwnCsrfInput): boolean {
  if (input.transferEncoding) return true;
  const length = Number(input.contentLength ?? "0");
  return Number.isFinite(length) && length > 0;
}

/**
 * Motivo para rechazar una escritura a /api/pwn, o null si pasa.
 * - Sec-Fetch-Site presente y distinto de same-origin: bloqueado. "same-site" vale desde un dominio de Mercav hacia
 *   api.mercav.lat, y "none" solo para el cron con Bearer.
 * - Con cuerpo, el Content-Type tiene que ser application/json (un formulario de otro sitio no lo puede mandar sin preflight).
 */
export function pwnCsrfBlockReason(input: PwnCsrfInput): string | null {
  const path = input.pathname;
  if (path !== "/api/pwn" && !path.startsWith("/api/pwn/")) return null;
  if (SAFE_METHODS.has(input.method.toUpperCase())) return null;

  const site = input.secFetchSite?.trim().toLowerCase() || null;
  if (site && site !== "same-origin") {
    const mercavSite = site === "same-site" && isMercavOrigin(input.origin);
    const cronCall = site === "none" && isCronPath(path) && /^Bearer\s+\S+/i.test(input.authorization ?? "");
    if (!mercavSite && !cronCall) return "cross-site";
  }

  const type = input.contentType?.split(";")[0]?.trim().toLowerCase() || null;
  if (type && type !== "application/json") return "content-type";
  if (!type && hasBody(input)) return "content-type";
  return null;
}
// creado por pato dev y askforvini
