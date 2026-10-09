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

const VERIFICATION_FILTER: Record<string, Prisma.PwnBreachWhereInput> = {
  unverified: { verificationStatus: "UNVERIFIED" },
  corroborated: { verificationStatus: { in: ["CORROBORATED", "PARTIALLY_CORROBORATED"] } },
  confirmed: { verificationStatus: "CONFIRMED" },
  disputed: { verificationStatus: "DISPUTED" },
};

const ORDER: Record<string, Prisma.PwnBreachOrderByWithRelationInput[]> = {
  recent: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  name: [{ name: "asc" }],
  confidence: [{ confidenceScore: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }],
};

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(120).optional(),
  verification: z.enum(["all", "unverified", "corroborated", "confirmed", "disputed"]).default("all"),
  sort: z.enum(["recent", "name", "confidence"]).default("recent"),
});

/**
 * Catálogo de filtraciones con búsqueda, filtro y orden en el servidor (sobre toda la tabla,
 * no sobre la página visible). El catálogo de HIBP se sincroniza en el cron, no acá.
 */
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
    const { page, limit, q, verification, sort } = parsed.data;
    const where: Prisma.PwnBreachWhereInput = {
      ...(VERIFICATION_FILTER[verification] ?? {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.pwnBreach.findMany({
        where,
        orderBy: ORDER[sort],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: {
            select: { name: true, sourceType: true },
          },
        },
      }),
      prisma.pwnBreach.count({ where }),
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
