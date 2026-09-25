import { prisma } from "@/lib/prisma";
import { scoreConfidence } from "@/lib/pwn/confidence-engine";
import { scoreRisk } from "@/lib/pwn/risk-engine";
import { hibpConnector } from "@/lib/integrations/pwn/hibp";
import { fetchKevCatalog } from "@/lib/integrations/pwn/cisa-kev";
import { ensureSource, safeDate } from "./persistence";
import { openAlert } from "./alerts";

const HIBP_RELIABILITY = 90;

/**
 * Re-checks verified domains the owner registered. Emails are not stored, so
 * they are alerted only when that person searches them, not from this job.
 */
export async function runDomainCycle(limit = 20) {
  const targets = await prisma.pwnMonitoringTarget.findMany({
    where: {
      active: true,
      targetType: "DOMAIN",
      verifiedAt: { not: null },
      targetLookup: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      targetHash: true,
      targetLookup: true,
      targetDisplay: true,
    },
  });

  let alertsCreated = 0;
  let scanned = 0;

  for (const target of targets) {
    const domain = target.targetLookup;
    if (!domain) continue;
    scanned += 1;
    await prisma.pwnMonitoringTarget.update({
      where: { id: target.id },
      data: { targetDisplay: target.targetDisplay },
    });

    if (!hibpConnector.isConfigured()) continue;
    const result = await hibpConnector.search({ type: "domain", account: domain });
    if (!result.configured) continue;

    const source = await ensureSource({
      name: "HIBP",
      sourceType: "BREACH_API",
      historicalReliability: HIBP_RELIABILITY,
      verificationMethod: "API oficial de HIBP",
    });

    for (const breach of result.data) {
      if (breach.isFabricated) continue;
      const verificationStatus = breach.isVerified ? "CORROBORATED" : "UNVERIFIED";
      const confidence = scoreConfidence({
        sourceReliability: source.historicalReliability,
        verificationStatus,
        corroboratingSources: 0,
      });
      const risk = scoreRisk({
        severity: "MEDIUM",
        confidence: confidence.score,
        exposureKind: "DOMAIN",
      });
      const subjectHash = target.targetHash;
      const existingBreach = await prisma.pwnBreach.findFirst({
        where: { name: breach.name, sourceId: source.id },
        select: { id: true },
      });
      const breachRecord = existingBreach
        ? await prisma.pwnBreach.update({
            where: { id: existingBreach.id },
            data: {
              description: breach.description ?? breach.title,
              sourceUrl: breach.sourceUrl,
              verificationStatus,
              confidenceScore: confidence.score,
              dataTypes: breach.dataClasses,
              severity: risk.level,
              lastSeenAt: new Date(),
            },
          })
        : await prisma.pwnBreach.create({
            data: {
              name: breach.name,
              description: breach.description ?? breach.title,
              sourceUrl: breach.sourceUrl,
              sourceId: source.id,
              verificationStatus,
              confidenceScore: confidence.score,
              dataTypes: breach.dataClasses,
              severity: risk.level,
              publishedAt: safeDate(breach.addedDate),
              firstSeenAt: safeDate(breach.breachDate),
              lastSeenAt: new Date(),
            },
          });

      const existingExposure = await prisma.pwnExposure.findFirst({
        where: { subjectHash, breachId: breachRecord.id, sourceId: source.id },
        select: { id: true },
      });
      if (!existingExposure) {
        await prisma.pwnExposure.create({
          data: {
            kind: "DOMAIN",
            subjectHash,
            subjectHint: target.targetDisplay,
            breachId: breachRecord.id,
            sourceId: source.id,
            confidenceScore: confidence.score,
            verificationStatus,
            riskScore: risk.score,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
        });
      }
      const created = await openAlert({
        userId: target.userId,
        targetId: target.id,
        sourceId: source.id,
        kind: "BREACH",
        targetDisplay: target.targetDisplay,
        breachName: breach.name,
        severity: risk.level,
        verificationStatus,
        dataTypes: breach.dataClasses,
        sourceName: "HIBP",
      });
      if (created?.created) alertsCreated += 1;
    }
  }

  return { scanned, alertsCreated, configured: hibpConnector.isConfigured() };
}

/** Stores the public CISA KEV catalog so vulnerability lookup does not depend on a live fetch. */
export async function syncKevCatalog() {
  const catalog = await fetchKevCatalog();
  if (!catalog.configured) return { configured: false, upserted: 0 };
  const source = await ensureSource({
    name: "CISA_KEV",
    sourceType: "VULNERABILITY_FEED",
    historicalReliability: 95,
    verificationMethod: "Catálogo oficial CISA KEV",
  });
  let upserted = 0;
  for (const entry of catalog.data) {
    const description = entry.shortDescription ?? entry.vulnerabilityName ?? entry.cveId;
    await prisma.pwnVulnerability.upsert({
      where: { cveId: entry.cveId.toUpperCase() },
      create: {
        cveId: entry.cveId.toUpperCase(),
        description,
        severity: entry.knownRansomwareCampaignUse === "Known" ? "CRITICAL" : "HIGH",
        kev: true,
        sourceId: source.id,
        sourceUrl: entry.sourceUrl,
        publishedAt: safeDate(entry.dateAdded),
      },
      update: {
        description,
        kev: true,
        sourceId: source.id,
        sourceUrl: entry.sourceUrl,
        severity: entry.knownRansomwareCampaignUse === "Known" ? "CRITICAL" : "HIGH",
      },
    });
    upserted += 1;
  }
  return { configured: true, upserted };
}
// creado por Patodev y Invertilo
