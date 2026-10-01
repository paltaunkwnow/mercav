import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError } from "@/lib/pos/server";
import { PIN_PATTERN, STAFF_ROLES, hashPin, publicStaffSelect, requireManager } from "@/lib/pos/staff";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  role: z.enum(STAFF_ROLES).default("CASHIER"),
  pin: z.string().regex(PIN_PATTERN),
});

export async function GET() {
  const ctx = await getPosContext();
  if (!ctx.ok) return NextResponse.json({ success: true, data: [] });
  const staff = await prisma.pOSStaff.findMany({
    where: { posConfigId: ctx.config.id },
    select: publicStaffSelect,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ success: true, data: staff });
}

export async function POST(req: Request) {
  const ctx = await getPosContext();
  if (!ctx.ok) return ctx.response;
  const gate = await requireManager(req, ctx.config.id);
  if (!gate.ok) return gate.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("Revisá el nombre y que el PIN tenga de 4 a 6 números");

  const staff = await prisma.pOSStaff.create({
    data: { posConfigId: ctx.config.id, name: parsed.data.name, role: parsed.data.role, pinHash: await hashPin(parsed.data.pin) },
    select: publicStaffSelect,
  });
  return NextResponse.json({ success: true, data: staff });
}
// creado por pato dev y askforvini
