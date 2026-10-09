import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { calculate, lineData } from "@/lib/business/payroll-service";
import { toLineView } from "@/lib/business/payroll-view";

const cents = (v: number) => Math.round(v * 100) / 100;
/** Número no negativo con tope, redondeado a la precisión de la columna (2 decimales). */
const amount = (label: string, max: number) =>
  z.coerce
    .number({ message: `${label}: tiene que ser un número` })
    .min(0, `${label} no puede ser negativo`)
    .max(max, `${label} es demasiado alto`)
    .transform(cents);

const InputsSchema = z.object({
  daysWorked: z.coerce
    .number({ message: "Días pagados: tiene que ser un número" })
    .min(0, "Los días no pueden ser negativos")
    .max(30, "Los días pagados van de 0 a 30")
    .transform((v) => Math.round(v)),
  overtimeHours: amount("Horas extra", 400),
  sundayHolidayDays: amount("Domingos o feriados", 31),
  otherBonuses: amount("Otros bonos", 1_000_000),
  advances: amount("Anticipos", 1_000_000),
  otherDeductions: amount("Otros descuentos", 1_000_000),
  rcivaCredit: amount("Facturas", 1_000_000),
});

/** Guarda las entradas de una fila y devuelve el cálculo actualizado. */
export async function PATCH(req: Request, { params }: { params: { slug: string; runId: string; lineId: string } }) {
  const auth = await apiBusiness(params.slug, "payroll.edit");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const parsed = InputsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const line = await prisma.businessPayrollLine.findFirst({
    where: { id: params.lineId, runId: params.runId, run: { workspaceId: ctx.workspace.id } },
    include: { run: true, employee: true },
  });
  if (!line) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
  if (line.run.status !== "DRAFT") return NextResponse.json({ success: false, error: "La planilla está cerrada" }, { status: 400 });

  const inputs = parsed.data;
  const result = calculate(line.employee, ctx.workspace, line.run, inputs);
  // Escritura condicionada: si la planilla se cerró entre la lectura y acá, no se toca.
  const written = await prisma.businessPayrollLine.updateMany({
    where: { id: line.id, run: { is: { id: line.runId, workspaceId: ctx.workspace.id, status: "DRAFT" } } },
    data: lineData(result, inputs),
  });
  if (written.count !== 1) return NextResponse.json({ success: false, error: "La planilla está cerrada" }, { status: 400 });
  const updated = await prisma.businessPayrollLine.findUniqueOrThrow({ where: { id: line.id }, include: { employee: true } });
  return NextResponse.json({ success: true, data: toLineView(updated, ctx.can("employees.viewSensitive")) });
}
// creado por pato dev y askforvini
