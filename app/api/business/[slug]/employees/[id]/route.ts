import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { EmployeeInputSchema, changedFields, employeeUpdateData, endDaySchema } from "@/lib/business/employees";
import { recalcDraftLinesFor } from "@/lib/business/payroll-service";
import { audit } from "@/lib/business/audit";
import { checkWorkspaceLimit } from "@/lib/checkPlanLimit";

const StatusSchema = z.object({
  action: z.enum(["deactivate", "reactivate"]),
  endDate: endDaySchema.optional(),
});

async function findEmployee(workspaceId: string, id: string) {
  return prisma.businessEmployee.findFirst({ where: { id, workspaceId } });
}

export async function PUT(req: Request, { params }: { params: { slug: string; id: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;
    const before = await findEmployee(ctx.workspace.id, params.id);
    if (!before) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    const parsed = EmployeeInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

    const fields = changedFields(before, parsed.data);
    const salaryChanged = Number(before.baseSalary) !== parsed.data.baseSalary;
    const updated = await prisma.businessEmployee.update({ where: { id: before.id }, data: employeeUpdateData(before, parsed.data) });
    if (salaryChanged || fields.includes("hireDate")) await recalcDraftLinesFor(ctx.workspace, updated);

    if (fields.length) await audit(ctx.workspace.id, ctx.userId, "employee.update", "BusinessEmployee", before.id, { fields });
    if (salaryChanged) {
      await audit(ctx.workspace.id, ctx.userId, "employee.salary", "BusinessEmployee", before.id, { from: Number(before.baseSalary), to: parsed.data.baseSalary });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[employees/PUT] Error:", error);
    return NextResponse.json({ success: false, error: "Error al actualizar el trabajador" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { slug: string; id: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;
    const employee = await findEmployee(ctx.workspace.id, params.id);
    if (!employee) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    const parsed = StatusSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

    if (parsed.data.action === "deactivate") {
      const endDate = new Date(`${parsed.data.endDate ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
      if (endDate < employee.hireDate) return NextResponse.json({ success: false, error: "La baja no puede ser antes del ingreso" }, { status: 400 });
      await prisma.businessEmployee.update({ where: { id: employee.id }, data: { status: "INACTIVE", endDate } });
      await audit(ctx.workspace.id, ctx.userId, "employee.deactivate", "BusinessEmployee", employee.id, { endDate: endDate.toISOString().slice(0, 10) });
    } else {
      // Reactivar suma un trabajador activo: mismo límite que el alta (plan Gratis del dueño).
      if (employee.status !== "ACTIVE") {
        const limit = await checkWorkspaceLimit(ctx.workspace, "add_employee");
        if (!limit.allowed) return NextResponse.json({ success: false, error: limit.message }, { status: 403 });
      }
      await prisma.businessEmployee.update({ where: { id: employee.id }, data: { status: "ACTIVE", endDate: null } });
      await audit(ctx.workspace.id, ctx.userId, "employee.reactivate", "BusinessEmployee", employee.id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[employees/PATCH] Error:", error);
    return NextResponse.json({ success: false, error: "Error al modificar el estado" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
