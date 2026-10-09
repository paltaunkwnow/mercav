import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disabledResponse, getPwnSessionUser, internalError, unauthorized } from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { PROVEN_TARGET_WHERE, isProvenTarget } from "../_lib/targets";
import { kindFilterFromParam, mapSignalRow, signalSelect } from "../_lib/signal-view";

/**
 * Todo lo que necesita el resumen de /pwn en una sola llamada, y solo de la cuenta:
 * sus objetivos, sus exposiciones guardadas y sus alertas (no el catálogo entero de HIBP).
 */
export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "summary-read",
    capacity: 60,
    refillPerMinute: 60,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const targets = await prisma.pwnMonitoringTarget.findMany({
      where: { userId: user.id },
      select: { id: true, targetHash: true, active: true, verificationStatus: true, verifiedAt: true, verifiedByUserId: true },
    });
    const proven = targets.filter(isProvenTarget);
    const provenHashes = proven.map((target) => target.targetHash);
    const alertWhere = {
      userId: user.id,
      OR: [{ targetId: null }, { target: PROVEN_TARGET_WHERE }],
    };

    const [exposures, alertTotal, unreadAlerts, recentAlerts, signals, verifiedIntel] = await Promise.all([
      provenHashes.length
        ? prisma.pwnExposure.count({ where: { subjectHash: { in: provenHashes }, verificationStatus: { not: "DISPUTED" } } })
        : Promise.resolve(0),
      prisma.pwnAlert.count({ where: alertWhere }),
      prisma.pwnAlert.count({ where: { ...alertWhere, readAt: null } }),
      prisma.pwnAlert.findMany({
        where: alertWhere,
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          source: { select: { name: true, sourceType: true } },
          target: { select: { targetType: true, targetDisplay: true } },
        },
      }),
      prisma.pwnForumSignal.findMany({
        where: kindFilterFromParam("LEAKS"),
        orderBy: [{ priorityRank: "desc" }, { publishedAt: "desc" }, { lastSeenAt: "desc" }],
        take: 5,
        select: signalSelect,
      }),
      prisma.pwnBreach.findMany({
        where: { verificationStatus: { in: ["CONFIRMED", "CORROBORATED"] } },
        orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        take: 3,
        select: { id: true, name: true, sourceUrl: true, publishedAt: true, source: { select: { name: true } } },
      }),
    ]);

    const tone = unreadAlerts > 0 ? "exposed" : proven.length > 0 ? "clean" : "idle";
    return NextResponse.json({
      success: true,
      data: {
        verdict: { tone, unreadAlerts, provenTargets: proven.length },
        counts: {
          targets: targets.length,
          provenTargets: proven.length,
          activeProvenTargets: proven.filter((target) => target.active).length,
          pendingTargets: targets.length - proven.length,
          exposures,
          alerts: alertTotal,
          unreadAlerts,
        },
        recentAlerts,
        signals: signals.map(mapSignalRow),
        verifiedIntel: verifiedIntel.map((row) => ({
          id: row.id,
          name: row.name,
          sourceUrl: row.sourceUrl,
          publishedAt: row.publishedAt,
          source: row.source?.name ?? null,
        })),
      },
    });
  } catch (error) {
    return internalError("summary", error);
  }
}
// creado por pato dev y askforvini
