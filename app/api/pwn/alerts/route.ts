import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
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
import { PROVEN_TARGET_WHERE } from "../_lib/targets";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(["true", "false"]).optional(),
  status: z.enum(["all", "unread", "read", "critical"]).default("all"),
  q: z.string().trim().max(120).optional(),
  sort: z.enum(["recent", "severity"]).default("recent"),
});

/** Alertas de objetivos propios y probados (o sin objetivo). Filtros y orden sobre todas, en el servidor. */
export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "alerts-read",
    capacity: 60,
    refillPerMinute: 60,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = querySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) return validationError(parsed.error.flatten());
    const { page, limit, unread, q, sort } = parsed.data;
    const status = unread === "true" ? "unread" : parsed.data.status;
    const where: Prisma.PwnAlertWhereInput = {
      userId: user.id,
      AND: [
        { OR: [{ targetId: null }, { target: PROVEN_TARGET_WHERE }] },
        ...(q
          ? [
              {
                OR: [
                  { title: { contains: q, mode: "insensitive" as const } },
                  { body: { contains: q, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
      ...(status === "unread" ? { readAt: null } : {}),
      ...(status === "read" ? { readAt: { not: null } } : {}),
      ...(status === "critical" ? { severity: "CRITICAL" as const } : {}),
    };
    const orderBy: Prisma.PwnAlertOrderByWithRelationInput[] =
      sort === "severity" ? [{ severity: "desc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }];
    const [data, total] = await Promise.all([
      prisma.pwnAlert.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: { select: { name: true, sourceType: true } },
          target: { select: { targetType: true, targetDisplay: true } },
        },
      }),
      prisma.pwnAlert.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return internalError("alerts list", error);
  }
}
// creado por pato dev y askforvini
