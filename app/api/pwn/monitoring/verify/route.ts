import { promises as dns } from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSubject } from "@/lib/pwn/redaction";
import { disabledResponse, getPwnSessionUser, internalError, unauthorized, validationError } from "../../_lib/http";
import { checkRateLimit } from "../../_lib/rate-limit";
import { writeAudit } from "../../_lib/persistence";
import { DNS_TXT_PREFIX, anyTxtRecordMatches, generateVerificationToken } from "../../_lib/verification";
import { isProvenTarget, presentTarget, targetSelect } from "../../_lib/targets";
import { mailerReady } from "../../_lib/mailer";

const requestSchema = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["issue", "check"]),
  })
  .strict();

const DNS_TIMEOUT_MS = 5_000;

/** resolveTxt con tope de tiempo. Sin registros o sin dominio devuelve []. */
async function lookupTxt(domain: string): Promise<string[][]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      dns.resolveTxt(domain),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), DNS_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENODATA" || code === "ENOTFOUND" || code === "NXDOMAIN") return [];
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Verificación de dominio por DNS TXT.
 * - issue: genera un token nuevo (se guarda solo su hash) y devuelve `mercav-pwn=<token>` una única vez.
 * - check: consulta los TXT del dominio y, si alguno coincide con el hash, lo marca VERIFIED.
 */
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
    message: "Esperá un momento antes de volver a comprobar.",
  });
  if (limited) return limited;

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());

    const target = await prisma.pwnMonitoringTarget.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: targetSelect,
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "Objetivo no encontrado" }, { status: 404 });
    }
    if (target.targetType !== "DOMAIN" || !target.targetLookup) {
      return NextResponse.json(
        { success: false, error: "Los correos se confirman con el enlace que llega al buzón, no por DNS." },
        { status: 409 },
      );
    }
    const context = {
      accountEmailHash: user.email ? hashSubject(user.email.trim().toLowerCase()) : null,
      accountConfirmed: user.emailConfirmed,
      mailerReady: mailerReady(),
    };
    if (isProvenTarget(target)) {
      return NextResponse.json({ success: true, data: { ...presentTarget(target, context), verification: null } });
    }

    if (parsed.data.action === "issue") {
      const { token, tokenHash } = generateVerificationToken();
      const saved = await prisma.pwnMonitoringTarget.update({
        where: { id: target.id },
        data: { verificationStatus: "PENDING", verifiedAt: null, verifiedByUserId: null, verificationTokenHash: tokenHash },
        select: targetSelect,
      });
      await writeAudit({
        actorId: user.id,
        action: "MONITORING_DNS_TOKEN_ISSUED",
        targetType: "DOMAIN",
        targetId: target.id,
        metadata: {},
      });
      return NextResponse.json({
        success: true,
        data: {
          ...presentTarget(saved, context),
          verification: {
            method: "DNS_TXT",
            host: target.targetLookup,
            record: `${DNS_TXT_PREFIX}${token}`,
            message: "Registro nuevo: reemplazá el anterior si ya lo habías agregado. Se muestra una sola vez.",
          },
        },
      });
    }

    if (!target.verificationTokenHash) {
      return NextResponse.json(
        { success: false, error: "Todavía no hay un registro para comprobar. Generá uno primero." },
        { status: 409 },
      );
    }

    let records: string[][];
    try {
      records = await lookupTxt(target.targetLookup);
    } catch {
      return NextResponse.json(
        { success: false, error: "No pudimos consultar el DNS de ese dominio. Probá de nuevo en unos minutos." },
        { status: 502 },
      );
    }
    if (!anyTxtRecordMatches(records, target.verificationTokenHash)) {
      return NextResponse.json(
        {
          success: false,
          error: "Todavía no encontramos el registro TXT. Revisá que esté en la raíz del dominio; el DNS puede tardar hasta unas horas en propagarse.",
        },
        { status: 409 },
      );
    }

    // Condicionado al hash: si se emitió otro token entre la consulta y la escritura, no se marca.
    const verified = await prisma.pwnMonitoringTarget.updateMany({
      where: { id: target.id, userId: user.id, verificationTokenHash: target.verificationTokenHash },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date(), verifiedByUserId: user.id, verificationTokenHash: null },
    });
    if (verified.count === 0) {
      return NextResponse.json({ success: false, error: "El registro cambió mientras comprobábamos. Probá de nuevo." }, { status: 409 });
    }
    await writeAudit({
      actorId: user.id,
      action: "MONITORING_DNS_VERIFIED",
      targetType: "DOMAIN",
      targetId: target.id,
      metadata: {},
    });
    const saved = await prisma.pwnMonitoringTarget.findUniqueOrThrow({ where: { id: target.id }, select: targetSelect });
    return NextResponse.json({ success: true, data: { ...presentTarget(saved, context), verification: null } });
  } catch (error) {
    return internalError("monitoring dns verify", error);
  }
}
// creado por pato dev y askforvini
