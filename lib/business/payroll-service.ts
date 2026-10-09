import type { BusinessEmployee, BusinessPayrollLine, BusinessPayrollRun, BusinessWorkspace, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computePayrollLine, type PayrollInput, type PayrollResult } from "./bolivia/payroll";
import { paramsForYear, type PayrollParams } from "./bolivia/params";
import { lastDayOfMonth } from "./bolivia/seniority";
import { isoDay } from "./format";

export type LineInputs = {
  daysWorked: number;
  overtimeHours: number;
  sundayHolidayDays: number;
  otherBonuses: number;
  advances: number;
  otherDeductions: number;
  rcivaCredit: number;
};

export const EMPTY_INPUTS: LineInputs = {
  daysWorked: 30,
  overtimeHours: 0,
  sundayHolidayDays: 0,
  otherBonuses: 0,
  advances: 0,
  otherDeductions: 0,
  rcivaCredit: 0,
};

export function runParams(run: Pick<BusinessPayrollRun, "params" | "year">): PayrollParams {
  const p = run.params as unknown as PayrollParams | null;
  return p && typeof p === "object" && "smn" in p ? p : paramsForYear(run.year);
}

export function lineInputs(line: Pick<BusinessPayrollLine, keyof LineInputs>): LineInputs {
  return {
    daysWorked: line.daysWorked,
    overtimeHours: Number(line.overtimeHours),
    sundayHolidayDays: Number(line.sundayHolidayDays),
    otherBonuses: Number(line.otherBonuses),
    advances: Number(line.advances),
    otherDeductions: Number(line.otherDeductions),
    rcivaCredit: Number(line.rcivaCredit),
  };
}

export function calculate(
  employee: Pick<BusinessEmployee, "baseSalary" | "hireDate">,
  workspace: Pick<BusinessWorkspace, "productive">,
  run: Pick<BusinessPayrollRun, "year" | "month" | "params">,
  inputs: LineInputs,
): PayrollResult {
  const input: PayrollInput = {
    baseSalary: Number(employee.baseSalary),
    hireDate: isoDay(employee.hireDate),
    productive: workspace.productive,
    year: run.year,
    month: run.month,
    ...inputs,
  };
  return computePayrollLine(input, runParams(run));
}

export function lineData(result: PayrollResult, inputs: LineInputs) {
  return {
    ...inputs,
    result: result as unknown as Prisma.InputJsonValue,
    totalEarned: result.earned.total,
    totalDeductions: result.deductions.total,
    netPay: result.netPay,
    employerCost: result.employerCost,
  };
}

/** Trabajadores que corresponden al mes: activos, ingresados antes de fin de mes y sin baja previa. */
export async function employeesForPeriod(workspaceId: string, year: number, month: number) {
  const end = new Date(`${lastDayOfMonth(year, month)}T00:00:00.000Z`);
  const start = new Date(Date.UTC(year, month - 1, 1));
  return prisma.businessEmployee.findMany({
    where: {
      workspaceId,
      hireDate: { lte: end },
      OR: [{ status: "ACTIVE" }, { endDate: { gte: start } }],
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

/** Días a pagar por defecto: proporcional si ingresó o se fue dentro del mes. */
export function defaultDays(employee: Pick<BusinessEmployee, "hireDate" | "endDate">, year: number, month: number) {
  const first = Date.UTC(year, month - 1, 1);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const from = Math.max(first, employee.hireDate.getTime());
  const to = employee.endDate ? Math.min(Date.UTC(year, month - 1, lastDay), employee.endDate.getTime()) : Date.UTC(year, month - 1, lastDay);
  if (to < from) return 0;
  const startDay = new Date(from).getUTCDate();
  const endDay = new Date(to).getUTCDate();
  if (startDay === 1 && endDay === lastDay) return 30;
  return Math.min(30, endDay - startDay + 1);
}

export async function createRun(workspace: BusinessWorkspace, year: number, month: number, actorId: string) {
  const params = paramsForYear(year);
  const employees = await employeesForPeriod(workspace.id, year, month);
  return prisma.$transaction(async (tx) => {
    const run = await tx.businessPayrollRun.create({
      data: { workspaceId: workspace.id, year, month, params: params as unknown as Prisma.InputJsonValue, createdById: actorId },
    });
    for (const employee of employees) {
      const inputs = { ...EMPTY_INPUTS, daysWorked: defaultDays(employee, year, month) };
      const result = calculate(employee, workspace, run, inputs);
      await tx.businessPayrollLine.create({ data: { runId: run.id, employeeId: employee.id, ...lineData(result, inputs) } });
    }
    return run;
  });
}

/** Recalcula una planilla en borrador desde los legajos y suma a quien falte. */
export async function syncRun(workspace: BusinessWorkspace, run: BusinessPayrollRun) {
  if (run.status !== "DRAFT") return;
  const [lines, employees] = await Promise.all([
    prisma.businessPayrollLine.findMany({ where: { runId: run.id }, include: { employee: true } }),
    employeesForPeriod(workspace.id, run.year, run.month),
  ]);
  const present = new Set(lines.map((l) => l.employeeId));
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const inputs = lineInputs(line);
      await tx.businessPayrollLine.updateMany({
        where: { id: line.id, run: { is: { status: "DRAFT" } } },
        data: lineData(calculate(line.employee, workspace, run, inputs), inputs),
      });
    }
    for (const employee of employees) {
      if (present.has(employee.id)) continue;
      const inputs = { ...EMPTY_INPUTS, daysWorked: defaultDays(employee, run.year, run.month) };
      await tx.businessPayrollLine.create({ data: { runId: run.id, employeeId: employee.id, ...lineData(calculate(employee, workspace, run, inputs), inputs) } });
    }
  });
}

/** Cuando cambia el haber o el ingreso de alguien, sus filas en borrador se recalculan. */
export async function recalcDraftLinesFor(workspace: BusinessWorkspace, employee: BusinessEmployee) {
  const lines = await prisma.businessPayrollLine.findMany({ where: { employeeId: employee.id, run: { status: "DRAFT", workspaceId: workspace.id } }, include: { run: true } });
  for (const line of lines) {
    const inputs = lineInputs(line);
    await prisma.businessPayrollLine.updateMany({
      where: { id: line.id, run: { is: { status: "DRAFT" } } },
      data: lineData(calculate(employee, workspace, line.run, inputs), inputs),
    });
  }
}
// creado por pato dev y askforvini
