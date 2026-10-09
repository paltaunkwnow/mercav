import type { PayrollParams } from "./params";

/** Años completos de servicio entre la fecha de ingreso y la de referencia (ambas yyyy-mm-dd). */
export function serviceYears(hireDate: string, refDate: string) {
  const [hy, hm, hd] = hireDate.slice(0, 10).split("-").map(Number);
  const [ry, rm, rd] = refDate.slice(0, 10).split("-").map(Number);
  let years = ry - hy;
  if (rm < hm || (rm === hm && rd < hd)) years -= 1;
  return Math.max(0, years);
}

export function seniorityRate(years: number, params: PayrollParams) {
  let rate = 0;
  for (const step of params.seniority.table) if (years >= step.fromYears) rate = step.rate;
  return rate;
}

/** Último día del mes (yyyy-mm-dd). month es 1-12. */
export function lastDayOfMonth(year: number, month: number) {
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
// creado por pato dev y askforvini
