import type { PayrollResult } from "./bolivia/payroll";
import type { PayrollLineView } from "./payroll-view";
import type { LineInputs } from "./payroll-service";

/* Solo tipos de servidor: este módulo lo usan componentes de cliente sin arrastrar Prisma ni crypto. */

/** Lo mínimo para una boleta en PDF. Es lo único que recibe el trabajador en "Mis boletas". */
export type PayslipLine = {
  inputs: Pick<LineInputs, "daysWorked" | "overtimeHours">;
  result: PayrollResult;
  employee: { firstName: string; lastName: string; position: string | null; hireDate: string; ci: string | null; ciExt: string | null };
};

export function toPayslipLine(line: PayrollLineView): PayslipLine {
  const e = line.employee;
  return {
    inputs: { daysWorked: line.inputs.daysWorked, overtimeHours: line.inputs.overtimeHours },
    result: line.result,
    employee: { firstName: e.firstName, lastName: e.lastName, position: e.position, hireDate: e.hireDate, ci: e.sensitive?.ci ?? null, ciExt: e.sensitive?.ciExt ?? null },
  };
}
// creado por pato dev y askforvini
