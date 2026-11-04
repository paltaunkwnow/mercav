import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { latamCountry, todayIn } from "@/lib/geo/latam";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await apiBusiness(params.slug, "employees.edit");
    if ("error" in auth) return auth.error;
    const { ctx } = auth;

    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date"); // YYYY-MM-DD
    const employeeId = url.searchParams.get("employeeId");

    // Validar formato de fecha si se proporciona
    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido: debe ser YYYY-MM-DD");
    let queryDate: Date;

    if (dateStr) {
      const dateValidation = dateSchema.safeParse(dateStr);
      if (!dateValidation.success) {
        return NextResponse.json({ success: false, error: "Parámetro date inválido: debe ser YYYY-MM-DD" }, { status: 400 });
      }
      queryDate = new Date(dateStr + "T00:00:00Z");
    } else {
      // Obtener la fecha de hoy en la zona horaria del país
      const today = todayIn(latamCountry(ctx.workspace.country).timezone);
      queryDate = new Date(today + "T00:00:00Z");
    }

    const where: any = {
      workspaceId: ctx.workspace.id,
      date: queryDate,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const records = await prisma.businessAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: { checkInTime: "asc" },
    });

    return NextResponse.json({ success: true, data: records }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: any) {
    console.error("[attendance/GET] Error:", error);
    return NextResponse.json({ success: false, error: "Error al obtener registros de asistencia" }, { status: 500 });
  }
}
