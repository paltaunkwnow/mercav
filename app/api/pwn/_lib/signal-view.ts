import type { Prisma } from "@prisma/client";
import { isBoliviaRelatedSignal, isGovernmentRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";
import { scrubPublicTitle } from "@/lib/integrations/pwn/forum-scraper";

/** Columnas que se muestran de una señal de foro: solo metadatos públicos. */
export const signalSelect = {
  id: true,
  title: true,
  link: true,
  author: true,
  category: true,
  forum: true,
  publishedAt: true,
  lastSeenAt: true,
  verificationStatus: true,
  signalKind: true,
  priorityRank: true,
  source: { select: { name: true } },
  breach: { select: { name: true, verificationStatus: true } },
} satisfies Prisma.PwnForumSignalSelect;

// Fila tal cual la devuelve el select (antes se tipaba como el modelo completo y no matcheaba).
export type SignalRow = Prisma.PwnForumSignalGetPayload<{ select: typeof signalSelect }>;

const KINDS = ["DATABASE", "STEALER", "CORPORATE", "CREDENTIALS", "MIXED", "OTHER"] as const;

export function kindFilterFromParam(kind: string | undefined) {
  const k = kind?.trim().toUpperCase();
  if (k === "DATA") return { signalKind: { in: ["DATABASE", "MIXED", "CORPORATE"] as string[] } };
  if (k === "LEAKS") return { signalKind: { in: ["DATABASE", "STEALER", "CORPORATE", "MIXED"] as string[] } };
  if (KINDS.includes(k as (typeof KINDS)[number])) return { signalKind: k };
  return {};
}

export function mapSignalRow(row: SignalRow) {
  return {
    id: row.id,
    title: scrubPublicTitle(row.title),
    link: row.link,
    author: row.author,
    category: row.category,
    forum: row.forum,
    signalKind: row.signalKind,
    priorityRank: row.priorityRank,
    isGovernment: isGovernmentRelatedSignal(row.title, row.category, row.forum),
    isBolivia: isBoliviaRelatedSignal(row.title, row.category, row.forum),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    lastSeenAt: row.lastSeenAt.toISOString(),
    verificationStatus: row.verificationStatus,
    source: row.source?.name ?? null,
    breachName: row.breach?.name ?? null,
    breachVerificationStatus: row.breach?.verificationStatus ?? null,
  };
}
// creado por pato dev y askforvini
