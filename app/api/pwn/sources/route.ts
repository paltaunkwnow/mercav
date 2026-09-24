import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cisaKevConnector, hibpConnector, nvdConnector } from "@/lib/integrations/pwn";
import {
  disabledResponse,
  forbidden,
  getPwnSessionUser,
  internalError,
  isAdmin,
  unauthorized,
  validationError,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { PWN_FEED_SOURCES, PWN_FEED_SOURCE_NAMES } from "@/lib/integrations/pwn/feed-catalog";
import { writeAudit } from "../_lib/persistence";

const patchSchema = z.object({
  name: z.string().min(2).max(80),
  enabled: z.boolean(),
});

async function lastJobForSource(sourceId: string | undefined) {
  if (!sourceId) return null;
  return prisma.pwnIngestionJob.findFirst({
    where: { sourceId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      error: true,
    },
  });
}

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
      { name: "HIBP", configured: hibpConnector.isConfigured(), group: "api" as const },
      { name: "NVD", configured: nvdConnector.isConfigured(), group: "api" as const },
      { name: "CISA_KEV", configured: cisaKevConnector.isConfigured(), group: "api" as const },
      ...PWN_FEED_SOURCE_NAMES.map((name) => ({ name, configured: true, group: "feed" as const })),
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
        const lastJob = await lastJobForSource(source?.id);
        return {
          name: item.name,
          group: item.group,
          configured: item.configured,
          status: !item.configured
            ? "NOT_CONFIGURED"
            : source?.enabled === false
              ? "DISABLED"
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

export async function PATCH(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const limited = await checkRateLimit(request, {
    route: "admin-sources-patch",
    capacity: 30,
    refillPerMinute: 30,
    userId: user.id,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError();
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.flatten());

  const allowed = [...PWN_FEED_SOURCE_NAMES, "HIBP", "NVD", "CISA_KEV"];
  if (!allowed.includes(parsed.data.name)) {
    return validationError({ name: "Fuente no editable" });
  }

  const feedFromCatalog = PWN_FEED_SOURCES.find((s) => s.name === parsed.data.name);
  const apiDefaults: Record<string, { sourceType: string; reliability: number; method: string }> = {
    HIBP: { sourceType: "BREACH_API", reliability: 90, method: "API HIBP" },
    NVD: { sourceType: "VULN_API", reliability: 85, method: "API NVD" },
    CISA_KEV: { sourceType: "VULN_CATALOG", reliability: 95, method: "Catálogo CISA KEV" },
  };

  try {
    const meta = feedFromCatalog
      ? { sourceType: feedFromCatalog.sourceType, reliability: feedFromCatalog.reliability, method: feedFromCatalog.method }
      : (apiDefaults[parsed.data.name] ?? {
          sourceType: "FORUM_SCRAPE",
          reliability: 40,
          method: "Conector Pwn",
        });
    const updated = await prisma.pwnSource.upsert({
      where: { name: parsed.data.name },
      update: { enabled: parsed.data.enabled },
      create: {
        name: parsed.data.name,
        sourceType: meta.sourceType,
        historicalReliability: meta.reliability,
        verificationMethod: meta.method,
        enabled: parsed.data.enabled,
      },
      select: { id: true, name: true, enabled: true },
    });
    await writeAudit({
      actorId: user.id,
      action: "PWN_SOURCE_TOGGLED",
      targetType: "PwnSource",
      targetId: updated.id,
      metadata: { enabled: updated.enabled },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Fuente no encontrada" }, { status: 404 });
  }
}
