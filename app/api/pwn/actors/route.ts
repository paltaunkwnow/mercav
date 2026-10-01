import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGovernmentRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";
import { scrubPublicTitle } from "@/lib/integrations/pwn/forum-scraper";
import { disabledResponse, getPwnSessionUser, internalError } from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const sessionUser = await getPwnSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  const limited = await checkRateLimit(request, {
    route: "forum-actors",
    capacity: 40,
    refillPerMinute: 40,
    userId: sessionUser.id,
  });
  if (limited) return limited;

  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(40, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "20") || 20));
    const grouped = await prisma.pwnForumSignal.groupBy({
      by: ["author"],
      where: { author: { not: null } },
      _count: { _all: true },
      _max: { lastSeenAt: true, publishedAt: true, priorityRank: true },
    });
    const ranked = grouped
      .filter((row) => row.author)
      .sort((a, b) => {
        const pa = b._max.priorityRank ?? 0;
        const pb = a._max.priorityRank ?? 0;
        if (pa !== pb) return pa - pb;
        const ta = b._max.lastSeenAt?.getTime() ?? 0;
        const tb = a._max.lastSeenAt?.getTime() ?? 0;
        return ta - tb;
      });
    const total = ranked.length;
    const slice = ranked.slice((page - 1) * limit, page * limit);
    const authors = slice.map((row) => row.author).filter((name): name is string => Boolean(name));
    const latest = authors.length
      ? await prisma.pwnForumSignal.findMany({
          where: { author: { in: authors } },
          orderBy: [{ lastSeenAt: "desc" }],
          take: 400,
          select: {
            author: true,
            title: true,
            link: true,
            forum: true,
            signalKind: true,
            lastSeenAt: true,
            category: true,
          },
        })
      : [];
    const firstByAuthor = new Map<string, (typeof latest)[number]>();
    for (const row of latest) {
      if (!row.author || firstByAuthor.has(row.author)) continue;
      firstByAuthor.set(row.author, row);
    }
    const kindsByAuthor = new Map<string, Set<string>>();
    for (const row of latest) {
      if (!row.author) continue;
      const set = kindsByAuthor.get(row.author) ?? new Set<string>();
      set.add(row.signalKind);
      kindsByAuthor.set(row.author, set);
    }

    return NextResponse.json({
      success: true,
      data: {
        items: slice.map((row) => {
          const author = row.author as string;
          const preview = firstByAuthor.get(author);
          return {
            author,
            signalCount: row._count._all,
            lastSeenAt: row._max.lastSeenAt?.toISOString() ?? null,
            latestTitle: preview ? scrubPublicTitle(preview.title) : null,
            latestLink: preview?.link ?? null,
            forum: preview?.forum ?? null,
            kinds: [...(kindsByAuthor.get(author) ?? [])],
            isGovernment: preview
              ? isGovernmentRelatedSignal(preview.title, preview.category, preview.forum)
              : false,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return internalError("forum actors", error);
  }
}
