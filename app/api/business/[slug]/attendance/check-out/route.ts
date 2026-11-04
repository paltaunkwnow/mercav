import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";
import { latamCountry, todayIn } from "@/lib/geo/latam";

const CheckOutSchema = z.object({
  employeeId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;

    const body = await req.json().catch(() => null);
    const parsed = CheckOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    // Verificar que el empleado existe en esta workspace
    const employee = await prisma.businessEmployee.findFirst({
      where: { id: parsed.data.employeeId, workspaceId: ctx.workspace.id },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
    }

    // Obtener la fecha de hoy en la zona horaria del país
    const today = todayIn(latamCountry(ctx.workspace.country).timezone);
    const todayDate = new Date(today);

    // Buscar el registro de hoy sin check-out
    const attendance = await prisma.businessAttendance.findFirst({
      where: {
        workspaceId: ctx.workspace.id,
        employeeId: parsed.data.employeeId,
        date: todayDate,
        checkOutTime: null,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "No hay entrada registrada para hoy o ya fichó salida" },
        { status: 400 }
      );
    }

    // Actualizar con el check-out
    const updated = await prisma.businessAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
        notes: parsed.data.notes ? `${attendance.notes || ""}${attendance.notes ? " | " : ""}${parsed.data.notes}` : attendance.notes,
      },
    });

    await audit(ctx.workspace.id, ctx.userId, "attendance.checkOut", "BusinessAttendance", updated.id, {
      employeeId: parsed.data.employeeId,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") console.error("[attendance/check-out] Error:", error);
    return NextResponse.json({ success: false, error: "Error al registrar salida" }, { status: 500 });
  }
}
