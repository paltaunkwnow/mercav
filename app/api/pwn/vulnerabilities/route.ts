import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nvdConnector } from "@/lib/integrations/pwn";
import { kevEntryFor } from "@/lib/integrations/pwn/cisa-kev";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  providerError,
  unauthorized,
  validationError,
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { ensureSource, safeDate, severityFromCvss } from "../_lib/persistence";

const STALE_MS = 24 * 60 * 60 * 1000;

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

    const include = { source: { select: { name: true, sourceType: true } } } as const;
    const existing = await prisma.pwnVulnerability.findUnique({ where: { cveId: cve }, include });
    const found = (row: NonNullable<typeof existing>, stale = false) =>
      NextResponse.json({ success: true, configured: true, found: true, stale, data: payloadOf(row) });

    // Un CVE guardado hace menos de 24 h se sirve tal cual; si no, se refresca NVD y KEV.
    if (existing && Date.now() - existing.updatedAt.getTime() < STALE_MS) return found(existing);

    let nvdResult: Awaited<ReturnType<typeof nvdConnector.search>>;
    try {
      nvdResult = await nvdConnector.search({ cveId: cve });
    } catch (error) {
      // NVD caído o limitando: mejor el dato viejo (marcado) que un error.
      if (existing) return found(existing, true);
      throw error;
    }
    const kevEntry = await kevEntryFor(cve);
    const kev = kevEntry === "unknown" ? (existing?.kev ?? false) : Boolean(kevEntry);
    const nvd = nvdResult.configured ? (nvdResult.data[0] ?? null) : null;

    if (!nvd) {
      if (existing) {
        const touched = await prisma.pwnVulnerability.update({ where: { cveId: cve }, data: { kev }, include });
        return found(touched);
      }
      if (kevEntry && kevEntry !== "unknown") {
        // Figura en KEV aunque NVD no responda o no lo tenga: lo guardamos con lo que dice CISA.
        const kevSource = await ensureSource({
          name: "CISA_KEV",
          sourceType: "VULNERABILITY_FEED",
          historicalReliability: 95,
          verificationMethod: "Catálogo oficial CISA KEV",
        });
        const created = await prisma.pwnVulnerability.create({
          data: {
            cveId: cve,
            description: kevEntry.shortDescription ?? kevEntry.vulnerabilityName ?? cve,
            severity: kevEntry.knownRansomwareCampaignUse === "Known" ? "CRITICAL" : "HIGH",
            kev: true,
            sourceId: kevSource.id,
            sourceUrl: kevEntry.sourceUrl,
            publishedAt: safeDate(kevEntry.dateAdded),
          },
          include,
        });
        return found(created);
      }
      if (!nvdResult.configured) {
        return NextResponse.json({ success: true, configured: false, found: false, data: null });
      }
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
    const values = {
      description: nvd.description ?? cve,
      cvssScore: nvd.cvssScore ?? null,
      severity: severityFromCvss(nvd.cvssScore ?? null),
      kev,
      sourceId: source.id,
      sourceUrl: nvd.sourceUrl,
      publishedAt: safeDate(nvd.publishedAt),
      references,
    };
    const record = await prisma.pwnVulnerability.upsert({
      where: { cveId: cve },
      update: values,
      create: { cveId: cve, ...values },
      include,
    });
    return found(record);
  } catch (error) {
    // Fallas/límites de NVD → 502/429 en vez de 500 genérico.
    return providerError(error) ?? internalError("vulnerability lookup", error);
  }
}
