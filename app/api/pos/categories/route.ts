import { NextResponse } from "next/server";
import { z } from "zod";
import { getPosContext, getPosScope } from "@/lib/pos/server";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/pos/staff";

const categorySchema = z.object({ name: z.string().trim().min(1).max(60) });

export async function GET(req: Request) {
  try {
    const res = await getPosScope(req, "pos.sell");
    if (!res.ok) return res.response;
    if (!res.scope.config) return NextResponse.json({ success: true, data: [] });
    const categories = await prisma.pOSCategory.findMany({ where: { posConfigId: res.scope.config.id }, orderBy: { name: "asc" } });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getPosContext(req, "pos.inventory");
    if (!ctx.ok) return ctx.response;
    const gate = await requireManager(req, ctx.config.id);
    if (!gate.ok) return gate.response;

    const parsed = categorySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Escribí el nombre de la categoría" }, { status: 400 });
    const category = await prisma.pOSCategory.create({ data: { posConfigId: ctx.config.id, name: parsed.data.name } });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
