import type { PayrollParams } from "./params";
import { lastDayOfMonth, seniorityRate, serviceYears } from "./seniority";

/**
 * Cálculo de una fila de planilla de sueldos de Bolivia. Función pura: mismas entradas, mismo
 * resultado. Cada monto se redondea a centavos; los totales suman los montos ya redondeados para
 * que la planilla cuadre al centavo.
 */

export type PayrollInput = {
  baseSalary: number;
  /** yyyy-mm-dd */
  hireDate: string;
  productive: boolean;
  year: number;
  /** 1-12 */
  month: number;
  daysWorked: number;
  overtimeHours: number;
  sundayHolidayDays: number;
  otherBonuses: number;
  advances: number;
  otherDeductions: number;
  /** Total en Bs de las facturas presentadas en el Formulario 110. */
  rcivaCredit: number;
};

export type PayrollResult = {
  serviceYears: number;
  seniorityRate: number;
  rates: { daily: number; hourly: number };
  earned: { basic: number; seniority: number; overtime: number; sundayHoliday: number; otherBonuses: number; total: number };
  deductions: {
    gestora: { vejez: number; riesgoComun: number; comision: number; solidario: number; total: number };
    ans: number;
    rciva: { net: number; taxable: number; tax: number; smnCredit: number; invoiceCredit: number; retained: number; saldoAFavor: number };
    advances: number;
    otherDeductions: number;
    total: number;
  };
  netPay: number;
  /** Los descuentos superaban lo ganado: el líquido se dejó en 0. */
  netCapped: boolean;
  employer: { cns: number; riesgoProfesional: number; patronalSolidario: number; vivienda: number; total: number };
  provisions: { aguinaldo: number; indemnizacion: number; total: number };
  employerCost: number;
};

/**
 * Redondeo a centavos, mitad hacia arriba. El 1e-6 absorbe el error de punto flotante
 * (26,815 se guarda como 26,81499…) sin mover montos que de verdad están por debajo de la mitad.
 */
export function r2(value: number) {
  const n = Math.round(Math.abs(value) * 100 + 1e-6) / 100;
  return value < 0 ? -n : n;
}

function nonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function sum(...values: number[]) {
  return r2(values.reduce((acc, v) => acc + v, 0));
}

/** Aporte Nacional Solidario: cada tramo cobra su porcentaje sobre lo que excede su umbral. */
export function nationalSolidarity(totalEarned: number, params: PayrollParams) {
  return sum(...params.ans.map((tier) => (totalEarned > tier.over ? r2((totalEarned - tier.over) * tier.rate) : 0)));
}

export function computePayrollLine(input: PayrollInput, params: PayrollParams): PayrollResult {
  const base = nonNegative(input.baseSalary);
  const days = Math.min(params.monthDays, Math.max(0, Math.round(Number.isFinite(input.daysWorked) ? input.daysWorked : 0)));
  const daily = base / params.monthDays;
  const hourly = base / params.monthHours;

  const refDate = lastDayOfMonth(input.year, input.month);
  const years = serviceYears(input.hireDate, refDate);
  const rate = seniorityRate(years, params);
  const seniorityBase = params.smn * (input.productive ? params.seniority.baseSmnProductive : params.seniority.baseSmnServices);

  const earnedBasic = r2(daily * days);
  const earnedSeniority = r2(seniorityBase * rate);
  const overtime = r2(nonNegative(input.overtimeHours) * hourly * (1 + params.overtimeSurcharge));
  const sundayHoliday = r2(nonNegative(input.sundayHolidayDays) * daily * params.sundayHolidayExtraDays);
  const otherBonuses = r2(nonNegative(input.otherBonuses));
  const totalEarned = sum(earnedBasic, earnedSeniority, overtime, sundayHoliday, otherBonuses);

  const contributionBase = params.gestora.capSmn ? Math.min(totalEarned, params.gestora.capSmn * params.smn) : totalEarned;
  const vejez = r2(contributionBase * params.gestora.vejez);
  const riesgoComun = r2(contributionBase * params.gestora.riesgoComun);
  const comision = r2(contributionBase * params.gestora.comision);
  const solidario = r2(contributionBase * params.gestora.solidario);
  const gestoraTotal = sum(vejez, riesgoComun, comision, solidario);
  const ans = nationalSolidarity(totalEarned, params);

  const net = r2(totalEarned - gestoraTotal - ans);
  const minimum = params.rciva.minimumSmn * params.smn;
  const taxable = r2(Math.max(0, net - minimum));
  const tax = r2(taxable * params.rciva.rate);
  const smnCredit = r2(minimum * params.rciva.rate);
  const invoiceCredit = r2(nonNegative(input.rcivaCredit) * params.rciva.rate);
  const afterSmn = r2(Math.max(0, tax - smnCredit));
  const retained = r2(Math.max(0, afterSmn - invoiceCredit));
  const saldoAFavor = r2(Math.max(0, invoiceCredit - afterSmn));

  const advances = r2(nonNegative(input.advances));
  const otherDeductions = r2(nonNegative(input.otherDeductions));
  const totalDeductions = sum(gestoraTotal, ans, retained, advances, otherDeductions);
  const rawNet = r2(totalEarned - totalDeductions);

  const cns = r2(totalEarned * params.employer.cns);
  const riesgoProfesional = r2(totalEarned * params.employer.riesgoProfesional);
  const patronalSolidario = r2(totalEarned * params.employer.patronalSolidario);
  const vivienda = r2(totalEarned * params.employer.vivienda);
  const employerTotal = sum(cns, riesgoProfesional, patronalSolidario, vivienda);
  const aguinaldo = r2(totalEarned * params.provisions.aguinaldo);
  const indemnizacion = r2(totalEarned * params.provisions.indemnizacion);
  const provisionsTotal = sum(aguinaldo, indemnizacion);

  return {
    serviceYears: years,
    seniorityRate: rate,
    rates: { daily: r2(daily), hourly: r2(hourly) },
    earned: { basic: earnedBasic, seniority: earnedSeniority, overtime, sundayHoliday, otherBonuses, total: totalEarned },
    deductions: {
      gestora: { vejez, riesgoComun, comision, solidario, total: gestoraTotal },
      ans,
      rciva: { net, taxable, tax, smnCredit, invoiceCredit, retained, saldoAFavor },
      advances,
      otherDeductions,
      total: totalDeductions,
    },
    netPay: Math.max(0, rawNet),
    netCapped: rawNet < 0,
    employer: { cns, riesgoProfesional, patronalSolidario, vivienda, total: employerTotal },
    provisions: { aguinaldo, indemnizacion, total: provisionsTotal },
    employerCost: sum(totalEarned, employerTotal, provisionsTotal),
  };
}

export type PayrollTotals = { totalEarned: number; totalDeductions: number; netPay: number; employerCost: number; employerContributions: number };

export function sumResults(results: PayrollResult[]): PayrollTotals {
  return {
    totalEarned: sum(...results.map((r) => r.earned.total)),
    totalDeductions: sum(...results.map((r) => r.deductions.total)),
    netPay: sum(...results.map((r) => r.netPay)),
    employerCost: sum(...results.map((r) => r.employerCost)),
    employerContributions: sum(...results.map((r) => r.employer.total)),
  };
}
// creado por pato dev y askforvini
