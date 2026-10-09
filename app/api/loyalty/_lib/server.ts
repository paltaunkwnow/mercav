import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import type { NextResponse } from "next/server";
import type { LoyaltyCard } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadProgram, programInclude } from "@/lib/business/loyalty/service";
import { KIOSK_STEP_SECONDS, kioskCode } from "@/lib/business/loyalty/codes";
import { matchesAudience, normalizeAudience } from "@/lib/business/loyalty/campaigns";
import type { LoyaltyProgramView } from "@/lib/business/loyalty/types";
import { APP_URL, hostKindFor } from "@/lib/seo/site";

/*
 * Piezas de servidor de la tarjeta pública (/c) y su API (/api/loyalty).
 * La tarjeta del cliente se recuerda con una cookie httpOnly por programa: mv_lc_<programId> = serial.
 * Se guarda dos veces, con Path=/c (páginas) y Path=/api/loyalty (autoservicio y tarjeta en vivo),
 * así no viaja con el resto de las peticiones de app.mercav.lat.
 */

export type ProgramFull = NonNullable<Awaited<ReturnType<typeof loadProgram>>>;

export const SERIAL_RE = /^[A-Z2-7]{24}$/;
export const SLUG_RE = /^[A-Za-z0-9_-]{1,100}$/;
export const KIOSK_CODE_RE = /^\d{6}$/;

const COOKIE_PATHS = ["/c", "/api/loyalty"] as const;
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export function cardCookieName(programId: string) {
  return `mv_lc_${programId}`;
}

/** Recuerda la tarjeta en este navegador (~400 días). Va como encabezados crudos porque son dos cookies del mismo nombre. */
export function setCardCookie(res: NextResponse, programId: string, serial: string) {
  const expires = new Date(Date.now() + COOKIE_MAX_AGE * 1000).toUTCString();
  const secure = process.env.NODE_ENV === "production";
  for (const path of COOKIE_PATHS) {
    const parts = [`${cardCookieName(programId)}=${serial}`, `Path=${path}`, `Max-Age=${COOKIE_MAX_AGE}`, `Expires=${expires}`, "HttpOnly", "SameSite=Lax"];
    if (secure) parts.push("Secure");
    res.headers.append("Set-Cookie", parts.join("; "));
  }
}

export function cardPath(slug: string, serial: string) {
  return `/c/${slug}/t/${serial}`;
}

/** Origen absoluto para el QR y los links para compartir. En producción siempre app.mercav.lat. */
export function originFor(host: string | null | undefined, proto: string | null | undefined) {
  if (hostKindFor(host) !== "dev") return APP_URL;
  const h = host?.trim() || "127.0.0.1:1337";
  const local = /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(h);
  const p = proto?.split(",")[0]?.trim() || (local ? "http" : "https");
  return `${p === "http" || p === "https" ? p : "https"}://${h}`;
}

export function pageOrigin() {
  const h = headers();
  return originFor(h.get("host"), h.get("x-forwarded-proto"));
}

/** Programa por slug para las páginas públicas. null si no existe o está archivado. */
export async function loadPublicProgram(slug: string): Promise<ProgramFull | null> {
  if (!SLUG_RE.test(slug)) return null;
  const program = await loadProgram({ slug });
  return program && program.status !== "ARCHIVED" ? program : null;
}

/** La tarjeta de ese serial, solo si es de ese programa. */
export async function findProgramCard(programId: string, serial: string | null | undefined): Promise<LoyaltyCard | null> {
  if (!serial || !SERIAL_RE.test(serial)) return null;
  const card = await prisma.loyaltyCard.findUnique({ where: { serial } });
  return card && card.programId === programId ? card : null;
}

/** Tarjeta + programa por slug y serial (el slug tiene que coincidir). */
export async function loadCardForSlug(slug: string, serial: string) {
  if (!SLUG_RE.test(slug) || !SERIAL_RE.test(serial)) return null;
  const card = await prisma.loyaltyCard.findUnique({ where: { serial }, include: { program: { include: programInclude } } });
  if (!card || card.program.slug !== slug) return null;
  return card;
}

/** Último mensaje del negocio (30 días, sin vencer) que le corresponde a esta tarjeta. */
export async function latestCampaignFor(programId: string, card: LoyaltyCard, view: Pick<LoyaltyProgramView, "rules" | "rewards">, now = new Date()) {
  if (!card.marketingConsent) return null;
  const campaigns = await prisma.loyaltyCampaign.findMany({
    where: { programId, createdAt: { gte: new Date(now.getTime() - 30 * 86_400_000) }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, body: true, audience: true, createdAt: true, expiresAt: true },
  });
  const costs = view.rewards.filter((r) => r.active).map((r) => r.cost);
  const minRewardCost = costs.length ? Math.min(...costs) : null;
  const match = campaigns.find((c) => matchesAudience(normalizeAudience(c.audience), card, { rules: view.rules, minRewardCost, now }));
  return match ? { id: match.id, title: match.title, body: match.body, createdAt: match.createdAt.toISOString(), expiresAt: match.expiresAt?.toISOString() ?? null } : null;
}

/** Tras sumarse, se acepta un código del mostrador de hasta 10 minutos atrás: completar el formulario lleva más que los 60 s del QR. */
export const JOIN_GRACE_MS = 10 * 60_000;

export function codeSeenRecently(secret: string, code: string, now: Date, windowMs = JOIN_GRACE_MS) {
  if (!KIOSK_CODE_RE.test(code)) return false;
  const steps = Math.ceil(windowMs / (KIOSK_STEP_SECONDS * 1000));
  const given = Buffer.from(code);
  let found = false;
  for (let i = 0; i <= steps; i++) {
    const expected = Buffer.from(kioskCode(secret, new Date(now.getTime() - i * KIOSK_STEP_SECONDS * 1000)));
    if (timingSafeEqual(expected, given)) found = true;
  }
  return found;
}
// creado por pato dev y askforvini
