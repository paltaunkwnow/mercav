import type { PayrollResult } from "./bolivia/payroll";
import type { EmployeeView } from "./employees";
import { formatDate } from "./format";

export type ExportLine = { employee: EmployeeView; result: PayrollResult; daysWorked: number; overtimeHours: number };

/** Hoja 1: planilla de sueldos con las columnas de la planilla mensual del Ministerio de Trabajo. */
export function payrollSheetRows(lines: ExportLine[]) {
  const header = [
    "Nº",
    "CI",
    "Apellidos y nombres",
    "Nacionalidad",
    "Fecha de nacimiento",
    "Sexo",
    "Cargo",
    "Fecha de ingreso",
    "Días pagados",
    "Haber básico",
    "Bono de antigüedad",
    "Horas extra (cantidad)",
    "Horas extra (monto)",
    "Dominicales y feriados",
    "Otros bonos",
    "Total ganado",
    "Gestora 12,71 %",
    "Aporte Nacional Solidario",
    "RC-IVA",
    "Anticipos",
    "Otros descuentos",
    "Total descuentos",
    "Líquido pagable",
  ];
  const rows = lines.map((l, i) => [
    i + 1,
    [l.employee.sensitive?.ci, l.employee.sensitive?.ciExt].filter(Boolean).join(" "),
    l.employee.fullName,
    l.employee.sensitive?.nationality ?? "",
    l.employee.sensitive?.birthDate ? formatDate(l.employee.sensitive.birthDate) : "",
    l.employee.sensitive?.sex ?? "",
    l.employee.position ?? "",
    formatDate(l.employee.hireDate),
    l.daysWorked,
    l.result.earned.basic,
    l.result.earned.seniority,
    l.overtimeHours,
    l.result.earned.overtime,
    l.result.earned.sundayHoliday,
    l.result.earned.otherBonuses,
    l.result.earned.total,
    l.result.deductions.gestora.total,
    l.result.deductions.ans,
    l.result.deductions.rciva.retained,
    l.result.deductions.advances,
    l.result.deductions.otherDeductions,
    l.result.deductions.total,
    l.result.netPay,
  ]);
  const totals = ["", "", "TOTALES", "", "", "", "", "", "", ...[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((col) => sumColumn(rows, col))];
  return [header, ...rows, totals];
}

/** Hoja 2: aportes patronales y provisiones. */
export function employerSheetRows(lines: ExportLine[]) {
  const header = ["Nº", "Apellidos y nombres", "Total ganado", "CNS 10 %", "Riesgo profesional 1,71 %", "Aporte Patronal Solidario 3,5 %", "Pro vivienda 2 %", "Total aportes patronales", "Provisión aguinaldo", "Provisión indemnización", "Costo empresa"];
  const rows = lines.map((l, i) => [
    i + 1,
    l.employee.fullName,
    l.result.earned.total,
    l.result.employer.cns,
    l.result.employer.riesgoProfesional,
    l.result.employer.patronalSolidario,
    l.result.employer.vivienda,
    l.result.employer.total,
    l.result.provisions.aguinaldo,
    l.result.provisions.indemnizacion,
    l.result.employerCost,
  ]);
  const totals = ["", "TOTALES", ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => sumColumn(rows, col))];
  return [header, ...rows, totals];
}

function sumColumn(rows: (string | number)[][], col: number) {
  return Math.round(rows.reduce((acc, r) => acc + (typeof r[col] === "number" ? (r[col] as number) : 0), 0) * 100) / 100;
}
// creado por pato dev y askforvini
