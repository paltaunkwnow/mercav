import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  unauthorized,
  validationError,
} from "../../_lib/http";
import { checkRateLimit } from "../../_lib/rate-limit";

const requestSchema = z.union([
  z.object({ id: z.string().uuid() }).strict(),
  z.object({ all: z.literal(true) }).strict(),
]);

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  const limited = await checkRateLimit(request, {
    route: "alerts-mark-read",
    capacity: 30,
    refillPerMinute: 30,
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());
    const visibleTarget = {
      OR: [{ targetId: null }, { target: { verifiedAt: { not: null } } }],
    };
    const result = await prisma.pwnAlert.updateMany({
      where:
        "id" in parsed.data
          ? { id: parsed.data.id, userId: user.id, ...visibleTarget }
          : { userId: user.id, readAt: null, ...visibleTarget },
      data: { readAt: new Date(), status: "READ" },
    });
    if ("id" in parsed.data && result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Alerta no encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    return internalError("alerts mark read", error);
  }
}
// creado por pato dev y askforvini
