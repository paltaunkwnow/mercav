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
} from "../_lib/http";
import { checkRateLimit } from "../_lib/rate-limit";
import { writeAudit } from "../_lib/persistence";
import { DNS_TXT_PREFIX, generateVerificationToken, sameEmail } from "../_lib/verification";

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
      query: z
        .string()
        .trim()
        .min(1)
        .max(253)
        .regex(/^(?=.{1,253}\.?$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i),
      organizationId: z.string().uuid().optional(),
    })
    .strict(),
]);

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
    const data = await prisma.pwnMonitoringTarget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        organizationId: true,
        targetType: true,
        targetDisplay: true,
        targetLookup: true,
        active: true,
        verificationStatus: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return internalError("monitoring list", error);
  }
}

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
    const targetDisplay =
      parsed.data.type === "email" ? redactEmail(query) : redactSubject(query);

    if (parsed.data.organizationId) {
      const organization = await prisma.pwnOrganization.findFirst({
        where: { id: parsed.data.organizationId, ownerUserId: user.id },
        select: { id: true },
      });
      if (!organization) {
        return NextResponse.json(
          { success: false, error: "Organización no encontrada" },
          { status: 404 },
        );
      }
    }

    const targetType = parsed.data.type.toUpperCase() as "EMAIL" | "DOMAIN";
    const existing = await prisma.pwnMonitoringTarget.findFirst({
      where: { userId: user.id, targetType, targetHash },
      select: { id: true, verifiedAt: true },
    });

    const isAccountEmail = targetType === "EMAIL" && sameEmail(query, user.email);
    const alreadyVerified = Boolean(existing?.verifiedAt);
    // A fresh token is issued on every (re)registration of an unverified domain
    // because only its hash is kept.
    const dnsToken =
      targetType === "DOMAIN" && !alreadyVerified ? generateVerificationToken() : null;
    const verification = alreadyVerified
      ? {}
      : isAccountEmail
        ? {
            verificationStatus: "VERIFIED" as const,
            verifiedAt: new Date(),
            verificationTokenHash: null,
          }
        : {
            verificationStatus: "PENDING" as const,
            verifiedAt: null,
            verificationTokenHash: dnsToken?.tokenHash ?? null,
          };

    const target = existing
      ? await prisma.pwnMonitoringTarget.update({
          where: { id: existing.id },
          data: {
            organizationId: parsed.data.organizationId,
            targetDisplay,
            targetLookup: targetType === "DOMAIN" ? query : null,
            active: true,
            ...verification,
          },
        })
      : await prisma.pwnMonitoringTarget.create({
          data: {
            userId: user.id,
            organizationId: parsed.data.organizationId,
            targetType,
            targetHash,
            targetDisplay,
            targetLookup: targetType === "DOMAIN" ? query : null,
            active: true,
            ...verification,
          },
        });

    await writeAudit({
      actorId: user.id,
      action: existing ? "MONITORING_TARGET_REACTIVATED" : "MONITORING_TARGET_CREATED",
      targetType,
      targetId: target.id,
      metadata: { targetHash, verificationStatus: target.verificationStatus },
    });
    return NextResponse.json(
      {
        success: true,
        data: {
          id: target.id,
          organizationId: target.organizationId,
          targetType: target.targetType,
          targetDisplay: target.targetDisplay,
          targetLookup: target.targetLookup,
          active: target.active,
          verificationStatus: target.verificationStatus,
          verifiedAt: target.verifiedAt,
          createdAt: target.createdAt,
          verification:
            target.verificationStatus === "VERIFIED"
              ? null
              : dnsToken
                ? {
                    method: "DNS_TXT",
                    recordName: query,
                    recordValue: `${DNS_TXT_PREFIX}${dnsToken.token}`,
                  }
                : {
                    method: "ACCOUNT_EMAIL_ONLY",
                    message:
                      "Solo se puede verificar el correo de tu propia cuenta. Este objetivo queda pendiente y no se consultará.",
                  },
        },
      },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    return internalError("monitoring create", error);
  }
}

const idSchema = z.object({ id: z.string().uuid() }).strict();
const patchSchema = z.object({ id: z.string().uuid(), active: z.boolean() }).strict();

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
    const updated = await prisma.pwnMonitoringTarget.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { active: parsed.data.active },
    });
    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Objetivo no encontrado" }, { status: 404 });
    }
    await writeAudit({
      actorId: user.id,
      action: parsed.data.active ? "MONITORING_TARGET_RESUMED" : "MONITORING_TARGET_PAUSED",
      targetType: "MONITORING",
      targetId: parsed.data.id,
      metadata: { active: parsed.data.active },
    });
    return NextResponse.json({ success: true, data: { id: parsed.data.id, active: parsed.data.active } });
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
// creado por Patodev y Invertilo
