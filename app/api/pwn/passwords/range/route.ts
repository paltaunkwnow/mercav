import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchPasswordRange } from "@/lib/integrations/pwn/hibp";
import {
  disabledResponse,
  getPwnSessionUser,
  internalError,
  providerError,
  validationError,
} from "../../_lib/http";
import { checkRateLimit, searchLimit } from "../../_lib/rate-limit";

const requestSchema = z
  .object({
    prefix: z.string().regex(/^[A-F0-9]{5}$/i),
  })
  .strict();

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const sessionUser = await getPwnSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  const limited = await checkRateLimit(request, {
    route: "password-range",
    ...searchLimit(sessionUser?.id),
  });
  if (limited) return limited;

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error.flatten());

    const result = await fetchPasswordRange(parsed.data.prefix);
    if (!result.configured) {
      return NextResponse.json({ success: true, configured: false });
    }
    return NextResponse.json({
      success: true,
      configured: true,
      data: result.data,
    });
  } catch (error) {
    const upstream = providerError(error);
    return upstream ?? internalError("password range", error);
  }
}
