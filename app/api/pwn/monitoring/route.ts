import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSubject, redactEmail, redactSubject } from "@/lib/pwn/redaction";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  unauthorized,
  validationError,
  type PwnSessionUser,
} from "../_lib/http";
import { checkRateLimit, takeRateToken } from "../_lib/rate-limit";
import { writeAudit } from "../_lib/persistence";
import {
  confirmationMethodFor,
  mailboxLinkCopy,
  pendingConsultationCopy,
} from "@/lib/pwn/monitor-authorization";
import { issueMailboxToken } from "@/lib/pwn/mailbox-token";
import { retryAfterCopy } from "@/lib/pwn/rate-copy";
import { DNS_TXT_PREFIX, generateVerificationToken, sameEmail } from "../_lib/verification";
import { isProvenTarget, presentTarget, targetSelect, type TargetContext } from "../_lib/targets";
import { mailboxConfirmationLink, mailerReady, sendMailboxConfirmation } from "../_lib/mailer";

const DOMAIN_RE = /^(?=.{1,253}\.?$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i;

const createSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("email"),
      query: z.string().trim().email().max(254),
      organizationId: z.string().uuid().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("domain"),
      query: z.string().trim().min(1).max(253).regex(DOMAIN_RE),
      organizationId: z.string().uuid().optional(),
    })
    .strict(),
]);

function targetContext(user: PwnSessionUser): TargetContext {
  return {
    accountEmailHash: user.email ? hashSubject(user.email.trim().toLowerCase()) : null,
    accountConfirmed: user.emailConfirmed,
    mailerReady: mailerReady(),
  };
}

async function ownsOrganization(userId: string, organizationId: string): Promise<boolean> {
  const organization = await prisma.pwnOrganization.findFirst({
    where: { id: organizationId, ownerUserId: userId },
    select: { id: true },
  });
  return Boolean(organization);
}

function organizationNotFound() {
  return NextResponse.json({ success: false, error: "Organización no encontrada" }, { status: 404 });
}

/** Solo lectura: listar nunca cambia el estado de verificación. */
export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-read",
    capacity: 60,
    refillPerMinute: 60,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const rows = await prisma.pwnMonitoringTarget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: targetSelect,
    });
    const context = targetContext(user);
    return NextResponse.json({
      success: true,
      data: rows.map((row) => presentTarget(row, context)),
      meta: {
        mailerReady: context.mailerReady,
        accountEmailConfirmed: user.emailConfirmed,
        accountEmailFollowed: rows.some((row) => row.targetType === "EMAIL" && row.targetHash === context.accountEmailHash),
      },
    });
  } catch (error) {
    return internalError("monitoring list", error);
  }
}

