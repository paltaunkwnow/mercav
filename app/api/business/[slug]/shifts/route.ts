import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { ShiftInputSchema, toShiftView, shiftsOverlap } from "@/lib/business/shifts";
import { audit } from "@/lib/business/audit";

const QuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  employeeId: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.view");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      year: url.searchParams.get("year"),
      month: url.searchParams.get("month"),
      employeeId: url.searchParams.get("employeeId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    const { year, month, employeeId } = parsed.data;
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;

    // Calculate date range for the month
    const startDate = new Date(
      Date.UTC(targetYear, targetMonth - 1, 1)
    );
    const endDate = new Date(
      Date.UTC(targetYear, targetMonth, 0, 23, 59, 59)
    );

    const where: any = {
      workspaceId: ctx.workspace.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const shifts = await prisma.businessShift.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const data = shifts.map((s) => toShiftView(s as any));
    return NextResponse.json(
      { success: true, data, year: targetYear, month: targetMonth },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") console.error("[shifts/GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener turnos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
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

    const { employeeId, date, startTime, endTime } = parsed.data;

    // Verify employee exists in workspace
    const employee = await prisma.businessEmployee.findFirst({
      where: { id: employeeId, workspaceId: ctx.workspace.id },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    // Check for overlapping shifts on the same date
    const existingShifts = await prisma.businessShift.findMany({
      where: {
        employeeId,
        date: new Date(`${date}T00:00:00.000Z`),
      },
    });

    const newShift = { startTime, endTime };
    for (const existing of existingShifts) {
      if (shiftsOverlap(existing, newShift)) {
        return NextResponse.json(
          { success: false, error: "Este turno se superpone con otro ya asignado" },
          { status: 409 }
        );
      }
    }

    // Create shift
    const shift = await prisma.businessShift.create({
      data: {
        workspaceId: ctx.workspace.id,
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
      "shift.create",
      "BusinessShift",
      shift.id,
      { employeeId, date, startTime, endTime }
    );

    return NextResponse.json(
      { success: true, data: toShiftView(shift as any) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[shifts/POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear turno" },
      { status: 500 }
    );
  }
}
// creado por pato dev y askforvini
