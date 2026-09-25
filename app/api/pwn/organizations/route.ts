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

const createSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    domain: z
      .string()
      .trim()
      .regex(/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i)
      .optional(),
  })
  .strict();

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
// creado por Patodev y Invertilo
