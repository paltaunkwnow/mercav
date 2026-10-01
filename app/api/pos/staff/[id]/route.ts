import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError } from "@/lib/pos/server";
import { PIN_PATTERN, STAFF_ROLES, hashPin, publicStaffSelect, requireManager } from "@/lib/pos/staff";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  pin: z.string().regex(PIN_PATTERN).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getPosContext();
  if (!ctx.ok) return ctx.response;
  const gate = await requireManager(req, ctx.config.id);
  if (!gate.ok) return gate.response;

  const existing = await prisma.pOSStaff.findFirst({ where: { id: params.id, posConfigId: ctx.config.id }, select: { id: true } });
  if (!existing) return posError("No encontramos a esa persona", 404);

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("Revisá los datos. El PIN tiene que tener de 4 a 6 números.");
  const { pin, ...rest } = parsed.data;

  const staff = await prisma.pOSStaff.update({
    where: { id: existing.id },
    data: { ...rest, ...(pin ? { pinHash: await hashPin(pin) } : {}) },
    select: publicStaffSelect,
  });
  return NextResponse.json({ success: true, data: staff });
}
// creado por pato dev y askforvini
