import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  unauthorized,
  validationError,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";

const querySchema = z.object({
  cve: z.string().trim().toUpperCase().regex(/^CVE-\d{4}-\d{4,}$/),
});

// Read-only: records are written exclusively by the admin ingest route.
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

    const data = await prisma.pwnVulnerability.findUnique({
      where: { cveId: parsed.data.cve },
      include: { source: { select: { name: true, sourceType: true } } },
    });
    if (!data) {
      return NextResponse.json({ success: true, configured: true, found: false, data: null });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      found: true,
      data: {
        ...data,
        knownExploitedVulnerability: data.kev,
        attribution:
          data.source && data.sourceUrl
            ? [{ source: data.source.name, url: data.sourceUrl }]
            : [],
      },
    });
  } catch (error) {
    return internalError("vulnerability lookup", error);
  }
}
// creado por Patodev y Invertilo