type VerificationOut =
  | { method: "DNS_TXT"; host: string; record: string; message: string }
  | { method: "EMAIL_LINK"; sent: boolean; message: string }
  | { method: "ADMIN_AUTHORIZATION"; message: string }
  | null;

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-create",
    capacity: 10,
    refillPerMinute: 10,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const query = parsed.data.query.toLowerCase().replace(/\.$/, "");
    const targetHash = hashSubject(query);
    const targetType = parsed.data.type.toUpperCase() as "EMAIL" | "DOMAIN";
    const targetDisplay = targetType === "EMAIL" ? redactEmail(query) : redactSubject(query);

    if (parsed.data.organizationId && !(await ownsOrganization(user.id, parsed.data.organizationId))) {
      return organizationNotFound();
    }

    const existing = await prisma.pwnMonitoringTarget.findFirst({
      where: { userId: user.id, targetType, targetHash },
      select: targetSelect,
    });
    const context = targetContext(user);
    const isAccountEmail = targetType === "EMAIL" && sameEmail(query, user.email);
    const method = confirmationMethodFor({
      targetType,
      isAccountEmail,
      accountConfirmed: context.accountConfirmed,
      mailerReady: context.mailerReady,
    });
    const proven = existing ? isProvenTarget(existing) : false;

    let verificationData: {
      verificationStatus?: "PENDING" | "VERIFIED";
      verifiedAt?: Date | null;
      verifiedByUserId?: string | null;
      verificationTokenHash?: string | null;
    } = {};
    let verification: VerificationOut = null;
    let mailToken: string | null = null;

    if (!proven) {
      if (method === "ACCOUNT") {
        verificationData = {
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
          verifiedByUserId: user.id,
          verificationTokenHash: null,
        };
      } else if (method === "DNS_TXT") {
        // Cada alta o reactivación emite un registro nuevo; el anterior deja de valer.
        const { token, tokenHash } = generateVerificationToken();
        verificationData = { verificationStatus: "PENDING", verifiedAt: null, verifiedByUserId: null, verificationTokenHash: tokenHash };
        verification = {
          method: "DNS_TXT",
          host: query,
          record: `${DNS_TXT_PREFIX}${token}`,
          message: "Agregá este registro TXT al DNS del dominio y tocá Comprobar. Se muestra una sola vez.",
        };
      } else if (method === "EMAIL_LINK") {
        // Un envío por hora para cada dirección (sin importar la cuenta) y cinco por día por cuenta: nada de usar Pwn para mandar spam.
        const perAddress = await takeRateToken(request, {
          route: `monitoring-mail:${targetHash}`,
          capacity: 1,
          refillPerMinute: 1 / 60,
          global: true,
        });
        const perUser =
          perAddress === null
            ? await takeRateToken(request, { route: "monitoring-mail-user", capacity: 5, refillPerMinute: 5 / 1440, userId: user.id })
            : null;
        const wait = perAddress ?? perUser;
        if (wait !== null) {
          verificationData = existing ? {} : { verificationStatus: "PENDING", verifiedAt: null, verificationTokenHash: null };
          verification = {
            method: "EMAIL_LINK",
            sent: false,
            message: `Ya mandamos un enlace a esa dirección hace poco. Revisá la bandeja (y el spam). ${retryAfterCopy(wait)}`,
          };
        } else {
          const issued = issueMailboxToken();
          mailToken = issued.token;
          verificationData = { verificationStatus: "PENDING", verifiedAt: null, verifiedByUserId: null, verificationTokenHash: issued.tokenHash };
        }
      } else {
        verificationData =
          existing?.verificationStatus === "VERIFIED"
            ? { verificationStatus: "PENDING", verifiedAt: null, verifiedByUserId: null }
            : existing
              ? {}
              : { verificationStatus: "PENDING", verifiedAt: null, verificationTokenHash: null };
        verification = { method: "ADMIN_AUTHORIZATION", message: pendingConsultationCopy(targetDisplay).body };
      }
    }

    const organizationId = parsed.data.organizationId;
    const saved = existing
      ? await prisma.pwnMonitoringTarget.update({
          where: { id: existing.id },
          data: {
            ...(organizationId ? { organizationId } : {}),
            targetDisplay,
            targetLookup: targetType === "DOMAIN" ? query : null,
            active: true,
            ...verificationData,
          },
          select: targetSelect,
        })
      : await prisma.pwnMonitoringTarget.create({
          data: {
            userId: user.id,
            organizationId: organizationId ?? null,
            targetType,
            targetHash,
            targetDisplay,
            targetLookup: targetType === "DOMAIN" ? query : null,
            active: true,
            ...verificationData,
          },
          select: targetSelect,
        });

    if (mailToken) {
      // El correo en claro solo existe en esta solicitud: se usa para enviar y se descarta.
      const sent = await sendMailboxConfirmation(query, mailboxConfirmationLink(mailToken));
      verification = {
        method: "EMAIL_LINK",
        sent,
        message: sent
          ? mailboxLinkCopy(targetDisplay).body
          : "No pudimos enviar el correo de confirmación. Probá de nuevo en unos minutos.",
      };
    }

    await writeAudit({
      actorId: user.id,
      action: existing ? "MONITORING_TARGET_REACTIVATED" : "MONITORING_TARGET_CREATED",
      targetType,
      targetId: saved.id,
      metadata: {
        verificationStatus: saved.verificationStatus,
        method: proven ? "ALREADY_PROVEN" : method,
      },
    });

    return NextResponse.json(
      { success: true, data: { ...presentTarget(saved, context), verification } },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    return internalError("monitoring create", error);
  }
}

const idSchema = z.object({ id: z.string().uuid() }).strict();
const patchSchema = z
  .object({
    id: z.string().uuid(),
    active: z.boolean().optional(),
    organizationId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine((value) => value.active !== undefined || value.organizationId !== undefined, {
    message: "Nada para actualizar",
  });

export async function PATCH(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-update",
    capacity: 30,
    refillPerMinute: 30,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const { id, active, organizationId } = parsed.data;
    if (organizationId && !(await ownsOrganization(user.id, organizationId))) return organizationNotFound();

    const updated = await prisma.pwnMonitoringTarget.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(active !== undefined ? { active } : {}),
        ...(organizationId !== undefined ? { organizationId } : {}),
      },
    });
    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Objetivo no encontrado" }, { status: 404 });
    }
    await writeAudit({
      actorId: user.id,
      action:
        active === undefined
          ? "MONITORING_TARGET_ORGANIZATION_SET"
          : active
            ? "MONITORING_TARGET_RESUMED"
            : "MONITORING_TARGET_PAUSED",
      targetType: "MONITORING",
      targetId: id,
      metadata: {
        ...(active !== undefined ? { active } : {}),
        ...(organizationId !== undefined ? { organizationId } : {}),
      },
    });
    return NextResponse.json({ success: true, data: { id, active, organizationId } });
  } catch (error) {
    return internalError("monitoring update", error);
  }
}

export async function DELETE(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "monitoring-delete",
    capacity: 20,
    refillPerMinute: 20,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = idSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const removed = await prisma.pwnMonitoringTarget.deleteMany({
      where: { id: parsed.data.id, userId: user.id },
    });
    if (removed.count === 0) {
      return NextResponse.json({ success: false, error: "Objetivo no encontrado" }, { status: 404 });
    }
    await writeAudit({
      actorId: user.id,
      action: "MONITORING_TARGET_DELETED",
      targetType: "MONITORING",
      targetId: parsed.data.id,
      metadata: {},
    });
    return NextResponse.json({ success: true, data: { id: parsed.data.id } });
  } catch (error) {
    return internalError("monitoring delete", error);
  }
}
// creado por pato dev y askforvini
