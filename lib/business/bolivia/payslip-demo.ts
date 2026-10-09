import { formatMoney } from "@/lib/geo/latam";
import { computePayrollLine } from "./payroll";
import { PARAMS_2026 } from "./params";

/** Boleta de ejemplo para el sitio público: la portada y /planillas la muestran igual. */
export type PayslipDemo = {
  rows: { label: string; short?: string; value: string; minus?: boolean; strong?: boolean }[];
  net: string;
  gross: string;
  deductions: string;
  note: string;
};

/** Una boleta real del motor de planillas: Bolivia, octubre de 2026, cuatro años de antigüedad. */
export function payslipDemo(): PayslipDemo {
  const r = computePayrollLine(
    {
      baseSalary: 4500,
      hireDate: "2022-06-01",
      productive: false,
      year: 2026,
      month: 10,
      daysWorked: 30,
      overtimeHours: 0,
      sundayHolidayDays: 0,
      otherBonuses: 0,
      advances: 0,
      otherDeductions: 0,
      rcivaCredit: 0,
    },
    PARAMS_2026,
  );
  const bs = (n: number) => formatMoney(n, "BO");
  const pct = (n: number) => `${new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(n * 100)} %`;
  const g = PARAMS_2026.gestora;
  return {
    rows: [
      { label: "Haber básico", value: bs(r.earned.basic) },
      { label: `Bono de antigüedad (${pct(r.seniorityRate)})`, short: `Antigüedad (${pct(r.seniorityRate)})`, value: bs(r.earned.seniority) },
      { label: "Total ganado", value: bs(r.earned.total), strong: true },
      { label: `Aportes a la Gestora (${pct(g.vejez + g.riesgoComun + g.comision + g.solidario)})`, short: `Gestora (${pct(g.vejez + g.riesgoComun + g.comision + g.solidario)})`, value: bs(r.deductions.gestora.total), minus: true },
      { label: "RC-IVA", value: bs(r.deductions.rciva.retained), minus: true },
    ],
    gross: bs(r.earned.total),
    deductions: bs(r.deductions.total),
    net: bs(r.netPay),
    note: `Calculada con las reglas de ${PARAMS_2026.year} (mínimo nacional: ${bs(PARAMS_2026.smn).replace(/,00$/, "")}). El sueldo y la antigüedad son de ejemplo.`,
  };
}

// creado por pato dev y askforvini
