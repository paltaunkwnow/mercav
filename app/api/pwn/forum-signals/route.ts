import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isBoliviaRelatedSignal, isGovernmentRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";
import { scrubPublicTitle } from "@/lib/integrations/pwn/forum-scraper";
import { disabledResponse, getPwnSessionUser, internalError } from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { forumSignalStats } from "../_lib/forum-signal-enrichment";
import { listFreshSignals, syncForumFeeds } from "../_lib/forum-sync";
import { createNotification } from "@/lib/notifications";
import { formatLeakNotice, shouldNotifyNewLeaks } from "@/lib/pwn/new-leak-notice";
import { FORUM_SYNC_INTERVAL_MS } from "@/lib/pwn/forum-sync-policy";

export const maxDuration = 60;

const signalSelect = {
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
type SignalRow = Prisma.PwnForumSignalGetPayload<{ select: typeof signalSelect }>;

const KINDS = ["DATABASE", "STEALER", "CORPORATE", "CREDENTIALS", "MIXED", "OTHER"] as const;

function kindFilterFromParam(kind: string | undefined) {
  const k = kind?.trim().toUpperCase();
  if (k === "DATA") return { signalKind: { in: ["DATABASE", "MIXED", "CORPORATE"] as string[] } };
  if (k === "LEAKS") return { signalKind: { in: ["DATABASE", "STEALER", "CORPORATE", "MIXED"] as string[] } };
  if (KINDS.includes(k as (typeof KINDS)[number])) return { signalKind: k };
  return {};
}

function mapRow(row: SignalRow) {
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

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  const sessionUser = await getPwnSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const limited = await checkRateLimit(request, {
    route: "forum-signals",
    capacity: 60,
    refillPerMinute: 60,
    userId: sessionUser.id,
  });
  if (limited) return limited;

  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "20") || 20));
    const skip = (page - 1) * limit;
    const kind = request.nextUrl.searchParams.get("kind")?.trim();
    const govOnly = request.nextUrl.searchParams.get("gov") === "true";
    const boliviaOnly = request.nextUrl.searchParams.get("bolivia") === "true";
    const author = request.nextUrl.searchParams.get("author")?.trim();
    const sinceRaw = request.nextUrl.searchParams.get("since")?.trim();
    const since = sinceRaw ? new Date(sinceRaw) : null;
    const kindFilter = kindFilterFromParam(kind);
    const where = {
      ...kindFilter,
      ...(author ? { author: { equals: author, mode: "insensitive" as const } } : {}),
      ...(since && !Number.isNaN(since.getTime()) ? { lastSeenAt: { gte: since } } : {}),
    };

    const lastJobPromise = prisma.pwnIngestionJob.findFirst({
      where: { source: { name: "FORUM_SCRAPE" }, status: "SUCCESS" },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true, status: true },
    });

    let total: number;
    let rows: SignalRow[];

    if (govOnly || boliviaOnly) {
      const all = await prisma.pwnForumSignal.findMany({
        where,
        orderBy: [{ priorityRank: "desc" }, { publishedAt: "desc" }, { lastSeenAt: "desc" }],
        take: 500,
        select: signalSelect,
      });
      const filtered = all.filter((row) => {
        if (govOnly && !isGovernmentRelatedSignal(row.title, row.category, row.forum)) return false;
        if (boliviaOnly && !isBoliviaRelatedSignal(row.title, row.category, row.forum)) return false;
        return true;
      });
      total = filtered.length;
      rows = filtered.slice(skip, skip + limit);
    } else {
      [total, rows] = await Promise.all([
        prisma.pwnForumSignal.count({ where }),
        prisma.pwnForumSignal.findMany({
          where,
          orderBy: [{ priorityRank: "desc" }, { publishedAt: "desc" }, { lastSeenAt: "desc" }],
          skip,
          take: limit,
          select: signalSelect,
        }),
      ]);
    }

    const [lastJob, stats] = await Promise.all([lastJobPromise, forumSignalStats(kindFilter)]);

    if (total === 0 && !govOnly && !boliviaOnly && !author) {
      void syncForumFeeds().catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      configured: true,
      data: {
        items: rows.map(mapRow),
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        stats,
        sync: {
          lastFinishedAt: lastJob?.finishedAt?.toISOString() ?? null,
          lastStatus: lastJob?.status ?? null,
        },
      },
    });
  } catch (error) {
    return internalError("forum signals", error);
  }
}

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const sessionUser = await getPwnSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  const limited = await checkRateLimit(request, {
    route: "forum-signals-patrol",
    capacity: 8,
    refillPerMinute: 8,
    userId: sessionUser.id,
  });
  if (limited) return limited;
  try {
    const force = request.nextUrl.searchParams.get("force") === "1";
    const sinceRaw = request.nextUrl.searchParams.get("since")?.trim();
    const since = sinceRaw ? new Date(sinceRaw) : null;
    const sinceValid = since && !Number.isNaN(since.getTime()) ? since : null;
    const priorCount = await prisma.pwnForumSignal.count();
    const result = await syncForumFeeds({ force });
    const fromSync = result.created ?? 0;
    const fresh = sinceValid ? await listFreshSignals(sinceValid) : { count: fromSync, samples: result.newItems ?? [] };
    const notify = shouldNotifyNewLeaks({ priorCount, freshCount: fresh.count });
    let notified = false;
    if (notify) {
      const recent = await prisma.notification.findFirst({
        where: {
          userId: sessionUser.id,
          type: "PWN_NEW_LEAKS",
          createdAt: { gte: new Date(Date.now() - FORUM_SYNC_INTERVAL_MS) },
        },
        select: { id: true },
      });
      if (!recent) {
        const copy = formatLeakNotice({ count: fresh.count, samples: fresh.samples });
        if (copy) {
          await createNotification(sessionUser.id, "PWN_NEW_LEAKS", copy.title, copy.body, "/pwn/signals?kind=LEAKS");
          notified = true;
        }
      }
    }
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        freshCount: fresh.count,
        freshSamples: fresh.samples,
        notified,
      },
    });
  } catch (error) {
    return internalError("forum patrol", error);
  }
}
