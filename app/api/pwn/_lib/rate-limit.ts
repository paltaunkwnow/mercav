import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { retryAfterCopy, secondsUntilToken } from "@/lib/pwn/rate-copy";
import { clientIp } from "./http";

type Bucket = {
  tokens: number;
  updatedAt: number;
  lastSeenAt: number;
};

export type RateLimitOptions = {
  route: string;
  capacity: number;
  refillPerMinute: number;
  /** Signed-in callers are keyed by user id instead of IP. */
  userId?: string | null;
  /** Un solo balde para todos (por ejemplo, la API key compartida de HIBP). */
  global?: boolean;
  /** Texto antes de "Probá de nuevo en…". */
  message?: string;
};

export const ANONYMOUS_SEARCH_PER_MINUTE = 3;
export const AUTHENTICATED_SEARCH_PER_MINUTE = 60;

/** HIBP limita por API key: todo Mercav comparte este presupuesto. */
export const HIBP_KEY_PER_MINUTE = 10;
export const EXPOSURE_USER_PER_MINUTE = 5;
export const EXPOSURE_USER_PER_DAY = 50;
export const EXPOSURE_ANON_PER_DAY = 20;

/** Limits for the password-range route, which accepts anonymous callers. */
export function searchLimit(userId: string | null | undefined) {
  const perMinute = userId ? AUTHENTICATED_SEARCH_PER_MINUTE : ANONYMOUS_SEARCH_PER_MINUTE;
  return { capacity: perMinute, refillPerMinute: perMinute, userId: userId ?? null };
}

/**
 * Presupuesto de una consulta de exposición: por minuto y por día para quien pregunta,
 * y el balde global de la API key de HIBP solo si la consulta la usa.
 */
export function exposureLimits(userId: string | null | undefined, usesHibpKey: boolean): RateLimitOptions[] {
  const perMinute = userId ? EXPOSURE_USER_PER_MINUTE : ANONYMOUS_SEARCH_PER_MINUTE;
  const perDay = userId ? EXPOSURE_USER_PER_DAY : EXPOSURE_ANON_PER_DAY;
  const limits: RateLimitOptions[] = [
    {
      route: "exposure-minute",
      capacity: perMinute,
      refillPerMinute: perMinute,
      userId: userId ?? null,
      message: "Hiciste muchas consultas seguidas.",
    },
    {
      route: "exposure-day",
      capacity: perDay,
      refillPerMinute: perDay / (24 * 60),
      userId: userId ?? null,
      message: `Llegaste al tope de ${perDay} consultas por día.`,
    },
  ];
  if (usesHibpKey) {
    limits.push({
      route: "hibp-key",
      capacity: HIBP_KEY_PER_MINUTE,
      refillPerMinute: HIBP_KEY_PER_MINUTE,
      global: true,
      message: "Mercav llegó al límite de consultas a HIBP de este minuto.",
    });
  }
  return limits;
}

// Used only when the shared PwnRateBucket table is not available yet.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function cleanup(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeenAt > 10 * 60_000) buckets.delete(key);
  }
}

function callerKey(request: NextRequest, options: RateLimitOptions): string {
  if (options.global) return "global";
  if (options.userId) return `user:${options.userId}`;
  const ipHash = createHash("sha256").update(clientIp(request), "utf8").digest("hex");
  return `ip:${ipHash}`;
}

function tooMany(seconds: number, message?: string) {
  const lead = message ?? "Demasiadas solicitudes.";
  return NextResponse.json(
    { success: false, error: `${lead} ${retryAfterCopy(seconds)}`, retryAfterSeconds: seconds },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}

/** null = hay ficha; número = segundos hasta la próxima. */
function takeMemoryToken(key: string, options: RateLimitOptions, now: number): number | null {
  cleanup(now);
  const bucket = buckets.get(key) ?? {
    tokens: options.capacity,
    updatedAt: now,
    lastSeenAt: now,
  };
  const elapsedMinutes = Math.max(0, now - bucket.updatedAt) / 60_000;
  bucket.tokens = Math.min(options.capacity, bucket.tokens + elapsedMinutes * options.refillPerMinute);
  bucket.updatedAt = now;
  bucket.lastSeenAt = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return secondsUntilToken(bucket.tokens, options.refillPerMinute);
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return null;
}

/**
 * Una sola sentencia: inserta el balde lleno menos una ficha, o recarga y descuenta
 * solo si alcanza (WHERE del ON CONFLICT). Sin fila devuelta = sin ficha, sin carrera entre instancias.
 * updatedAt es timestamp(3) sin zona: Prisma lo guarda en UTC, así que pasamos el ISO en UTC.
 */
async function takeSharedToken(key: string, options: RateLimitOptions, now: number): Promise<number | null> {
  const nowIso = new Date(now).toISOString();
  const capacity = options.capacity;
  const refill = options.refillPerMinute;
  const granted = await prisma.$queryRaw<{ tokens: number }[]>`
    INSERT INTO "PwnRateBucket" ("key", "tokens", "updatedAt")
    VALUES (${key}, ${capacity - 1}::float8, ${nowIso}::timestamp(3))
    ON CONFLICT ("key") DO UPDATE
    SET "tokens" = LEAST(
          ${capacity}::float8,
          "PwnRateBucket"."tokens"
            + GREATEST(0, EXTRACT(EPOCH FROM (${nowIso}::timestamp(3) - "PwnRateBucket"."updatedAt")))::float8 / 60.0 * ${refill}::float8
        ) - 1,
        "updatedAt" = ${nowIso}::timestamp(3)
    WHERE LEAST(
          ${capacity}::float8,
          "PwnRateBucket"."tokens"
            + GREATEST(0, EXTRACT(EPOCH FROM (${nowIso}::timestamp(3) - "PwnRateBucket"."updatedAt")))::float8 / 60.0 * ${refill}::float8
        ) >= 1
    RETURNING "tokens"
  `;
  if (granted.length > 0) return null;

  // Sin ficha: solo leemos para calcular cuánto falta.
  const row = await prisma.pwnRateBucket.findUnique({ where: { key }, select: { tokens: true, updatedAt: true } });
  const refilled = row
    ? Math.min(capacity, row.tokens + (Math.max(0, now - row.updatedAt.getTime()) / 60_000) * refill)
    : 0;
  return secondsUntilToken(refilled, refill);
}

/** Intenta tomar una ficha. Devuelve los segundos de espera si no hay. */
export async function takeRateToken(request: NextRequest, options: RateLimitOptions): Promise<number | null> {
  const now = Date.now();
  const key = `${options.route}:${callerKey(request, options)}`;
  try {
    return await takeSharedToken(key, options, now);
  } catch {
    return takeMemoryToken(key, options, now);
  }
}

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const seconds = await takeRateToken(request, options);
  return seconds === null ? null : tooMany(seconds, options.message);
}

/** Aplica varios límites en orden y corta en el primero que no alcanza. */
export async function checkRateLimits(
  request: NextRequest,
  list: RateLimitOptions[],
): Promise<NextResponse | null> {
  for (const options of list) {
    const limited = await checkRateLimit(request, options);
    if (limited) return limited;
  }
  return null;
}
// creado por pato dev y askforvini
