import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  adminRequestCopy,
  canDecideMonitorAuthorization,
  canRequestMonitorAuthorization,
  decisionBlockedReason,
  MONITOR_AUTH_MESSAGE_MAX,
  ownerDecisionCopy,
  requestBlockedReason,
  sanitizeAuthorizationMessage,
} from "@/lib/pwn/monitor-authorization";
import {
  disabledResponse,
  forbidden,
  getPwnSessionUser,
  internalError,
  isAdmin,
  unauthorized,
  validationError,
} from "../../_lib/http";
import { checkRateLimit } from "../../_lib/rate-limit";
import { listAdminUserIds, writeAudit } from "../../_lib/persistence";
import { mailerReady } from "../../_lib/mailer";
import { isProvenTarget } from "../../_lib/targets";
import { hashSubject } from "@/lib/pwn/redaction";

const TYPE_LABEL: Record<string, string> = { EMAIL: "correo", DOMAIN: "dominio" };

const requestSchema = z
  .object({
    id: z.string().uuid(),
    message: z.string().max(MONITOR_AUTH_MESSAGE_MAX).optional(),
  })
  .strict();

const decisionSchema = z
  .object({
    id: z.string().uuid(),
    decision: z.enum(["approve", "deny"]),
  })
  .strict();

const ownerSelect = {
  id: true,
  organizationId: true,
  targetType: true,
  targetDisplay: true,
  targetLookup: true,
  active: true,
  verificationStatus: true,
  authorizationRequestedAt: true,
  authorizationMessage: true,
  verifiedAt: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const limited = await checkRateLimit(request, {
    route: "monitoring-auth-queue",
    capacity: 40,
    refillPerMinute: 40,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const rows = await prisma.pwnMonitoringTarget.findMany({
      where: { verificationStatus: "REQUESTED", targetType: "EMAIL" },
      orderBy: { authorizationRequestedAt: "asc" },
      take: 100,
      select: {
        ...ownerSelect,
        targetHash: true,
        user: { select: { id: true, name: true, email: true, username: true, isVerified: true } },
      },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        targetType: row.targetType,
        targetDisplay: row.targetDisplay,
        targetLookup: row.targetLookup,
        active: row.active,
        verificationStatus: row.verificationStatus,
        authorizationRequestedAt: row.authorizationRequestedAt,
        authorizationMessage: row.authorizationMessage,
        verifiedAt: row.verifiedAt,
        createdAt: row.createdAt,
        owner: {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          username: row.user.username,
          emailConfirmed: row.user.isVerified,
        },
        // El administrador no ve el correo seguido (solo su hash): le decimos al menos si es el de la cuenta.
        isOwnerAccountEmail: row.user.email ? hashSubject(row.user.email.trim().toLowerCase()) === row.targetHash : false,
      })),
      meta: { mailerReady: mailerReady() },
    });
  } catch (error) {
    return internalError("monitoring auth queue", error);
  }
}

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-auth-request",
    capacity: 8,
    refillPerMinute: 8,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());

    const target = await prisma.pwnMonitoringTarget.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: {
        id: true,
        targetType: true,
        targetDisplay: true,
        verificationStatus: true,
        verifiedAt: true,
        verifiedByUserId: true,
      },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "Objetivo no encontrado" }, { status: 404 });
    }
    // Una fila marcada VERIFIED sin prueba (código viejo) cuenta como pendiente.
    const status = isProvenTarget(target) ? "VERIFIED" : target.verificationStatus === "VERIFIED" ? "PENDING" : target.verificationStatus;
    const blocked = requestBlockedReason(status, target.targetType);
    if (target.targetType !== "EMAIL" || blocked || !canRequestMonitorAuthorization(status)) {
      return NextResponse.json(
        { success: false, error: blocked ?? "Solo los correos sin confirmar requieren autorización." },
        { status: 409 },
      );
    }

    if (mailerReady()) {
      return NextResponse.json(
        {
          success: false,
          error: "Este correo se confirma con el enlace que llega al buzón. Volvé a seguirlo para recibir uno nuevo.",
        },
        { status: 409 },
      );
    }

    const message = sanitizeAuthorizationMessage(parsed.data.message);
    const updated = await prisma.pwnMonitoringTarget.update({
      where: { id: target.id },
      data: {
        verificationStatus: "REQUESTED",
        authorizationRequestedAt: new Date(),
        authorizationMessage: message,
        verifiedAt: null,
        verificationTokenHash: null,
      },
      select: ownerSelect,
    });

    await writeAudit({
      actorId: user.id,
      action: "MONITORING_AUTH_REQUESTED",
      targetType: target.targetType,
      targetId: target.id,
      metadata: { hasMessage: Boolean(message) },
    });

    const ownerLabel = user.email?.trim() || "Un usuario";
    const copy = adminRequestCopy(
      ownerLabel,
      updated.targetLookup ?? updated.targetDisplay,
      TYPE_LABEL[updated.targetType] ?? "objetivo",
    );
    const adminIds = await listAdminUserIds();
    await Promise.all(
      adminIds
        .filter((adminId) => adminId !== user.id)
        .map((adminId) =>
          createNotification(adminId, "PWN_MONITOR_AUTH_REQUEST", copy.title, copy.body, "/pwn/autorizaciones"),
        ),
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return internalError("monitoring auth request", error);
  }
}

