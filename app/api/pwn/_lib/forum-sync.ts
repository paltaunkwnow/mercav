import { prisma } from "@/lib/prisma";
import { PWN_FEED_SOURCES } from "@/lib/integrations/pwn/feed-catalog";
import {
  collectForumSignals,
  forumScrapeEnabled,
  forumSignalKey,
  type ForumThreadSignal,
} from "@/lib/integrations/pwn/forum-scraper";
import { correlateSignalBreach, enrichAfterForumSync, loadEnabledForumSourceNames } from "./forum-signal-enrichment";
import { safeDate, upsertPwnSource } from "./persistence";

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

async function upsertSignal(item: ForumThreadSignal, breachByName: Map<string, string>): Promise<string | null> {
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

  const row = await prisma.pwnForumSignal.upsert({
    where: { externalKey },
    create: {
      externalKey,
      sourceId: source.id,
      title: item.title.slice(0, 500),
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
      title: item.title.slice(0, 500),
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
  return row.id;
}

async function breachNameIndex(): Promise<Map<string, string>> {
  const hibp = await prisma.pwnSource.findFirst({ where: { name: "HIBP" }, select: { id: true } });
  if (!hibp) return new Map();
  const breaches = await prisma.pwnBreach.findMany({
    where: { sourceId: hibp.id },
    select: { id: true, name: true },
    take: 800,
    orderBy: { updatedAt: "desc" },
  });
  return new Map(breaches.map((b) => [b.name, b.id]));
}

/** Pulls allowlisted forum/news feeds and stores title + link only. */
export async function syncForumFeeds() {
  if (!forumScrapeEnabled()) {
    return { configured: false, fetched: 0, upserted: 0, sources: [] as string[], reclassified: 0, alerts: 0 };
  }
  const aggregate = await upsertPwnSource({
    name: "FORUM_SCRAPE",
    sourceType: "FORUM_SCRAPE",
    historicalReliability: 40,
    verificationMethod: "Scrape horario de titulares allowlisted",
  });
  const job = await prisma.pwnIngestionJob.create({
    data: { sourceId: aggregate.id, status: "RUNNING" },
  });
  try {
    const enabled = await loadEnabledForumSourceNames();
    const breachByName = await breachNameIndex();
    const signals = await collectForumSignals(enabled);
    const processedIds: string[] = [];
    let upserted = 0;
    for (const item of signals) {
      const id = await upsertSignal(item, breachByName);
      if (id) {
        upserted += 1;
        processedIds.push(id);
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
      sources,
      reclassified: enrichment.reclassified,
      alerts: enrichment.alerts,
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
