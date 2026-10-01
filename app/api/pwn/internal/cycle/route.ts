import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disabledResponse, internalError, isCronAuthorized } from "../../_lib/http";
import { ensureSource } from "../../_lib/persistence";
import { runDomainCycle, syncHibpCatalog, syncKevCatalog } from "../../_lib/cycle";
import { syncForumFeeds } from "../../_lib/forum-sync";

export const maxDuration = 60;

// Comparación en tiempo constante del CRON_SECRET (ver _lib/http).
const authorized = isCronAuthorized;

async function runCycle() {
  const source = await ensureSource({
    name: "HIBP",
    sourceType: "BREACH_API",
    historicalReliability: 90,
    verificationMethod: "Catálogo y API HIBP",
  });
  const job = await prisma.pwnIngestionJob.create({
    data: { sourceId: source.id, status: "RUNNING" },
  });
  try {
    const catalog = await syncHibpCatalog().catch(() => ({ configured: false, upserted: 0 }));
    const domains = await runDomainCycle();
    // KEV caído o con JSON roto no debe marcar todo el ciclo como FAILED.
    const kev = await syncKevCatalog().catch(() => ({ configured: false, upserted: 0 }));
    const forums = await syncForumFeeds().catch(() => ({
      configured: false,
      fetched: 0,
      upserted: 0,
      created: 0,
      sources: [] as string[],
      error: true as const,
    }));
    await prisma.pwnIngestionJob.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
    return { jobId: job.id, data: { catalog, domains, kev, forums } };
  } catch (error) {
    await prisma.pwnIngestionJob
      .update({
        where: { id: job.id },
        data: { status: "FAILED", finishedAt: new Date(), error: "Error de ciclo" },
      })
      .catch(() => undefined);
    throw error;
  }
}

/** Vercel Cron uses GET. Manual/ops calls use POST. Same secret. */
export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await runCycle();
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return internalError("pwn cycle", error);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
