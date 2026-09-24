import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { scoreConfidence } from "@/lib/pwn/confidence-engine";
import { scoreRisk } from "@/lib/pwn/risk-engine";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  unauthorized,
  validationError,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";

const querySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "reports-build",
    capacity: 10,
    refillPerMinute: 10,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = querySchema.safeParse({
      organizationId: request.nextUrl.searchParams.get("organizationId") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error.flatten());
    const organizationId = parsed.data.organizationId;
    if (organizationId) {
      const organization = await prisma.pwnOrganization.findFirst({
        where: { id: organizationId, ownerUserId: user.id },
        select: { id: true },
      });
      if (!organization) {
        return NextResponse.json(
          { success: false, error: "Organización no encontrada" },
          { status: 404 },
        );
      }
    }

    const targets = await prisma.pwnMonitoringTarget.findMany({
      where: {
        userId: user.id,
        active: true,
        verifiedAt: { not: null },
        ...(organizationId ? { organizationId } : {}),
      },
      select: { id: true, targetHash: true },
    });
    const targetHashes = targets.map((target) => target.targetHash);
    const targetIds = targets.map((target) => target.id);
    const [exposures, alerts] = await Promise.all([
      targetHashes.length
        ? prisma.pwnExposure.findMany({
            where: { subjectHash: { in: targetHashes } },
            include: {
              source: { select: { historicalReliability: true } },
              breach: { select: { severity: true } },
            },
          })
        : [],
      prisma.pwnAlert.findMany({
        where: {
          userId: user.id,
          ...(organizationId
            ? { targetId: { in: targetIds } }
            : { OR: [{ targetId: null }, { targetId: { in: targetIds } }] }),
        },
        select: { severity: true, readAt: true, status: true },
      }),
    ]);

    const assessments = exposures
      .filter((exposure) => exposure.verificationStatus !== "DISPUTED")
      .map((exposure) => {
        const confidence = scoreConfidence({
          sourceReliability: exposure.source?.historicalReliability ?? 0,
          verificationStatus: exposure.verificationStatus,
          corroboratingSources: 0,
        });
        const risk = scoreRisk({
          severity: exposure.breach?.severity ?? "MEDIUM",
          confidence: confidence.score,
          exposureKind: exposure.kind,
        });
        return { confidence, risk };
      });
    const averageConfidence = assessments.length
      ? Math.round(
          assessments.reduce((sum, item) => sum + item.confidence.score, 0) /
            assessments.length,
        )
      : 0;
    let highestRisk: {
      score: number;
      level: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    } = { score: 0, level: "INFO" };
    for (const assessment of assessments) {
      if (assessment.risk.score > highestRisk.score) highestRisk = assessment.risk;
    }
    const unreadAlerts = alerts.filter((alert) => !alert.readAt).length;
    const summary =
      `Se analizaron ${targets.length} objetivo(s) de monitoreo. ` +
      `Hay ${exposures.length} exposición(es) almacenada(s) y ${alerts.length} alerta(s), ` +
      `${unreadAlerts} sin leer. La confianza promedio es ${averageConfidence}/100 ` +
      `y el riesgo máximo calculado es ${highestRisk.level} (${highestRisk.score}/100).`;

    const report = await prisma.pwnReport.create({
      data: {
        userId: user.id,
        organizationId,
        title: `Informe de seguridad - ${new Date().toISOString().slice(0, 10)}`,
        summary,
        createdByEngine: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        title: report.title,
        summary: report.summary,
        createdAt: report.createdAt,
        metrics: {
          monitoringTargets: targets.length,
          exposures: exposures.length,
          alerts: alerts.length,
          unreadAlerts,
          averageConfidence,
          highestRisk,
        },
      },
    });
  } catch (error) {
    return internalError("report build", error);
  }
}
