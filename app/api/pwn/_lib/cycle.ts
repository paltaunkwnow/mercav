import type { PwnVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreConfidence } from "@/lib/pwn/confidence-engine";
import { scoreRisk } from "@/lib/pwn/risk-engine";
import { hibpConnector, fetchHibpBreachCatalog, searchDomainBreaches } from "@/lib/integrations/pwn/hibp";
import { PwnProviderError } from "@/lib/integrations/pwn/types";
import { fetchKevCatalog } from "@/lib/integrations/pwn/cisa-kev";
import { ensureSource, safeDate } from "./persistence";
import { openAlert } from "./alerts";
import { PROVEN_TARGET_WHERE } from "./targets";

const HIBP_RELIABILITY = 90;

/**
 * Filas que el código viejo marcó VERIFIED sin prueba (dominio en un GET, correo de una cuenta
 * sin confirmar): vuelven a pendiente. Las pruebas nuevas siempre dejan verifiedByUserId.
 */
export async function downgradeUnprovenTargets() {
  const result = await prisma.pwnMonitoringTarget.updateMany({
    where: { verificationStatus: "VERIFIED", verifiedByUserId: null },
    data: { verificationStatus: "PENDING", verifiedAt: null },
  });
  return { downgraded: result.count };
}

/**
 * Re-checks verified domains the owner follows. Emails stay hash-only (no hay cómo volver a
 * consultarlos sin el correo en claro): alertan cuando el dueño los consulta.
 */
export async function runDomainCycle(limit = 20) {
  const targets = await prisma.pwnMonitoringTarget.findMany({
    where: {
      active: true,
      targetType: "DOMAIN",
      targetLookup: { not: null },
      ...PROVEN_TARGET_WHERE,
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

    let result: Awaited<ReturnType<typeof searchDomainBreaches>>;
    try {
      result = await searchDomainBreaches(domain, { owned: true });
    } catch (error) {
      // Un dominio que falla no debe tumbar el ciclo; si HIBP nos limita, cortamos acá
      // y los objetivos restantes quedan para la próxima hora (orden por updatedAt).
      if (error instanceof PwnProviderError && error.rateLimited) break;
      if (error instanceof PwnProviderError) continue;
      throw error;
    }
    if (!result.configured) continue;

    const source = await ensureSource({
      name: "HIBP",
      sourceType: "BREACH_API",
      historicalReliability: HIBP_RELIABILITY,
      verificationMethod: "API oficial de HIBP",
    });

    for (const breach of result.data.data) {
      if (breach.isFabricated) continue;
      // Tipado explícito: sin esto TS ensancha a `string` y no matchea el enum de Prisma.
      const verificationStatus: PwnVerificationStatus = breach.isVerified ? "CORROBORATED" : "UNVERIFIED";
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

  return { scanned, alertsCreated, accountsLookup: hibpConnector.isConfigured() };
}

/** Public HIBP catalog — no API key. Fills /pwn/breaches so the list is not empty. */
export async function syncHibpCatalog(limit = 2500) {
  const catalog = await fetchHibpBreachCatalog({ fresh: true });
  if (!catalog.configured) return { configured: false, upserted: 0 };
  const source = await ensureSource({
    name: "HIBP",
    sourceType: "BREACH_API",
    historicalReliability: HIBP_RELIABILITY,
    verificationMethod: "Catálogo público HIBP",
  });
  const ranked = [...catalog.data]
    .filter((breach) => !breach.isFabricated)
    .sort((a, b) => {
      const da = Date.parse(a.addedDate ?? a.breachDate ?? "") || 0;
      const db = Date.parse(b.addedDate ?? b.breachDate ?? "") || 0;
      return db - da;
    })
    .slice(0, limit);
  const existing = await prisma.pwnBreach.findMany({
    where: { sourceId: source.id, name: { in: ranked.map((breach) => breach.name) } },
    select: { name: true },
  });
  const have = new Set(existing.map((row) => row.name));
  const now = new Date();
  const fresh = ranked.filter((breach) => !have.has(breach.name)).map((breach) => {
    // Tipado explícito: sin esto TS ensancha a `string` y no matchea el enum de Prisma.
    const verificationStatus: PwnVerificationStatus = breach.isVerified ? "CORROBORATED" : "UNVERIFIED";
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
    return {
      name: breach.name,
      description: breach.description ?? breach.title,
      publishedAt: safeDate(breach.addedDate),
      firstSeenAt: safeDate(breach.breachDate),
      lastSeenAt: safeDate(breach.modifiedDate) ?? now,
      discoveredAt: safeDate(breach.addedDate),
      sourceUrl: breach.sourceUrl,
      verificationStatus,
      confidenceScore: confidence.score,
      claimedRecordCount: breach.pwnCount == null ? null : Math.min(Math.max(0, breach.pwnCount), 2_147_483_647),
      dataTypes: breach.dataClasses,
      severity: risk.level,
      sourceId: source.id,
    };
  });
  if (fresh.length) {
    await prisma.pwnBreach.createMany({ data: fresh, skipDuplicates: true });
  }
  return { configured: true, upserted: fresh.length };
}

/** Stores the public CISA KEV catalog so vulnerability lookup does not depend on a live fetch. */
export async function syncKevCatalog() {
  const catalog = await fetchKevCatalog({ fresh: true });
  if (!catalog.configured) return { configured: false, upserted: 0 };
  const source = await ensureSource({
    name: "CISA_KEV",
    sourceType: "VULNERABILITY_FEED",
    historicalReliability: 95,
    verificationMethod: "Catálogo oficial CISA KEV",
  });
  // Antes se hacían ~1.400 upserts secuenciales por hora (riesgo de pasar maxDuration=60s).
  // Ahora solo se escriben los CVE que todavía no figuran como KEV.
  const known = await prisma.pwnVulnerability.findMany({
    where: { kev: true },
    select: { cveId: true },
  });
  const knownKev = new Set(known.map((row) => row.cveId.toUpperCase()));
  let upserted = 0;
  for (const entry of catalog.data) {
    if (knownKev.has(entry.cveId.toUpperCase())) continue;
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
// creado por pato dev y askforvini
