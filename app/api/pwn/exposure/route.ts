import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redactEmail, redactSubject, hashSubject } from "@/lib/pwn/redaction";
import { scoreConfidence } from "@/lib/pwn/confidence-engine";
import { scoreRisk } from "@/lib/pwn/risk-engine";
import { hibpConnector, type HibpBreach } from "@/lib/integrations/pwn/hibp";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  providerError,
  validationError,
} from "../_lib/http";
import { checkRateLimit, searchLimit } from "../_lib/rate-limit";
import { ensureSource, safeDate, writeAudit } from "../_lib/persistence";
import { openAlert } from "../_lib/alerts";
import { sameEmail } from "../_lib/verification";

const HIBP_RELIABILITY = 90;

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("email"), query: z.string().trim().email().max(254) }).strict(),
  z
    .object({
      type: z.literal("domain"),
      query: z
        .string()
        .trim()
        .min(1)
        .max(253)
        .regex(/^(?=.{1,253}\.?$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i),
    })
    .strict(),
]);

type VerificationStatus = "DISPUTED" | "CORROBORATED" | "UNVERIFIED";

function normalized(type: "email" | "domain", query: string): string {
  const value = query.toLowerCase();
  return type === "domain" ? value.replace(/\.$/, "") : value;
}

function verificationOf(breach: HibpBreach): VerificationStatus {
  if (breach.isFabricated) return "DISPUTED";
  return breach.isVerified ? "CORROBORATED" : "UNVERIFIED";
}

/**
 * Callers without proof of ownership get only `exposed: boolean`, computed from
 * non-sensitive, non-retired, non-fabricated breaches, and nothing is stored.
 * Breach details are returned only for the caller's own account email or an
 * owned, verified monitoring target; only the latter is persisted.
 */
