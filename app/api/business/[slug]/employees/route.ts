import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { EmployeeInputSchema, employeeData, toEmployeeView } from "@/lib/business/employees";
import { audit } from "@/lib/business/audit";
import { checkWorkspaceLimit } from "@/lib/checkPlanLimit";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "employees.view");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const rows = await prisma.businessEmployee.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  const sensitive = ctx.can("employees.viewSensitive");
  return NextResponse.json({ success: true, data: rows.map((r) => toEmployeeView(r, sensitive)) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;
    const body = await req.json().catch(() => null);
    const parsed = EmployeeInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    // Plan Gratis del dueño: hasta 5 trabajadores activos por empresa.
    const limit = await checkWorkspaceLimit(ctx.workspace, "add_employee");
    if (!limit.allowed) return NextResponse.json({ success: false, error: limit.message }, { status: 403 });
    const employee = await prisma.businessEmployee.create({ data: { workspaceId: ctx.workspace.id, ...employeeData(parsed.data) } });
    await audit(ctx.workspace.id, ctx.userId, "employee.create", "BusinessEmployee", employee.id, { baseSalary: parsed.data.baseSalary });
    return NextResponse.json({ success: true, data: { id: employee.id } });
  } catch (error: any) {
    console.error("[employees/POST] Error:", error);
    return NextResponse.json({ success: false, error: error?.message ?? "Error al guardar el trabajador" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
