import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redactEmail, hashSubject } from "@/lib/pwn/redaction";
import { scoreConfidence } from "@/lib/pwn/confidence-engine";
import { scoreRisk } from "@/lib/pwn/risk-engine";
import {
  hibpConnector,
  searchDomainBreaches,
  type DomainBreachMode,
  type HibpBreach,
} from "@/lib/integrations/pwn/hibp";
import { exposureView, type ExposureAccess } from "@/lib/pwn/exposure-visibility";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  providerError,
  validationError,
} from "../_lib/http";
import { checkRateLimits, exposureLimits } from "../_lib/rate-limit";
import { PROVEN_TARGET_WHERE } from "../_lib/targets";
import { ensureSource, safeDate, writeAudit } from "../_lib/persistence";
import { openAlert } from "../_lib/alerts";

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

async function enrichDomainBreaches(stubs: HibpBreach[]): Promise<HibpBreach[]> {
  if (!stubs.length) return stubs;
  const names = stubs.map((item) => item.name);
  const rows = await prisma.pwnBreach.findMany({
    where: { name: { in: names } },
    orderBy: { updatedAt: "desc" },
    select: {
      name: true,
      description: true,
      publishedAt: true,
      firstSeenAt: true,
      lastSeenAt: true,
      sourceUrl: true,
      dataTypes: true,
      claimedRecordCount: true,
      verificationStatus: true,
    },
  });
  const byName = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!byName.has(row.name)) byName.set(row.name, row);
  }
  return stubs.map((stub) => {
    const row = byName.get(stub.name);
    if (!row) return stub;
    const verified = row.verificationStatus === "CONFIRMED" || row.verificationStatus === "CORROBORATED";
    return {
      ...stub,
      title: stub.title || stub.name,
      description: row.description || stub.description,
      breachDate: row.firstSeenAt?.toISOString() ?? stub.breachDate,
      addedDate: row.publishedAt?.toISOString() ?? stub.addedDate,
      modifiedDate: row.lastSeenAt?.toISOString() ?? stub.modifiedDate,
      pwnCount: row.claimedRecordCount ?? stub.pwnCount,
      dataClasses: row.dataTypes.length ? row.dataTypes : stub.dataClasses,
      isVerified: verified || stub.isVerified,
      sourceUrl: row.sourceUrl ?? stub.sourceUrl,
    };
  });
}

/**
 * Cualquiera puede preguntar, pero no todos ven lo mismo (lib/pwn/exposure-visibility):
 * - correo ajeno, sin sesión o sin verificar: solo sí/no y cuántas filtraciones no sensibles;
 * - dominio ajeno: el catálogo público de HIBP (filtraciones del servicio), sin las sensibles;
 * - objetivo propio verificado: el detalle completo, también lo sensible, y se guarda para alertas.
 */
export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  const sessionUser = await getPwnSessionUser();
  let auditTargetType: "EMAIL" | "DOMAIN" | undefined;
  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const limited = await checkRateLimits(request, exposureLimits(sessionUser?.id, false).slice(0, 1));
      return limited ?? validationError(parsed.error.flatten());
    }

    const subject = normalized(parsed.data.type, parsed.data.query);
    const targetType = parsed.data.type.toUpperCase() as "EMAIL" | "DOMAIN";
    auditTargetType = sessionUser ? targetType : undefined;

    const ownedTarget = sessionUser
      ? await prisma.pwnMonitoringTarget.findFirst({
          where: {
            userId: sessionUser.id,
            targetType,
            targetHash: hashSubject(subject),
            ...PROVEN_TARGET_WHERE,
          },
          select: { id: true, targetHash: true, active: true },
        })
      : null;

    const usesHibpKey = targetType === "EMAIL" || (Boolean(ownedTarget) && hibpConnector.isConfigured());
    const limited = await checkRateLimits(request, exposureLimits(sessionUser?.id, usesHibpKey));
    if (limited) return limited;

    let findings: HibpBreach[];
    let domainMode: DomainBreachMode | null = null;
    if (parsed.data.type === "email") {
      const result = await hibpConnector.search({ type: "email", account: subject });
      if (!result.configured) {
        return NextResponse.json(
          {
            success: false,
            error:
              "La consulta por correo necesita la integración HIBP. Un dominio sí se puede consultar con el catálogo público.",
          },
          { status: 400 },
        );
      }
      findings = result.data;
    } else {
      const result = await searchDomainBreaches(subject, { owned: Boolean(ownedTarget) });
      if (!result.configured) return NextResponse.json({ success: true, configured: false });
      domainMode = result.data.mode;
      findings = domainMode === "accounts" ? await enrichDomainBreaches(result.data.data) : result.data.data;
    }

    const access: ExposureAccess = ownedTarget ? "owner" : targetType === "DOMAIN" ? "catalog" : "summary";
    const view = exposureView(findings, access);
    // Solo un objetivo propio, verificado y activo guarda resultados y abre alertas.
    const verifiedTarget = ownedTarget?.active ? ownedTarget : null;

    const subjectHint = targetType === "EMAIL" ? redactEmail(subject) : subject;
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

    for (const breach of view.items) {
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
          // Prisma Int es int32: recortamos igual que en cycle.ts para no romper el upsert.
          claimedRecordCount:
            breach.pwnCount == null ? null : Math.min(Math.max(0, breach.pwnCount), 2_147_483_647),
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
          description: breach.description,
          source: "HIBP",
          sourceUrl: breach.sourceUrl,
          dataTypes: breach.dataClasses,
          claimedRecordCount: breach.pwnCount,
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
        scope: access,
        domainMode,
        persisted: Boolean(verifiedTarget),
        resultCategory: view.exposed ? "MATCH" : "NO_MATCH",
        resultCount: view.count,
      },
    });
    return NextResponse.json({
      success: true,
      configured: true,
      scope: view.scope,
      access,
      domainMode,
      exposed: view.exposed,
      count: view.count,
      hiddenSensitive: view.hiddenSensitive,
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