export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  const sessionUser = await getPwnSessionUser();
  const limited = await checkRateLimit(request, {
    route: "exposure-search",
    ...searchLimit(sessionUser?.id),
  });
  if (limited) return limited;

  let auditTargetType: "EMAIL" | "DOMAIN" | undefined;
  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());

    if (!hibpConnector.isConfigured()) {
      return NextResponse.json({ success: true, configured: false });
    }

    const subject = normalized(parsed.data.type, parsed.data.query);
    const targetType = parsed.data.type.toUpperCase() as "EMAIL" | "DOMAIN";
    auditTargetType = sessionUser ? targetType : undefined;

    let verifiedTarget: { id: string; targetHash: string } | null = null;
    if (sessionUser) {
      verifiedTarget = await prisma.pwnMonitoringTarget.findFirst({
        where: {
          userId: sessionUser.id,
          targetType,
          targetHash: hashSubject(subject),
          active: true,
          verifiedAt: { not: null },
        },
        select: { id: true, targetHash: true },
      });
    }
    const isAccountEmail = targetType === "EMAIL" && sameEmail(subject, sessionUser?.email);
    const fullAccess = Boolean(verifiedTarget) || isAccountEmail;

    if (targetType === "DOMAIN" && !verifiedTarget) {
      if (!sessionUser) {
        return NextResponse.json(
          { success: false, error: "Autenticación requerida para consultar dominios" },
          { status: 401 },
        );
      }
      await writeAudit({
        actorId: sessionUser.id,
        action: "EXPOSURE_SEARCH_DENIED",
        targetType: "DOMAIN",
        metadata: { provider: "HIBP", resultCategory: "DENIED" },
      });
      return NextResponse.json(
        {
          success: false,
          error: "El dominio debe ser un objetivo de monitoreo verificado",
        },
        { status: 403 },
      );
    }

    const result = await hibpConnector.search({ type: parsed.data.type, account: subject });
    if (!result.configured) {
      return NextResponse.json({ success: true, configured: false });
    }

    const visible = fullAccess
      ? result.data
      : result.data.filter((breach) => !breach.isSensitive && !breach.isRetired);
    const exposed = visible.some((breach) => !breach.isFabricated);

    if (!fullAccess) {
      if (sessionUser) {
        await writeAudit({
          actorId: sessionUser.id,
          action: "EXPOSURE_SEARCH",
          targetType,
          metadata: { provider: "HIBP", scope: "boolean" },
        });
      }
      return NextResponse.json({ success: true, configured: true, scope: "boolean", exposed });
    }

    const subjectHint = targetType === "EMAIL" ? redactEmail(subject) : redactSubject(subject);
    const source = verifiedTarget
      ? await ensureSource({
          name: "HIBP",
          sourceType: "BREACH_API",
          historicalReliability: HIBP_RELIABILITY,
          verificationMethod: "API oficial de HIBP",
        })
      : null;
    const reliability = source?.historicalReliability ?? HIBP_RELIABILITY;
    const data = [];

    for (const breach of visible) {
      const verificationStatus = verificationOf(breach);
      const confidence = scoreConfidence({
        sourceReliability: reliability,
        verificationStatus,
        corroboratingSources: 0,
      });
      const risk =
        verificationStatus === "DISPUTED"
          ? null
          : scoreRisk({
              severity: "MEDIUM",
              confidence: confidence.score,
              exposureKind: targetType,
            });

      let breachId: string | null = null;
      let exposureId: string | null = null;
      if (verifiedTarget && source) {
        const breachValues = {
          description: breach.description ?? breach.title,
          publishedAt: safeDate(breach.addedDate),
          firstSeenAt: safeDate(breach.breachDate),
          lastSeenAt: safeDate(breach.modifiedDate) ?? new Date(),
          sourceUrl: breach.sourceUrl,
          verificationStatus,
          confidenceScore: confidence.score,
          claimedRecordCount: breach.pwnCount,
          dataTypes: breach.dataClasses,
          severity: risk?.level ?? "INFO",
        };
        const existingBreach = await prisma.pwnBreach.findFirst({
          where: { name: breach.name, sourceId: source.id },
          select: { id: true },
        });
        const breachRecord = existingBreach
          ? await prisma.pwnBreach.update({
              where: { id: existingBreach.id },
              data: breachValues,
            })
          : await prisma.pwnBreach.create({
              data: {
                ...breachValues,
                name: breach.name,
                discoveredAt: safeDate(breach.addedDate),
                sourceId: source.id,
              },
            });
        breachId = breachRecord.id;

        const existingExposure = await prisma.pwnExposure.findFirst({
          where: {
            subjectHash: verifiedTarget.targetHash,
            breachId: breachRecord.id,
            sourceId: source.id,
          },
          select: { id: true },
        });
        const exposureData = {
          kind: targetType,
          subjectHint,
          confidenceScore: confidence.score,
          verificationStatus,
          riskScore: risk?.score ?? null,
          lastSeenAt: new Date(),
        };
        const exposure = existingExposure
          ? await prisma.pwnExposure.update({
              where: { id: existingExposure.id },
              data: exposureData,
            })
          : await prisma.pwnExposure.create({
              data: {
                ...exposureData,
                subjectHash: verifiedTarget.targetHash,
                breachId: breachRecord.id,
                sourceId: source.id,
                firstSeenAt: new Date(),
              },
            });
        exposureId = exposure.id;
        if (verificationStatus !== "DISPUTED" && sessionUser) {
          await openAlert({
            userId: sessionUser.id,
            targetId: verifiedTarget.id,
            sourceId: source.id,
            kind: "BREACH",
            targetDisplay: subjectHint,
            breachName: breach.name,
            severity: risk?.level ?? "MEDIUM",
            verificationStatus,
            dataTypes: breach.dataClasses,
            sourceName: "HIBP",
          });
        }
      }

      data.push({
        id: exposureId,
        subjectHint,
        breach: {
          id: breachId,
          name: breach.name,
          title: breach.title,
          source: "HIBP",
          sourceUrl: breach.sourceUrl,
          dataTypes: breach.dataClasses,
          firstSeenAt: safeDate(breach.breachDate),
          isSensitive: breach.isSensitive,
          isRetired: breach.isRetired,
          verificationStatus,
          confidenceScore: confidence.score,
          riskScore: risk?.score ?? null,
        },
      });
    }

    await writeAudit({
      actorId: sessionUser?.id,
      action: "EXPOSURE_SEARCH",
      targetType,
      targetId: verifiedTarget?.id ?? null,
      metadata: {
        provider: "HIBP",
        scope: "full",
        persisted: Boolean(verifiedTarget),
        resultCategory: data.length ? "MATCH" : "NO_MATCH",
        resultCount: data.length,
      },
    });
    return NextResponse.json({
      success: true,
      configured: true,
      scope: "full",
      exposed,
      persisted: Boolean(verifiedTarget),
      data,
    });
  } catch (error) {
    if (sessionUser && auditTargetType) {
      await writeAudit({
        actorId: sessionUser.id,
        action: "EXPOSURE_SEARCH",
        targetType: auditTargetType,
        metadata: { provider: "HIBP", resultCategory: "ERROR" },
      }).catch(() => undefined);
    }
    const upstream = providerError(error);
    return upstream ?? internalError("exposure search", error);
  }
}
// creado por pato dev y askforvini
