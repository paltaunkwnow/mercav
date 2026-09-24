import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disabledResponse, internalError } from "../../_lib/http";
import { ensureSource } from "../../_lib/persistence";
import { runDomainCycle, syncKevCatalog } from "../../_lib/cycle";
import { syncForumFeeds } from "../../_lib/forum-sync";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

/** Scheduled re-check of verified domains. Emails are never stored, so they are not scanned here. */
export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  let jobId: string | null = null;
  try {
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
    const domains = await runDomainCycle();
    const kev = await syncKevCatalog();
    const forums = await syncForumFeeds().catch(() => ({
      configured: false,
      fetched: 0,
      upserted: 0,
      sources: [] as string[],
      error: true as const,
    }));
    await prisma.pwnIngestionJob.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: { domains, kev, forums } });
  } catch (error) {
    if (jobId) {
      await prisma.pwnIngestionJob
        .update({
          where: { id: jobId },
          data: { status: "FAILED", finishedAt: new Date(), error: "Error de ciclo" },
        })
        .catch(() => undefined);
    }
    return internalError("pwn cycle", error);
  }
}
