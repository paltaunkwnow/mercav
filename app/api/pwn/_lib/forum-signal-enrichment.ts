import { prisma } from "@/lib/prisma";
import { PWN_FEED_SOURCE_NAMES, resolveEnabledFeedSources } from "@/lib/integrations/pwn/feed-catalog";
import { isBoliviaRelatedSignal, isGovernmentRelatedSignal } from "@/lib/integrations/pwn/forum-classifier";
import { deriveSignalFields, domainMentionedInText, matchBreachNameInTitle } from "@/lib/integrations/pwn/forum-signal-utils";
import { openAlert } from "./alerts";
import { PROVEN_TARGET_WHERE } from "./targets";

export async function loadEnabledForumSourceNames(): Promise<Set<string>> {
  const rows = await prisma.pwnSource.findMany({
    where: { name: { in: [...PWN_FEED_SOURCE_NAMES] } },
    select: { name: true, enabled: true },
  });
  return resolveEnabledFeedSources(PWN_FEED_SOURCE_NAMES, rows);
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
  const map = new Map<string, string>();
  for (const row of breaches) map.set(row.name, row.id);
  return map;
}

export async function correlateSignalBreach(title: string, breachByName: Map<string, string>): Promise<string | null> {
  const names = [...breachByName.keys()];
  const matched = matchBreachNameInTitle(title, names);
  return matched ? breachByName.get(matched) ?? null : null;
}

async function applySignalFields(
  row: { id: string; title: string; category: string | null; forum: string | null; breachId: string | null },
  breachByName: Map<string, string>,
) {
  const fields = deriveSignalFields(row.title, row.category, row.forum);
  const breachId = row.breachId ?? (await correlateSignalBreach(row.title, breachByName));
  await prisma.pwnForumSignal.update({
    where: { id: row.id },
    data: {
      signalKind: fields.signalKind,
      priorityRank: fields.priorityRank,
      titleKey: fields.titleKey,
      ...(breachId ? { breachId } : {}),
    },
  });
}

/** Recomputes kind, priority and HIBP link for all rows (small tables) or a recent slice. */
export async function reclassifyForumSignalsFully(maxRows = 2000): Promise<number> {
  const breachByName = await breachNameIndex();
  const rows = await prisma.pwnForumSignal.findMany({
    orderBy: [{ lastSeenAt: "desc" }],
    take: maxRows,
    select: { id: true, title: true, category: true, forum: true, breachId: true },
  });
  for (const row of rows) await applySignalFields(row, breachByName);
  return rows.length;
}

/** @deprecated prefer reclassifyForumSignalsFully */
export async function reclassifyForumSignalsBatch(limit = 400): Promise<number> {
  const total = await prisma.pwnForumSignal.count();
  if (total <= 2000) return reclassifyForumSignalsFully(total);
  return reclassifyForumSignalsFully(limit);
}

/** Rows ingested before enrichment left priorityRank at 0 — recompute once. */
export async function reclassifyForumSignalsIfStale(): Promise<number> {
  const stale = await prisma.pwnForumSignal.count({ where: { priorityRank: 0 } });
  if (stale === 0) return 0;
  return reclassifyForumSignalsFully();
}

export async function createForumSignalAlertsForSignal(signalId: string): Promise<number> {
  const signal = await prisma.pwnForumSignal.findUnique({
    where: { id: signalId },
    select: {
      id: true,
      externalKey: true,
      title: true,
      link: true,
      category: true,
      forum: true,
      signalKind: true,
      priorityRank: true,
      verificationStatus: true,
      sourceId: true,
      source: { select: { name: true } },
      breach: { select: { name: true, verificationStatus: true } },
    },
  });
  if (!signal) return 0;
  if (signal.signalKind === "CREDENTIALS" && signal.priorityRank < 200) return 0;

  const targets = await prisma.pwnMonitoringTarget.findMany({
    where: {
      active: true,
      targetType: "DOMAIN",
      targetLookup: { not: null },
      ...PROVEN_TARGET_WHERE,
    },
    select: { id: true, userId: true, targetLookup: true, targetDisplay: true },
    take: 200,
  });

  let created = 0;
  const isGov = isGovernmentRelatedSignal(signal.title, signal.category, signal.forum);
  for (const target of targets) {
    const domain = target.targetLookup;
    if (!domain || !domainMentionedInText(signal.title, domain)) continue;
    const severity = isGov ? "CRITICAL" : signal.signalKind === "DATABASE" || signal.signalKind === "MIXED" ? "HIGH" : "MEDIUM";
    const result = await openAlert({
      userId: target.userId,
      targetId: target.id,
      sourceId: signal.sourceId,
      kind: "FORUM_SIGNAL",
      targetDisplay: target.targetDisplay,
      breachName: signal.breach?.name,
      severity,
      verificationStatus: signal.breach?.verificationStatus ?? signal.verificationStatus,
      sourceName: signal.source?.name ?? "FORUM_SCRAPE",
      forumTitle: signal.title.slice(0, 200),
      forumLink: signal.link,
      forumSignalKey: signal.externalKey,
      isGovernment: isGov,
    });
    if (result?.created) created += 1;
  }
  return created;
}

export async function enrichAfterForumSync(processedSignalIds: string[]): Promise<{ reclassified: number; alerts: number }> {
  const reclassified = await reclassifyForumSignalsFully();
  let alerts = 0;
  for (const id of processedSignalIds.slice(0, 80)) {
    alerts += await createForumSignalAlertsForSignal(id);
  }
  return { reclassified, alerts };
}

export async function forumSignalStats(where: Record<string, unknown> = {}) {
  const [total, database, mixed, credentials, other, stealer, corporate, rows] = await Promise.all([
    prisma.pwnForumSignal.count({ where }),
    prisma.pwnForumSignal.count({ where: { ...where, signalKind: "DATABASE" } }),
    prisma.pwnForumSignal.count({ where: { ...where, signalKind: "MIXED" } }),
    prisma.pwnForumSignal.count({ where: { ...where, signalKind: "CREDENTIALS" } }),
    prisma.pwnForumSignal.count({ where: { ...where, signalKind: "OTHER" } }),
    prisma.pwnForumSignal.count({ where: { ...where, signalKind: "STEALER" } }),
    prisma.pwnForumSignal.count({ where: { ...where, signalKind: "CORPORATE" } }),
    prisma.pwnForumSignal.findMany({
      where,
      select: { title: true, category: true, forum: true },
      take: 500,
    }),
  ]);
  let government = 0;
  let bolivia = 0;
  for (const row of rows) {
    if (isGovernmentRelatedSignal(row.title, row.category, row.forum)) government += 1;
    if (isBoliviaRelatedSignal(row.title, row.category, row.forum)) bolivia += 1;
  }
  return {
    total,
    database,
    mixed,
    credentials,
    other,
    stealer,
    corporate,
    government,
    bolivia,
    data: database + mixed + corporate,
  };
}
// creado por pato dev y askforvini
