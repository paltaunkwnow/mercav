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
import { writeAudit } from "../_lib/persistence";
import { PROVEN_TARGET_WHERE } from "../_lib/targets";

const querySchema = z
  .object({
    organizationId: z.string().uuid().optional(),
  })
  .strict();

const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/** Historial de informes. Leer nunca crea uno. */
export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "reports-read",
    capacity: 60,
    refillPerMinute: 60,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = historyQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const { page, limit } = parsed.data;
    const where = { userId: user.id };
    const [rows, total] = await Promise.all([
      prisma.pwnReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          summary: true,
          createdAt: true,
          organization: { select: { id: true, name: true } },
        },
      }),
      prisma.pwnReport.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return internalError("report history", error);
  }
}

/** Genera y guarda un informe con el estado actual de los objetivos verificados. */
export async function POST(request: NextRequest) {
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
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = querySchema.safeParse(body ?? {});
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
        ...PROVEN_TARGET_WHERE,
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

    await writeAudit({
      actorId: user.id,
      action: "REPORT_CREATED",
      targetType: "REPORT",
      targetId: report.id,
      metadata: { organizationId: organizationId ?? null },
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
// creado por pato dev y askforvini
