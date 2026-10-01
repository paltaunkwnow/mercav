import { prisma } from "@/lib/prisma";
import { PWN_FEED_SOURCES } from "@/lib/integrations/pwn/feed-catalog";
import {
  collectForumSignals,
  forumScrapeEnabled,
  forumSignalKey,
  scrubPublicTitle,
  type ForumThreadSignal,
} from "@/lib/integrations/pwn/forum-scraper";
import { correlateSignalBreach, enrichAfterForumSync, loadEnabledForumSourceNames } from "./forum-signal-enrichment";
import { safeDate, upsertPwnSource } from "./persistence";
import { forumSyncSkipReason } from "@/lib/pwn/forum-sync-policy";
import { isBoliviaRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";

const SOURCE_META = Object.fromEntries(
  PWN_FEED_SOURCES.map((s) => [
    s.name,
    { label: s.label, reliability: s.reliability, method: s.method, sourceType: s.sourceType },
  ]),
);

async function ensureForumSource(name: string) {
  const meta = SOURCE_META[name] ?? {
    label: name,
    reliability: 30,
    method: "Feed de inteligencia pública",
    sourceType: "FORUM_SCRAPE",
  };
  return upsertPwnSource({
    name,
    sourceType: meta.sourceType,
    historicalReliability: meta.reliability,
    verificationMethod: meta.method,
  });
}

async function upsertSignal(item: ForumThreadSignal, breachByName: Map<string, string>): Promise<{ id: string; created: boolean } | null> {
  const source = await ensureForumSource(item.sourceName);
  const externalKey = forumSignalKey(item.link);
  const publishedAt = safeDate(item.publishedAt);
  const titleKey = item.titleKey ?? externalKey;
  const breachId = await correlateSignalBreach(item.title, breachByName);

  const duplicate = await prisma.pwnForumSignal.findFirst({
    where: { titleKey, NOT: { externalKey } },
    select: { priorityRank: true },
  });
  if (duplicate && duplicate.priorityRank >= item.priorityRank) return null;

  const existing = await prisma.pwnForumSignal.findUnique({
    where: { externalKey },
    select: { id: true },
  });

  const row = await prisma.pwnForumSignal.upsert({
    where: { externalKey },
    create: {
      externalKey,
      sourceId: source.id,
      title: scrubPublicTitle(item.title).slice(0, 500),
      link: item.link,
      author: item.author?.slice(0, 120) ?? null,
      category: item.category?.slice(0, 120) ?? null,
      forum: item.forum?.slice(0, 120) ?? null,
      signalKind: item.signalKind,
      priorityRank: item.priorityRank,
      titleKey,
      breachId,
      publishedAt,
      verificationStatus: "UNVERIFIED",
      lastSeenAt: new Date(),
    },
    update: {
      sourceId: source.id,
      title: scrubPublicTitle(item.title).slice(0, 500),
      author: item.author?.slice(0, 120) ?? null,
      category: item.category?.slice(0, 120) ?? null,
      forum: item.forum?.slice(0, 120) ?? null,
      signalKind: item.signalKind,
      priorityRank: item.priorityRank,
      titleKey,
      ...(breachId ? { breachId } : {}),
      publishedAt: publishedAt ?? undefined,
      lastSeenAt: new Date(),
    },
    select: { id: true },
  });
  return { id: row.id, created: !existing };
}

async function breachNameIndex(): Promise<Map<string, string>> {
  const hibp = await prisma.pwnSource.findFirst({ where: { name: "HIBP" }, select: { id: true } });
  if (!hibp) return new Map();
  const breaches = await prisma.pwnBreach.findMany({
    where: { sourceId: hibp.id },
    select: { id: true, name: true },
    take: 5000,
    orderBy: { updatedAt: "desc" },
  });
  return new Map(breaches.map((b) => [b.name, b.id]));
}

export type FreshSignal = {
  id: string;
  title: string;
  createdAt: string;
  isBolivia: boolean;
};

export type ForumSyncResult = {
  configured: boolean;
  fetched: number;
  upserted: number;
  sources: string[];
  reclassified: number;
  alerts: number;
  skipped?: boolean;
  skipReason?: "fresh" | "in_flight";
  lastFinishedAt?: string | null;
  created?: number;
  newItems?: FreshSignal[];
};

export async function listFreshSignals(since: Date, take = 5): Promise<{ count: number; samples: FreshSignal[] }> {
  const where = { createdAt: { gt: since } };
  const [count, rows] = await Promise.all([
    prisma.pwnForumSignal.count({ where }),
    prisma.pwnForumSignal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, createdAt: true, category: true, forum: true },
    }),
  ]);
  return {
    count,
    samples: rows.map((row) => ({
      id: row.id,
      title: scrubPublicTitle(row.title),
      createdAt: row.createdAt.toISOString(),
      isBolivia: isBoliviaRelatedSignal(row.title, row.category, row.forum),
    })),
  };
}

