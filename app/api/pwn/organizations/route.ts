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
import { writeAudit } from "../_lib/persistence";

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const createSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    domain: z.string().trim().regex(DOMAIN_RE).optional(),
  })
  .strict();

const patchSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(2).max(120).optional(),
    domain: z.string().trim().regex(DOMAIN_RE).nullable().optional(),
  })
  .strict()
  .refine((value) => value.name !== undefined || value.domain !== undefined, { message: "Nada para actualizar" });

const deleteSchema = z.object({ id: z.string().uuid() }).strict();

function notFound() {
  return NextResponse.json({ success: false, error: "Organización no encontrada" }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "organizations-read",
    capacity: 60,
    refillPerMinute: 60,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const rows = await prisma.pwnOrganization.findMany({
      where: { ownerUserId: user.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
        _count: { select: { targets: true } },
      },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        createdAt: row.createdAt,
        targetCount: row._count.targets,
      })),
    });
  } catch (error) {
    return internalError("organizations list", error);
  }
}

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "organizations-create",
    capacity: 20,
    refillPerMinute: 20,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const organization = await prisma.pwnOrganization.create({
      data: {
        name: parsed.data.name,
        domain: parsed.data.domain?.toLowerCase() ?? null,
        ownerUserId: user.id,
      },
      select: { id: true, name: true, domain: true, createdAt: true },
    });
    await writeAudit({
      actorId: user.id,
      action: "ORGANIZATION_CREATED",
      targetType: "ORGANIZATION",
      targetId: organization.id,
      metadata: { name: organization.name },
    });
    return NextResponse.json({ success: true, data: organization }, { status: 201 });
  } catch (error) {
    return internalError("organization create", error);
  }
}
/** Renombrar o cambiar el dominio de una organización propia. */
export async function PATCH(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "organizations-update",
    capacity: 20,
    refillPerMinute: 20,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const { id, name, domain } = parsed.data;
    const updated = await prisma.pwnOrganization.updateMany({
      where: { id, ownerUserId: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(domain !== undefined ? { domain: domain ? domain.toLowerCase() : null } : {}),
      },
    });
    if (updated.count === 0) return notFound();
    await writeAudit({
      actorId: user.id,
      action: "ORGANIZATION_UPDATED",
      targetType: "ORGANIZATION",
      targetId: id,
      metadata: { renamed: name !== undefined, domainChanged: domain !== undefined },
    });
    const organization = await prisma.pwnOrganization.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, domain: true, createdAt: true },
    });
    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    return internalError("organization update", error);
  }
}

/** Borra una organización propia. Sus objetivos e informes quedan sin organización (no se borran). */
export async function DELETE(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "organizations-delete",
    capacity: 10,
    refillPerMinute: 10,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const removed = await prisma.pwnOrganization.deleteMany({
      where: { id: parsed.data.id, ownerUserId: user.id },
    });
    if (removed.count === 0) return notFound();
    await writeAudit({
      actorId: user.id,
      action: "ORGANIZATION_DELETED",
      targetType: "ORGANIZATION",
      targetId: parsed.data.id,
      metadata: {},
    });
    return NextResponse.json({ success: true, data: { id: parsed.data.id } });
  } catch (error) {
    return internalError("organization delete", error);
  }
}
// creado por pato dev y askforvini
