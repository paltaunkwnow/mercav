import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBoliviaRelatedSignal, isGovernmentRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";
import { disabledResponse, getPwnSessionUser, internalError, isAdmin, isCronAuthorized } from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { forumSignalStats } from "../_lib/forum-signal-enrichment";
import { kindFilterFromParam, mapSignalRow, signalSelect, type SignalRow } from "../_lib/signal-view";
import { listFreshSignals, syncForumFeeds } from "../_lib/forum-sync";
import { createNotification } from "@/lib/notifications";
import { formatLeakNotice, shouldNotifyNewLeaks } from "@/lib/pwn/new-leak-notice";
import { FORUM_SYNC_INTERVAL_MS, mayForceForumSync } from "@/lib/pwn/forum-sync-policy";

export const maxDuration = 60;

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
        items: rows.map(mapSignalRow),
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
    // force salta la ventana de 10 min (scrape completo): solo administradores o el cron.
    const force = mayForceForumSync({
      requested: request.nextUrl.searchParams.get("force") === "1",
      isAdmin: isAdmin(sessionUser),
      cronAuthorized: isCronAuthorized(request),
    });
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
        forced: force,
      },
    });
  } catch (error) {
    return internalError("forum patrol", error);
  }
}
