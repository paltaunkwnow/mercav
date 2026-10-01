import { NextRequest, NextResponse } from "next/server";
import type { PwnVerificationStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { scoreConfidence } from "@/lib/pwn/confidence-engine";
import { scoreRisk } from "@/lib/pwn/risk-engine";
import { cisaKevConnector, hibpConnector, nvdConnector } from "@/lib/integrations/pwn";
import {
  disabledResponse,
  forbidden,
  getPwnSessionUser,
  internalError,
  isAdmin,
  providerError,
  unauthorized,
  validationError,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import {
  ensureSource,
  safeDate,
  severityFromCvss,
  writeAudit,
} from "../_lib/persistence";

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cve"), cve: z.string().trim().toUpperCase().regex(/^CVE-\d{4}-\d{4,}$/) }).strict(),
  z.object({ type: z.literal("breach"), name: z.string().trim().min(1).max(200) }).strict(),
]);

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const limited = await checkRateLimit(request, {
    route: "admin-ingest",
    capacity: 10,
    refillPerMinute: 10,
    userId: user.id,
  });
  if (limited) return limited;

  let jobId: string | null = null;
  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());

    if (parsed.data.type === "breach") {
      const result = await hibpConnector.search({
        type: "breach",
        account: parsed.data.name,
      });
      if (!result.configured) {
        return NextResponse.json({ success: true, configured: false, data: null });
      }
      const breach = result.data[0];
      if (!breach) {
        return NextResponse.json({ success: true, configured: true, data: null });
      }
      const source = await ensureSource({
        name: "HIBP",
        sourceType: "BREACH_API",
        historicalReliability: 90,
        verificationMethod: "API oficial de HIBP",
      });
      const job = await prisma.pwnIngestionJob.create({
        data: { sourceId: source.id, status: "RUNNING" },
      });
      jobId = job.id;
      const verificationStatus: PwnVerificationStatus = breach.isVerified ? "CORROBORATED" : "UNVERIFIED";
      const confidence = scoreConfidence({
        sourceReliability: source.historicalReliability,
        verificationStatus,
        corroboratingSources: 0,
      });
      const risk = scoreRisk({ severity: "MEDIUM", confidence: confidence.score });
      const existing = await prisma.pwnBreach.findFirst({
        where: { name: breach.name, sourceId: source.id },
        select: { id: true },
      });
      const values = {
        description: breach.description ?? breach.title,
        discoveredAt: safeDate(breach.addedDate),
        publishedAt: safeDate(breach.addedDate),
        firstSeenAt: safeDate(breach.breachDate),
        lastSeenAt: safeDate(breach.modifiedDate) ?? new Date(),
        sourceUrl: breach.sourceUrl,
        verificationStatus,
        confidenceScore: confidence.score,
        // Prisma Int es int32.
        claimedRecordCount:
          breach.pwnCount == null ? null : Math.min(Math.max(0, breach.pwnCount), 2_147_483_647),
        dataTypes: breach.dataClasses,
        severity: risk.level,
      };
      const record = existing
        ? await prisma.pwnBreach.update({ where: { id: existing.id }, data: values })
        : await prisma.pwnBreach.create({
            data: { ...values, name: breach.name, sourceId: source.id },
          });
      await prisma.pwnIngestionJob.update({
        where: { id: job.id },
        // Mismo estado que el ciclo/foros ("SUCCESS"); "COMPLETED" no lo lee nadie.
        data: { status: "SUCCESS", finishedAt: new Date() },
      });
      await writeAudit({
        actorId: user.id,
        action: "INGEST_BREACH",
        targetType: "BREACH",
        targetId: record.id,
        metadata: { provider: "HIBP", jobId: job.id },
      });
      return NextResponse.json({ success: true, configured: true, data: record });
    }

    const [nvdResult, kevResult] = await Promise.all([
      nvdConnector.search({ cveId: parsed.data.cve }),
      cisaKevConnector.search({ cveId: parsed.data.cve }),
    ]);
    if (!nvdResult.configured || !kevResult.configured) {
      return NextResponse.json({ success: true, configured: false, data: null });
    }
    const nvd = nvdResult.data[0] ?? null;
    const kev = kevResult.data[0] ?? null;
    if (!nvd && !kev) {
      return NextResponse.json({ success: true, configured: true, data: null });
    }
    const nvdSource = await ensureSource({
      name: "NVD",
      sourceType: "VULNERABILITY_DB",
      historicalReliability: 95,
      verificationMethod: "API oficial de NVD",
    });
    const source = kev
      ? await ensureSource({
          name: "CISA_KEV",
          sourceType: "VULNERABILITY_CATALOG",
          historicalReliability: 95,
          verificationMethod: "Catálogo oficial CISA KEV",
        })
      : nvdSource;
    const job = await prisma.pwnIngestionJob.create({
      data: { sourceId: source.id, status: "RUNNING" },
    });
    jobId = job.id;
    const references = [
      ...(nvd?.references ?? []),
      ...(nvd ? [nvd.sourceUrl] : []),
      ...(kev ? [kev.sourceUrl] : []),
    ].filter((value, index, all) => all.indexOf(value) === index);
    const record = await prisma.pwnVulnerability.upsert({
      where: { cveId: parsed.data.cve },
      update: {
        description: nvd?.description ?? kev?.shortDescription ?? kev?.vulnerabilityName ?? parsed.data.cve,
        cvssScore: nvd?.cvssScore,
        severity: severityFromCvss(nvd?.cvssScore ?? null),
        kev: Boolean(kev),
        sourceId: source.id,
        sourceUrl: kev?.sourceUrl ?? nvd?.sourceUrl,
        publishedAt: safeDate(nvd?.publishedAt) ?? safeDate(kev?.dateAdded),
        references,
      },
      create: {
        cveId: parsed.data.cve,
        description: nvd?.description ?? kev?.shortDescription ?? kev?.vulnerabilityName ?? parsed.data.cve,
        cvssScore: nvd?.cvssScore,
        severity: severityFromCvss(nvd?.cvssScore ?? null),
        kev: Boolean(kev),
        sourceId: source.id,
        sourceUrl: kev?.sourceUrl ?? nvd?.sourceUrl,
        publishedAt: safeDate(nvd?.publishedAt) ?? safeDate(kev?.dateAdded),
        references,
      },
    });
    await prisma.pwnIngestionJob.update({
      where: { id: job.id },
      // Mismo estado que el ciclo/foros ("SUCCESS"); "COMPLETED" no lo lee nadie.
        data: { status: "SUCCESS", finishedAt: new Date() },
    });
    await writeAudit({
      actorId: user.id,
      action: "INGEST_CVE",
      targetType: "CVE",
      targetId: record.id,
      metadata: { cveId: parsed.data.cve, provider: kev ? "NVD+CISA_KEV" : "NVD", jobId: job.id },
    });
    return NextResponse.json({ success: true, configured: true, data: record });
  } catch (error) {
    if (jobId) {
      await prisma.pwnIngestionJob
        .update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            error: "El proveedor externo no completó la ingestión",
          },
        })
        .catch(() => undefined);
    }
    const upstream = providerError(error);
    return upstream ?? internalError("admin ingestion", error);
  }
}
// creado por pato dev y askforvini
