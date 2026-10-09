import type { BusinessEmployee, BusinessPayrollLine } from "@prisma/client";
import type { PayrollResult } from "./bolivia/payroll";
import { toEmployeeView, type EmployeeView } from "./employees";
import { lineInputs, type LineInputs } from "./payroll-service";

export type PayrollLineView = {
  id: string;
  employee: EmployeeView;
  inputs: LineInputs;
  result: PayrollResult;
};

export function toLineView(line: BusinessPayrollLine & { employee: BusinessEmployee }, withSensitive: boolean): PayrollLineView {
  return {
    id: line.id,
    employee: toEmployeeView(line.employee, withSensitive),
    inputs: lineInputs(line),
    result: line.result as unknown as PayrollResult,
  };
}
// creado por pato dev y askforvini