export async function PATCH(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const limited = await checkRateLimit(request, {
    route: "monitoring-auth-decide",
    capacity: 30,
    refillPerMinute: 30,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const approved = parsed.data.decision === "approve";

    const target = await prisma.pwnMonitoringTarget.findFirst({
      where: { id: parsed.data.id },
      select: {
        id: true,
        userId: true,
        targetType: true,
        targetDisplay: true,
        targetLookup: true,
        verificationStatus: true,
      },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "Objetivo no encontrado" }, { status: 404 });
    }
    const blocked = decisionBlockedReason(target.verificationStatus);
    if (blocked || !canDecideMonitorAuthorization(target.verificationStatus)) {
      return NextResponse.json({ success: false, error: blocked ?? "No hay una solicitud pendiente." }, { status: 409 });
    }

    const now = new Date();
    // Update condicionado al estado REQUESTED: si dos admins deciden a la vez, solo uno gana
    // (evita decisiones pisadas y notificaciones duplicadas al dueño).
    const decided = await prisma.pwnMonitoringTarget.updateMany({
      where: { id: target.id, verificationStatus: "REQUESTED" },
      data: approved
        ? {
            verificationStatus: "VERIFIED",
            verifiedAt: now,
            verifiedByUserId: user.id,
            verificationTokenHash: null,
          }
        : {
            verificationStatus: "DENIED",
            verifiedAt: null,
            verifiedByUserId: user.id,
            verificationTokenHash: null,
          },
    });
    if (decided.count === 0) {
      return NextResponse.json({ success: false, error: "No hay una solicitud pendiente." }, { status: 409 });
    }
    const updated = await prisma.pwnMonitoringTarget.findUniqueOrThrow({
      where: { id: target.id },
      select: ownerSelect,
    });

    await writeAudit({
      actorId: user.id,
      action: approved ? "MONITORING_AUTH_APPROVED" : "MONITORING_AUTH_DENIED",
      targetType: target.targetType,
      targetId: target.id,
      // Queda registrado que la aprobación no prueba que el buzón sea del solicitante.
      metadata: { ownerUserId: target.userId, method: "ADMIN_WITHOUT_MAILBOX_PROOF" },
    });

    const display = updated.targetLookup ?? updated.targetDisplay;
    const copy = ownerDecisionCopy(approved, display);
    await createNotification(
      target.userId,
      approved ? "PWN_MONITOR_AUTH_APPROVED" : "PWN_MONITOR_AUTH_DENIED",
      copy.title,
      copy.body,
      "/pwn/exposure",
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return internalError("monitoring auth decide", error);
  }
}
// creado por pato dev y askforvini
