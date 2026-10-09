import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashMailboxToken, mailboxTokenUsable } from "@/lib/pwn/mailbox-token";
import { disabledResponse, getPwnSessionUser, internalError, unauthorized, validationError } from "../../_lib/http";
import { checkRateLimit } from "../../_lib/rate-limit";
import { writeAudit } from "../../_lib/persistence";

const requestSchema = z.object({ token: z.string().min(20).max(120) }).strict();

/**
 * Confirma un correo con el enlace que llegó a ese buzón. Hace falta sesión y tiene que ser
 * la misma cuenta que pidió seguirlo: así el enlace prueba que quien sigue el correo lo puede leer.
 * Es POST a propósito: los escáneres de enlaces de los correos abren GET y no deben confirmar nada.
 */
export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-confirm",
    capacity: 10,
    refillPerMinute: 10,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const token = parsed.data.token.trim();
    const invalid = NextResponse.json(
      { success: false, error: "El enlace no es válido o ya venció. Volvé a seguir el correo para recibir uno nuevo." },
      { status: 410 },
    );
    if (!mailboxTokenUsable(token)) return invalid;

    const tokenHash = hashMailboxToken(token);
    const target = await prisma.pwnMonitoringTarget.findFirst({
      where: { verificationTokenHash: tokenHash, targetType: "EMAIL" },
      select: { id: true, userId: true, targetDisplay: true },
    });
    if (!target) return invalid;
    if (target.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Este enlace es de otra cuenta. Iniciá sesión con la cuenta que pidió seguir el correo." },
        { status: 403 },
      );
    }

    const confirmed = await prisma.pwnMonitoringTarget.updateMany({
      where: { id: target.id, userId: user.id, verificationTokenHash: tokenHash },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date(), verifiedByUserId: user.id, verificationTokenHash: null },
    });
    if (confirmed.count === 0) return invalid;

    await writeAudit({
      actorId: user.id,
      action: "MONITORING_MAILBOX_CONFIRMED",
      targetType: "EMAIL",
      targetId: target.id,
      metadata: {},
    });
    return NextResponse.json({ success: true, data: { id: target.id, targetDisplay: target.targetDisplay, verificationStatus: "VERIFIED" } });
  } catch (error) {
    return internalError("monitoring mailbox confirm", error);
  }
}
// creado por pato dev y askforvini
