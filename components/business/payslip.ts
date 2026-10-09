import { downloadBrandedPdf, safeFileName, type PdfBlock } from "@/app/herramientas/pdf";
import type { PayslipLine } from "@/lib/business/payslip-line";
import { formatMoney } from "@/lib/geo/latam";
import { formatDate, periodLabel } from "@/lib/business/format";
import { idLabels } from "@/lib/business/countries";

/** Boleta de pago en PDF, en el navegador. */
export async function downloadPayslip(opts: {
  line: PayslipLine;
  year: number;
  month: number;
  workspace: { name: string; legalName: string | null; nit: string | null; country: string; currency: string };
  draft?: boolean;
}) {
  const { line, year, month, workspace } = opts;
  const m = (v: number) => formatMoney(v, workspace.country, workspace.currency);
  const r = line.result;
  const e = line.employee;
  const labels = idLabels(workspace.country);
  const blocks: PdfBlock[] = [
    {
      type: "rows",
      rows: [
        ["Empresa", [workspace.legalName || workspace.name, workspace.nit ? `NIT ${workspace.nit}` : null].filter(Boolean).join(" · ")],
        ["Trabajador", `${e.lastName} ${e.firstName}`],
        [labels.document, [e.ci, e.ciExt].filter(Boolean).join(" ") || "—"],
        ["Cargo", e.position ?? "—"],
        ["Fecha de ingreso", formatDate(e.hireDate)],
        ["Días pagados", String(line.inputs.daysWorked)],
      ],
    },
    { type: "heading", text: "Ingresos" },
    {
      type: "rows",
      rows: [
        ["Haber básico", m(r.earned.basic)],
        [`Bono de antigüedad (${Math.round(r.seniorityRate * 100)} %, ${r.serviceYears} años)`, m(r.earned.seniority)],
        [`Horas extra (${line.inputs.overtimeHours} h)`, m(r.earned.overtime)],
        ["Dominicales y feriados", m(r.earned.sundayHoliday)],
        ["Otros bonos", m(r.earned.otherBonuses)],
        ["Total ganado", m(r.earned.total)],
      ],
    },
    { type: "heading", text: "Descuentos" },
    {
      type: "rows",
      rows: [
        ["Gestora 12,71 %", m(r.deductions.gestora.total)],
        ["Aporte Nacional Solidario", m(r.deductions.ans)],
        ["RC-IVA", m(r.deductions.rciva.retained)],
        ["Anticipos", m(r.deductions.advances)],
        ["Otros descuentos", m(r.deductions.otherDeductions)],
        ["Total descuentos", m(r.deductions.total)],
      ],
    },
    { type: "highlight", label: "Líquido pagable", value: m(r.netPay) },
    ...(opts.draft ? [{ type: "notice", text: "Borrador: esta planilla todavía no está cerrada." } as PdfBlock] : []),
    { type: "spacer", size: 18 },
    { type: "rows", rows: [["Firma del trabajador", "______________________________"]] },
  ];
  await downloadBrandedPdf({
    toolName: "Mercav Business",
    title: "Boleta de pago",
    subtitle: periodLabel(year, month),
    blocks,
    fileName: `boleta-${safeFileName(`${e.lastName}-${e.firstName}`)}-${year}-${String(month).padStart(2, "0")}`,
    footer: "Generado con Mercav Business · app.mercav.lat",
  });
}
// creado por pato dev y askforvini