async function latestForumJobs() {
  const [lastSuccess, running] = await Promise.all([
    prisma.pwnIngestionJob.findFirst({
      where: { source: { name: "FORUM_SCRAPE" }, status: "SUCCESS" },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
    prisma.pwnIngestionJob.findFirst({
      where: { source: { name: "FORUM_SCRAPE" }, status: "RUNNING" },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    }),
  ]);
  return { lastSuccess, running };
}

/** Pulls allowlisted forum/news feeds and stores title + link only. */
export async function syncForumFeeds(options?: { force?: boolean }): Promise<ForumSyncResult> {
  if (!forumScrapeEnabled()) {
    return { configured: false, fetched: 0, upserted: 0, sources: [] as string[], reclassified: 0, alerts: 0 };
  }
  const aggregate = await upsertPwnSource({
    name: "FORUM_SCRAPE",
    sourceType: "FORUM_SCRAPE",
    historicalReliability: 40,
    verificationMethod: "Sincronización de titulares en segundo plano",
  });
  const { lastSuccess, running } = await latestForumJobs();
  const skip = forumSyncSkipReason({
    force: options?.force === true,
    lastSuccessAt: lastSuccess?.finishedAt ?? null,
    runningSince: running?.startedAt ?? null,
  });
  if (skip) {
    return {
      configured: true,
      fetched: 0,
      upserted: 0,
      sources: [],
      reclassified: 0,
      alerts: 0,
      skipped: true,
      skipReason: skip,
      lastFinishedAt: lastSuccess?.finishedAt?.toISOString() ?? null,
      created: 0,
      newItems: [],
    };
  }
  const job = await prisma.pwnIngestionJob.create({
    data: { sourceId: aggregate.id, status: "RUNNING" },
  });
  try {
    const enabled = await loadEnabledForumSourceNames();
    const breachByName = await breachNameIndex();
    const signals = await collectForumSignals(enabled);
    const processedIds: string[] = [];
    let upserted = 0;
    let created = 0;
    const newItems: FreshSignal[] = [];
    for (const item of signals) {
      const row = await upsertSignal(item, breachByName);
      if (row) {
        upserted += 1;
        processedIds.push(row.id);
        if (row.created) {
          created += 1;
          if (newItems.length < 5) {
            newItems.push({
              id: row.id,
              title: scrubPublicTitle(item.title),
              createdAt: new Date().toISOString(),
              isBolivia: isBoliviaRelatedSignal(item.title, item.category, item.forum),
            });
          }
        }
      }
    }
    const enrichment = await enrichAfterForumSync(processedIds);
    const sources = [...new Set(signals.map((s) => s.sourceName))];
    await prisma.pwnIngestionJob.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
    return {
      configured: true,
      fetched: signals.length,
      upserted,
      created,
      newItems,
      sources,
      reclassified: enrichment.reclassified,
      alerts: enrichment.alerts,
      lastFinishedAt: new Date().toISOString(),
    };
  } catch (error) {
    await prisma.pwnIngestionJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message.slice(0, 240) : "Error de scrape",
      },
    });
    throw error;
  }
}
// creado por pato dev y askforvini
