import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { ShiftInputSchema, toShiftView, shiftsOverlap } from "@/lib/business/shifts";
import { audit } from "@/lib/business/audit";

export async function PUT(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;

    const body = await req.json().catch(() => null);
    const parsed = ShiftInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    // Get existing shift
    const existingShift = await prisma.businessShift.findFirst({
      where: { id: params.id, workspaceId: ctx.workspace.id },
    });

    if (!existingShift) {
      return NextResponse.json(
        { success: false, error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    const { employeeId, date, startTime, endTime } = parsed.data;

    // Verify employee exists and belongs to workspace
    const employee = await prisma.businessEmployee.findFirst({
      where: { id: employeeId, workspaceId: ctx.workspace.id },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    // Check for overlapping shifts (excluding current shift)
    const otherShifts = await prisma.businessShift.findMany({
      where: {
        employeeId,
        date: new Date(`${date}T00:00:00.000Z`),
        id: { not: params.id },
      },
    });

    const newShift = { startTime, endTime };
    for (const existing of otherShifts) {
      if (shiftsOverlap(existing, newShift)) {
        return NextResponse.json(
          { success: false, error: "Este turno se superpone con otro ya asignado" },
          { status: 409 }
        );
      }
    }

    // Update shift
    const updated = await prisma.businessShift.update({
      where: { id: params.id },
      data: {
        employeeId,
        date: new Date(`${date}T00:00:00.000Z`),
        startTime,
        endTime,
        shiftType: parsed.data.shiftType,
        notes: parsed.data.notes || null,
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    await audit(
      ctx.workspace.id,
      ctx.userId,
      "shift.update",
      "BusinessShift",
      updated.id,
      { employeeId, date, startTime, endTime }
    );

    return NextResponse.json({ success: true, data: toShiftView(updated as any) });
  } catch (error: any) {
    console.error("[shifts/[id]/PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar turno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;

    // Get existing shift
    const shift = await prisma.businessShift.findFirst({
      where: { id: params.id, workspaceId: ctx.workspace.id },
    });

    if (!shift) {
      return NextResponse.json(
        { success: false, error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    // Delete shift
    await prisma.businessShift.delete({
      where: { id: params.id },
    });

    await audit(
      ctx.workspace.id,
      ctx.userId,
      "shift.delete",
      "BusinessShift",
      params.id,
      { employeeId: shift.employeeId, date: shift.date }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[shifts/[id]/DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar turno" },
      { status: 500 }
    );
  }
}
// creado por pato dev y askforvini
