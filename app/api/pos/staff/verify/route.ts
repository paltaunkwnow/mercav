import { NextResponse } from "next/server";
import { z } from "zod";
import { getPosContext, posError } from "@/lib/pos/server";
import { STAFF_ROLES, checkPin } from "@/lib/pos/staff";

const schema = z.object({ pin: z.string().max(6), staffId: z.string().optional(), role: z.enum(STAFF_ROLES).optional() });

/** Confirms a PIN without doing anything else. The browser uses it to unlock manager-only screens. */
export async function POST(req: Request) {
  const ctx = await getPosContext();
  if (!ctx.ok) return ctx.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("PIN inválido");
  const check = await checkPin(ctx.config.id, parsed.data.pin, { staffId: parsed.data.staffId, role: parsed.data.role });
  if (!check.ok) return check.response;
  return NextResponse.json({ success: true, data: check.staff });
}
// creado por pato dev y askforvini
