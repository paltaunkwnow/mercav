import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nvdConnector } from "@/lib/integrations/pwn";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  unauthorized,
  validationError,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { ensureSource, safeDate, severityFromCvss } from "../_lib/persistence";

const querySchema = z.object({
  cve: z.string().trim().toUpperCase().regex(/^CVE-\d{4}-\d{4,}$/),
});

function payloadOf(data: {
  id: string;
  cveId: string;
  description: string;
  cvssScore: number | null;
  severity: string;
  kev: boolean;
  sourceUrl: string | null;
  publishedAt: Date | null;
  references: unknown;
  source: { name: string; sourceType: string } | null;
}) {
  return {
    ...data,
    knownExploitedVulnerability: data.kev,
    attribution:
      data.source && data.sourceUrl ? [{ source: data.source.name, url: data.sourceUrl }] : [],
  };
}

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "vulnerability-search",
    capacity: 30,
    refillPerMinute: 30,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = querySchema.safeParse({
      cve: request.nextUrl.searchParams.get("cve"),
    });
    if (!parsed.success) return validationError(parsed.error.flatten());
    const cve = parsed.data.cve;

    const existing = await prisma.pwnVulnerability.findUnique({
      where: { cveId: cve },
      include: { source: { select: { name: true, sourceType: true } } },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        configured: true,
        found: true,
        data: payloadOf(existing),
      });
    }

    const nvdResult = await nvdConnector.search({ cveId: cve });
    if (!nvdResult.configured) {
      return NextResponse.json({ success: true, configured: false, found: false, data: null });
    }
    const nvd = nvdResult.data[0] ?? null;
    if (!nvd) {
      return NextResponse.json({ success: true, configured: true, found: false, data: null });
    }

    const source = await ensureSource({
      name: "NVD",
      sourceType: "VULNERABILITY_DB",
      historicalReliability: 95,
      verificationMethod: "API oficial de NVD",
    });
    const references = [...nvd.references, nvd.sourceUrl].filter(
      (value, index, all) => all.indexOf(value) === index,
    );

    const record = await prisma.pwnVulnerability.upsert({
      where: { cveId: cve },
      update: {
        description: nvd.description ?? cve,
        cvssScore: nvd.cvssScore ?? null,
        severity: severityFromCvss(nvd.cvssScore ?? null),
        sourceId: source.id,
        sourceUrl: nvd.sourceUrl,
        publishedAt: safeDate(nvd.publishedAt),
        references,
      },
      create: {
        cveId: cve,
        description: nvd.description ?? cve,
        cvssScore: nvd.cvssScore ?? null,
        severity: severityFromCvss(nvd.cvssScore ?? null),
        kev: false,
        sourceId: source.id,
        sourceUrl: nvd.sourceUrl,
        publishedAt: safeDate(nvd.publishedAt),
        references,
      },
      include: { source: { select: { name: true, sourceType: true } } },
    });

    return NextResponse.json({
      success: true,
      configured: true,
      found: true,
      data: payloadOf(record),
    });
  } catch (error) {
    return internalError("vulnerability lookup", error);
  }
}
