import { Resolver } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSubject } from "@/lib/pwn/redaction";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  unauthorized,
  validationError,
} from "../../_lib/http";
import { checkRateLimit } from "../../_lib/rate-limit";
import { writeAudit } from "../../_lib/persistence";
import { txtRecordMatches } from "../../_lib/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    targetId: z.string().uuid(),
    domain: z
      .string()
      .trim()
      .min(1)
      .max(253)
      .regex(/^(?=.{1,253}\.?$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i),
  })
  .strict();

const NOT_FOUND_CODES = new Set(["ENOTFOUND", "ENODATA"]);

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-verify",
    capacity: 10,
    refillPerMinute: 10,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const domain = parsed.data.domain.toLowerCase().replace(/\.$/, "");

    const target = await prisma.pwnMonitoringTarget.findFirst({
      where: { id: parsed.data.targetId, userId: user.id, active: true },
      select: {
        id: true,
        targetType: true,
        targetHash: true,
        verifiedAt: true,
        verificationTokenHash: true,
      },
    });
    if (!target || target.targetType !== "DOMAIN" || target.targetHash !== hashSubject(domain)) {
      return NextResponse.json(
        { success: false, error: "Objetivo de dominio no encontrado" },
        { status: 404 },
      );
    }
    if (target.verifiedAt) {
      return NextResponse.json({
        success: true,
        data: { id: target.id, verificationStatus: "VERIFIED", verifiedAt: target.verifiedAt },
      });
    }
    if (!target.verificationTokenHash) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay un token de verificación activo. Vuelve a registrar el dominio.",
        },
        { status: 409 },
      );
    }

    const resolver = new Resolver({ timeout: 5_000, tries: 2 });
    let records: string[];
    try {
      records = (await resolver.resolveTxt(domain)).map((chunks) => chunks.join(""));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code && NOT_FOUND_CODES.has(code)) records = [];
      else {
        console.error("Pwn DNS TXT lookup failed", code);
        return NextResponse.json(
          { success: false, error: "No se pudo consultar el DNS. Intenta de nuevo más tarde." },
          { status: 502 },
        );
      }
    }

    const tokenHash = target.verificationTokenHash;
    const matched = records.some((record) => txtRecordMatches(record, tokenHash));
    await writeAudit({
      actorId: user.id,
      action: matched ? "MONITORING_TARGET_VERIFIED" : "MONITORING_TARGET_VERIFY_FAILED",
      targetType: "DOMAIN",
      targetId: target.id,
      metadata: { method: "DNS_TXT" },
    });
    if (!matched) {
      return NextResponse.json(
        {
          success: false,
          error: "No se encontró el registro TXT de verificación en el dominio.",
        },
        { status: 422 },
      );
    }

    const updated = await prisma.pwnMonitoringTarget.update({
      where: { id: target.id },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        verificationTokenHash: null,
      },
      select: { id: true, verificationStatus: true, verifiedAt: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return internalError("monitoring verify", error);
  }
}
