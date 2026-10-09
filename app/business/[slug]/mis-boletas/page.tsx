import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs, Empty } from "@/components/business/ui";
import { PayslipButton } from "@/components/business/PayslipButton";
import { toLineView } from "@/lib/business/payroll-view";
import { toPayslipLine } from "@/lib/business/payslip-line";
import { periodLabel } from "@/lib/business/format";
import { formatMoney } from "@/lib/geo/latam";

export const metadata: Metadata = { title: "Mis boletas" };
export const dynamic = "force-dynamic";

/** Boletas de la persona: solo planillas cerradas y solo su fila. */
export default async function MyPayslipsPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug);
  const { workspace } = ctx;
  const lines = ctx.employee
    ? await prisma.businessPayrollLine.findMany({
        where: { employeeId: ctx.employee.id, run: { workspaceId: workspace.id, status: "CLOSED" } },
        include: { employee: true, run: true },
        orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }],
      })
    : [];
  const ws = { name: workspace.name, legalName: workspace.legalName, nit: workspace.nit, country: workspace.country, currency: workspace.currency };

  return (
    <AppPage kicker={workspace.name} title="Mis boletas" tabs={<BusinessTabs slug={workspace.slug} role={ctx.role} active="boletas" />}>
      {lines.length ? (
        <ul className="mv-panel divide-y divide-[var(--mv-hairline)] p-1">
          {lines.map((l) => {
            const view = toPayslipLine(toLineView(l, true));
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{periodLabel(l.run.year, l.run.month)}</span>
                  <span className="block text-xs text-[var(--text-secondary)]">Líquido {formatMoney(view.result.netPay, workspace.country, workspace.currency)}</span>
                </span>
                <PayslipButton line={view} year={l.run.year} month={l.run.month} workspace={ws} />
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="Todavía no hay boletas">{ctx.employee ? "Aparecen cuando RR.HH. cierra la planilla del mes." : "Tu cuenta no está vinculada a un legajo. Pedile a RR.HH. que te invite desde tu ficha."}</Empty>
      )}
    </AppPage>
  );
}
// creado por pato dev y askforvini
