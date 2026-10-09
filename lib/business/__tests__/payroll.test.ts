import { test } from "node:test";
import assert from "node:assert/strict";
import { computePayrollLine, nationalSolidarity, r2, sumResults, type PayrollInput } from "../bolivia/payroll";
import { PARAMS_2026, paramsForYear } from "../bolivia/params";
import { serviceYears, seniorityRate } from "../bolivia/seniority";

const base: PayrollInput = {
  baseSalary: 5000,
  hireDate: "2020-03-15",
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
};

test("redondeo a centavos mitad hacia arriba", () => {
  assert.equal(r2(26.815), 26.82);
  assert.equal(r2(187.705), 187.71);
  assert.equal(r2(1.004), 1);
  assert.equal(r2(-2.345), -2.35);
});

test("ejemplo completo: Bs 5.000, 6 años, empresa de servicios", () => {
  const r = computePayrollLine(base, PARAMS_2026);
  assert.equal(r.serviceYears, 6);
  assert.equal(r.seniorityRate, 0.11);
  assert.equal(r.earned.seniority, 363);
  assert.equal(r.earned.total, 5363);
  assert.deepEqual(r.deductions.gestora, { vejez: 536.3, riesgoComun: 91.71, comision: 26.82, solidario: 26.82, total: 681.65 });
  assert.equal(r.deductions.ans, 0);
  assert.equal(r.deductions.rciva.retained, 0);
  assert.equal(r.deductions.total, 681.65);
  assert.equal(r.netPay, 4681.35);
  assert.deepEqual(r.employer, { cns: 536.3, riesgoProfesional: 91.71, patronalSolidario: 187.71, vivienda: 107.26, total: 922.98 });
  assert.equal(r.provisions.total, 893.84);
  assert.equal(r.employerCost, 7179.82);
});

test("horas extra, Aporte Nacional Solidario y RC-IVA con facturas", () => {
  const r = computePayrollLine({ ...base, baseSalary: 20000, hireDate: "2026-01-10", overtimeHours: 10, rcivaCredit: 1000 }, PARAMS_2026);
  assert.equal(r.earned.overtime, 1666.67);
  assert.equal(r.earned.total, 21666.67);
  assert.equal(r.deductions.gestora.total, 2753.83);
  assert.equal(r.deductions.ans, 99.67);
  assert.equal(r.deductions.rciva.net, 18813.17);
  assert.equal(r.deductions.rciva.tax, 1587.71);
  assert.equal(r.deductions.rciva.smnCredit, 858);
  assert.equal(r.deductions.rciva.invoiceCredit, 130);
  assert.equal(r.deductions.rciva.retained, 599.71);
  assert.equal(r.deductions.rciva.saldoAFavor, 0);
  assert.equal(r.netPay, 18213.46);
});

test("RC-IVA: sin impuesto hasta 4 SMN de sueldo neto y saldo a favor con facturas de más", () => {
  const low = computePayrollLine({ ...base, baseSalary: 12000, hireDate: "2026-01-01" }, PARAMS_2026);
  assert.equal(low.deductions.rciva.retained, 0);
  const withInvoices = computePayrollLine({ ...base, baseSalary: 20000, hireDate: "2026-01-10", rcivaCredit: 10000 }, PARAMS_2026);
  assert.equal(withInvoices.deductions.rciva.retained, 0);
  assert.ok(withInvoices.deductions.rciva.saldoAFavor > 0);
});

test("tramos del Aporte Nacional Solidario (Ley 1582)", () => {
  assert.equal(nationalSolidarity(13000, PARAMS_2026), 0);
  assert.equal(nationalSolidarity(25000, PARAMS_2026), 138);
  assert.equal(nationalSolidarity(40000, PARAMS_2026), 1745.5);
});

test("antigüedad: bordes de la escala y base productiva", () => {
  assert.equal(serviceYears("2024-11-15", "2026-10-31"), 1);
  assert.equal(seniorityRate(1, PARAMS_2026), 0);
  assert.equal(serviceYears("2024-10-31", "2026-10-31"), 2);
  assert.equal(seniorityRate(2, PARAMS_2026), 0.05);
  assert.equal(seniorityRate(25, PARAMS_2026), 0.5);
  const productive = computePayrollLine({ ...base, hireDate: "2024-10-31", productive: true }, PARAMS_2026);
  assert.equal(productive.earned.seniority, 495);
  const services = computePayrollLine({ ...base, hireDate: "2024-10-31" }, PARAMS_2026);
  assert.equal(services.earned.seniority, 165);
});

test("días trabajados proporcionales y entradas inválidas", () => {
  const half = computePayrollLine({ ...base, daysWorked: 15, hireDate: "2026-01-01" }, PARAMS_2026);
  assert.equal(half.earned.basic, 2500);
  const weird = computePayrollLine({ ...base, daysWorked: 45, overtimeHours: -3, otherBonuses: Number.NaN, hireDate: "2026-01-01" }, PARAMS_2026);
  assert.equal(weird.earned.basic, 5000);
  assert.equal(weird.earned.overtime, 0);
  assert.equal(weird.earned.otherBonuses, 0);
});

test("domingos o feriados trabajados se pagan con dos jornales extra", () => {
  const r = computePayrollLine({ ...base, sundayHolidayDays: 1, hireDate: "2026-01-01" }, PARAMS_2026);
  assert.equal(r.earned.sundayHoliday, 333.33);
});

test("si los descuentos superan lo ganado, el líquido queda en 0 y se avisa", () => {
  const r = computePayrollLine({ ...base, advances: 99999, hireDate: "2026-01-01" }, PARAMS_2026);
  assert.equal(r.netPay, 0);
  assert.equal(r.netCapped, true);
});

test("totales de la planilla y parámetros por año", () => {
  const a = computePayrollLine(base, PARAMS_2026);
  const b = computePayrollLine({ ...base, baseSalary: 20000, hireDate: "2026-01-10", overtimeHours: 10, rcivaCredit: 1000 }, PARAMS_2026);
  const t = sumResults([a, b]);
  assert.equal(t.netPay, r2(4681.35 + 18213.46));
  assert.equal(paramsForYear(2026).smn, 3300);
  assert.equal(paramsForYear(2027).year, 2027);
});
// creado por pato dev y askforvini
