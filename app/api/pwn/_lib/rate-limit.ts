import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp } from "./http";

type Bucket = {
  tokens: number;
  updatedAt: number;
  lastSeenAt: number;
};

type RateLimitOptions = {
  route: string;
  capacity: number;
  refillPerMinute: number;
  /** Signed-in callers are keyed by user id instead of IP. */
  userId?: string | null;
};

export const ANONYMOUS_SEARCH_PER_MINUTE = 3;
export const AUTHENTICATED_SEARCH_PER_MINUTE = 60;

/** Limits for the exposure and password-range routes, which accept anonymous callers. */
export function searchLimit(userId: string | null | undefined) {
  const perMinute = userId ? AUTHENTICATED_SEARCH_PER_MINUTE : ANONYMOUS_SEARCH_PER_MINUTE;
  return { capacity: perMinute, refillPerMinute: perMinute, userId: userId ?? null };
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

function callerKey(request: NextRequest, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const ipHash = createHash("sha256").update(clientIp(request), "utf8").digest("hex");
  return `ip:${ipHash}`;
}

function tooMany(refillPerMinute: number, tokens: number) {
  const seconds = Math.max(1, Math.ceil(((1 - tokens) / refillPerMinute) * 60));
  return NextResponse.json(
    { success: false, error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}

function takeMemoryToken(key: string, options: RateLimitOptions, now: number) {
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
    return tooMany(options.refillPerMinute, bucket.tokens);
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return null;
}

async function takeSharedToken(key: string, options: RateLimitOptions, now: number) {
  const nowDate = new Date(now);
  const row = await prisma.pwnRateBucket.findUnique({ where: { key } });
  const elapsedMinutes = row ? Math.max(0, now - row.updatedAt.getTime()) / 60_000 : 0;
  const refilled = Math.min(
    options.capacity,
    (row?.tokens ?? options.capacity) + elapsedMinutes * options.refillPerMinute,
  );
  if (refilled < 1) {
    await prisma.pwnRateBucket.upsert({
      where: { key },
      create: { key, tokens: refilled, updatedAt: nowDate },
      update: { tokens: refilled, updatedAt: nowDate },
    });
    return tooMany(options.refillPerMinute, refilled);
  }
  await prisma.pwnRateBucket.upsert({
    where: { key },
    create: { key, tokens: refilled - 1, updatedAt: nowDate },
    update: { tokens: refilled - 1, updatedAt: nowDate },
  });
  return null;
}

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const now = Date.now();
  const key = `${options.route}:${callerKey(request, options.userId)}`;
  try {
    return await takeSharedToken(key, options, now);
  } catch {
    return takeMemoryToken(key, options, now);
  }
}
