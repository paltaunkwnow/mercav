import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { createRun } from "@/lib/business/payroll-service";
import { hasParamsForYear } from "@/lib/business/bolivia/params";
import { Prisma } from "@prisma/client";
import { audit } from "@/lib/business/audit";
import { countryName, payrollSupported } from "@/lib/business/countries";

const CreateSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "payroll.edit");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  if (!payrollSupported(ctx.workspace.country)) {
    return NextResponse.json({ success: false, error: `La planilla automática todavía no está disponible para ${countryName(ctx.workspace.country)}.` }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Elegí un mes válido" }, { status: 400 });
  const { year, month } = parsed.data;
  if (!hasParamsForYear(year)) {
    return NextResponse.json({ success: false, error: `Todavía no cargamos los parámetros laborales de ${year}.` }, { status: 400 });
  }
  const exists = await prisma.businessPayrollRun.findUnique({ where: { workspaceId_year_month: { workspaceId: ctx.workspace.id, year, month } }, select: { id: true } });
  if (exists) return NextResponse.json({ success: false, error: "Ya hay una planilla para ese mes", data: { id: exists.id } }, { status: 409 });
  let run;
  try {
    run = await createRun(ctx.workspace, year, month, ctx.userId);
  } catch (error) {
    // Dos pedidos a la vez para el mismo mes: el segundo choca con la clave única.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.businessPayrollRun.findUnique({ where: { workspaceId_year_month: { workspaceId: ctx.workspace.id, year, month } }, select: { id: true } });
      return NextResponse.json({ success: false, error: "Ya hay una planilla para ese mes", data: existing ? { id: existing.id } : undefined }, { status: 409 });
    }
    throw error;
  }
  await audit(ctx.workspace.id, ctx.userId, "payroll.create", "BusinessPayrollRun", run.id, { year, month });
  return NextResponse.json({ success: true, data: { id: run.id } });
}
// creado por pato dev y askforvini
