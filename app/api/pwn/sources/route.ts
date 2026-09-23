import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cisaKevConnector, hibpConnector, nvdConnector } from "@/lib/integrations/pwn";
import {
  disabledResponse,
  forbidden,
  getPwnSessionUser,
  internalError,
  isAdmin,
  unauthorized,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const limited = await checkRateLimit(request, {
    route: "admin-sources",
    capacity: 20,
    refillPerMinute: 20,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const catalog = [
      { name: "HIBP", configured: hibpConnector.isConfigured() },
      { name: "NVD", configured: nvdConnector.isConfigured() },
      { name: "CISA_KEV", configured: cisaKevConnector.isConfigured() },
    ];
    const sources = await prisma.pwnSource.findMany({
      where: { name: { in: catalog.map((item) => item.name) } },
      select: {
        id: true,
        name: true,
        sourceType: true,
        historicalReliability: true,
        verificationMethod: true,
        lastEvaluatedAt: true,
        enabled: true,
        updatedAt: true,
      },
    });
    const data = await Promise.all(
      catalog.map(async (item) => {
        const source = sources.find((candidate) => candidate.name === item.name);
        const lastJob = source
          ? await prisma.pwnIngestionJob.findFirst({
              where: { sourceId: source.id },
              orderBy: { startedAt: "desc" },
              select: {
                id: true,
                status: true,
                startedAt: true,
                finishedAt: true,
                error: true,
              },
            })
          : null;
        return {
          name: item.name,
          configured: item.configured,
          status: !item.configured
            ? "NOT_CONFIGURED"
            : lastJob?.status === "FAILED"
              ? "DEGRADED"
              : "AVAILABLE",
          source: source ?? null,
          lastIngestionJob: lastJob,
        };
      }),
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return internalError("source health", error);
  }
}
