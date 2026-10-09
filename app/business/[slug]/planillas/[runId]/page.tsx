import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { PayrollEditor } from "@/components/business/PayrollEditor";
import { toLineView } from "@/lib/business/payroll-view";
import { runParams } from "@/lib/business/payroll-service";
import { periodLabel } from "@/lib/business/format";

export const metadata: Metadata = { title: "Planilla" };
export const dynamic = "force-dynamic";

export default async function PayrollRunPage({ params }: { params: { slug: string; runId: string } }) {
  const ctx = await requireBusiness(params.slug, "payroll.view");
  const run = await prisma.businessPayrollRun.findFirst({
    where: { id: params.runId, workspaceId: ctx.workspace.id },
    include: { lines: { include: { employee: true } } },
  });
  if (!run) notFound();
  const sensitive = ctx.can("employees.viewSensitive");
  const lines = run.lines.map((l) => toLineView(l, sensitive)).sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName, "es"));
  const p = runParams(run);
  const { workspace } = ctx;

  return (
    <AppPage
      kicker={workspace.name}
      title={`Planilla de ${periodLabel(run.year, run.month).toLowerCase()}`}
      back={{ href: `/business/${workspace.slug}/planillas`, label: "Planillas" }}
      width="wide"
    >
      <PayrollEditor
        workspace={{ slug: workspace.slug, name: workspace.name, legalName: workspace.legalName, nit: workspace.nit, country: workspace.country, currency: workspace.currency }}
        run={{ id: run.id, year: run.year, month: run.month, status: run.status, smn: p.smn }}
        initialLines={lines}
        perms={{ edit: ctx.can("payroll.edit"), close: ctx.can("payroll.close"), reopen: ctx.can("payroll.reopen"), export: ctx.can("payroll.export") }}
        verify={p.verify ?? []}
      />
    </AppPage>
  );
}
// creado por pato dev y askforvini
