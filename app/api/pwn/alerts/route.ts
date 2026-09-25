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

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(["true", "false"]).optional(),
});

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
    const { page, limit, unread } = parsed.data;
    const where = {
      userId: user.id,
      OR: [{ targetId: null }, { target: { verifiedAt: { not: null } } }],
      ...(unread === "true" ? { readAt: null } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.pwnAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return internalError("alerts list", error);
  }
}
// creado por pato dev y askforvini
