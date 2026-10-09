import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { toLineView } from "@/lib/business/payroll-view";
import { employerSheetRows, payrollSheetRows } from "@/lib/business/export";
import { periodLabel } from "@/lib/business/format";
import { audit } from "@/lib/business/audit";

export async function GET(_req: Request, { params }: { params: { slug: string; runId: string } }) {
  const auth = await apiBusiness(params.slug, "payroll.export");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const run = await prisma.businessPayrollRun.findFirst({
    where: { id: params.runId, workspaceId: ctx.workspace.id },
    include: { lines: { include: { employee: true } } },
  });
  if (!run) return Response.json({ success: false, error: "No encontrado" }, { status: 404 });

  const lines = run.lines
    .map((l) => toLineView(l, true))
    .sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName, "es"))
    .map((l) => ({ employee: l.employee, result: l.result, daysWorked: l.inputs.daysWorked, overtimeHours: l.inputs.overtimeHours }));

  const title = [`${ctx.workspace.legalName || ctx.workspace.name}${ctx.workspace.nit ? ` — NIT ${ctx.workspace.nit}` : ""}`];
  const subtitle = [`Planilla de sueldos y salarios — ${periodLabel(run.year, run.month)}${run.status === "DRAFT" ? " (borrador)" : ""}`];
  const note = ["Pre-planilla generada con Mercav Business. Revisala con tu contador antes de pagar o declarar."];

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([title, subtitle, note, [], ...payrollSheetRows(lines)]);
  sheet["!cols"] = [{ wch: 4 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 20 }, { wch: 12 }, ...Array.from({ length: 15 }, () => ({ wch: 13 }))];
  XLSX.utils.book_append_sheet(wb, sheet, "Planilla");
  const employer = XLSX.utils.aoa_to_sheet([title, [`Aportes patronales — ${periodLabel(run.year, run.month)}`], [], ...employerSheetRows(lines)]);
  employer["!cols"] = [{ wch: 4 }, { wch: 30 }, ...Array.from({ length: 9 }, () => ({ wch: 16 }))];
  XLSX.utils.book_append_sheet(wb, employer, "Aportes patronales");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  await audit(ctx.workspace.id, ctx.userId, "payroll.export", "BusinessPayrollRun", run.id);
  const file = `planilla-${ctx.workspace.slug}-${run.year}-${String(run.month).padStart(2, "0")}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
// creado por pato dev y askforvini
