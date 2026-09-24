import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGovernmentRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";
import { disabledResponse, getPwnSessionUser, internalError } from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { forumSignalStats, reclassifyForumSignalsIfStale } from "../_lib/forum-signal-enrichment";

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
} as const;

function kindFilterFromParam(kind: string | undefined) {
  const k = kind?.trim().toUpperCase();
  if (k === "DATA") return { signalKind: { in: ["DATABASE", "MIXED"] as string[] } };
  if (k === "DATABASE" || k === "CREDENTIALS" || k === "MIXED" || k === "OTHER") return { signalKind: k };
  return {};
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
  });
  if (limited) return limited;

  try {
    await reclassifyForumSignalsIfStale();

    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "20") || 20));
    const skip = (page - 1) * limit;
    const kind = request.nextUrl.searchParams.get("kind")?.trim();
    const govOnly = request.nextUrl.searchParams.get("gov") === "true";
    const kindFilter = kindFilterFromParam(kind);

    const lastJobPromise = prisma.pwnIngestionJob.findFirst({
      where: { source: { sourceType: "FORUM_SCRAPE" } },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true, status: true },
    });

    let total: number;
    let rows: Awaited<ReturnType<typeof prisma.pwnForumSignal.findMany>>;

    if (govOnly) {
      const all = await prisma.pwnForumSignal.findMany({
        where: kindFilter,
        orderBy: [{ priorityRank: "desc" }, { publishedAt: "desc" }, { lastSeenAt: "desc" }],
        take: 500,
        select: signalSelect,
      });
      const govRows = all.filter((row) => isGovernmentRelatedSignal(row.title, row.category, row.forum));
      total = govRows.length;
      rows = govRows.slice(skip, skip + limit);
    } else {
      [total, rows] = await Promise.all([
        prisma.pwnForumSignal.count({ where: kindFilter }),
        prisma.pwnForumSignal.findMany({
          where: kindFilter,
          orderBy: [{ priorityRank: "desc" }, { publishedAt: "desc" }, { lastSeenAt: "desc" }],
          skip,
          take: limit,
          select: signalSelect,
        }),
      ]);
    }

    const [lastJob, stats] = await Promise.all([lastJobPromise, forumSignalStats(kindFilter)]);

    return NextResponse.json({
      success: true,
      configured: true,
      data: {
        items: rows.map((row) => ({
          id: row.id,
          title: row.title,
          link: row.link,
          author: row.author,
          category: row.category,
          forum: row.forum,
          signalKind: row.signalKind,
          priorityRank: row.priorityRank,
          isGovernment: isGovernmentRelatedSignal(row.title, row.category, row.forum),
          publishedAt: row.publishedAt?.toISOString() ?? null,
          lastSeenAt: row.lastSeenAt.toISOString(),
          verificationStatus: row.verificationStatus,
          source: row.source?.name ?? null,
          breachName: row.breach?.name ?? null,
          breachVerificationStatus: row.breach?.verificationStatus ?? null,
        })),
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
