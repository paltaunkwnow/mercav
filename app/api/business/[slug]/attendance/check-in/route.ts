import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";
import { latamCountry, todayIn } from "@/lib/geo/latam";

const CheckInSchema = z.object({
  employeeId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;

    const body = await req.json().catch(() => null);
    const parsed = CheckInSchema.safeParse(body);
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

    // Verificar si ya existe un registro para hoy sin check-out
    const existingAttendance = await prisma.businessAttendance.findFirst({
      where: {
        workspaceId: ctx.workspace.id,
        employeeId: parsed.data.employeeId,
        date: todayDate,
      },
    });

    if (existingAttendance && !existingAttendance.checkOutTime) {
      return NextResponse.json(
        { success: false, error: "El empleado ya fichó entrada hoy y no ha fichado salida" },
        { status: 400 }
      );
    }

    // Crear el registro de check-in
    const attendance = await prisma.businessAttendance.create({
      data: {
        workspaceId: ctx.workspace.id,
        employeeId: parsed.data.employeeId,
        checkInTime: new Date(),
        date: todayDate,
        notes: parsed.data.notes || null,
      },
    });

    await audit(ctx.workspace.id, ctx.userId, "attendance.checkIn", "BusinessAttendance", attendance.id, {
      employeeId: parsed.data.employeeId,
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") console.error("[attendance/check-in] Error:", error);
    return NextResponse.json({ success: false, error: "Error al registrar entrada" }, { status: 500 });
  }
}
