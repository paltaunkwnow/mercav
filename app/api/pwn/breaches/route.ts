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
import { syncHibpCatalog } from "../_lib/cycle";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "breaches-read",
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
    const { page, limit } = parsed.data;
    const existingTotal = await prisma.pwnBreach.count();
    if (existingTotal < 800) {
      await syncHibpCatalog().catch(() => ({ configured: false, upserted: 0 }));
    }

    const [data, total] = await Promise.all([
      prisma.pwnBreach.findMany({
        orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: {
            select: { name: true, sourceType: true },
          },
        },
      }),
      prisma.pwnBreach.count(),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return internalError("breaches list", error);
  }
}
// creado por pato dev y askforvini
