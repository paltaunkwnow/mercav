import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock, PencilLine } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs, Empty, Notice } from "@/components/business/ui";
import { NewPayrollForm } from "@/components/business/NewPayrollForm";
import { periodLabel } from "@/lib/business/format";
import { countryName, payrollSupported } from "@/lib/business/countries";
import { formatMoney, latamCountry, todayIn } from "@/lib/geo/latam";
import { PAYROLL_YEARS } from "@/lib/business/bolivia/params";

export const metadata: Metadata = { title: "Planillas" };
export const dynamic = "force-dynamic";

export default async function PayrollListPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "payroll.view");
  const { workspace } = ctx;
  const today = todayIn(latamCountry(workspace.country).timezone);
  const runs = await prisma.businessPayrollRun.findMany({ where: { workspaceId: workspace.id }, orderBy: [{ year: "desc" }, { month: "desc" }] });
  const totals = runs.length
    ? await prisma.businessPayrollLine.groupBy({ by: ["runId"], where: { runId: { in: runs.map((r) => r.id) } }, _sum: { netPay: true, employerCost: true }, _count: true })
    : [];
  const byRun = new Map(totals.map((t) => [t.runId, t]));
  const supported = payrollSupported(workspace.country);

  return (
    <AppPage kicker={workspace.name} title="Planillas" tabs={<BusinessTabs slug={workspace.slug} role={ctx.role} active="planillas" />}>
      {supported ? (
        ctx.can("payroll.edit") ? (
          <div className="mb-6">
            <NewPayrollForm slug={workspace.slug} defaultYear={Number(today.slice(0, 4))} defaultMonth={Number(today.slice(5, 7))} years={PAYROLL_YEARS} />
          </div>
        ) : null
      ) : (
        <Notice className="mb-6">La planilla automática todavía no está disponible para {countryName(workspace.country)}.</Notice>
      )}

      {runs.length ? (
        <ul className="mv-panel divide-y divide-[var(--mv-hairline)] p-1">
          {runs.map((run) => {
            const t = byRun.get(run.id);
            return (
              <li key={run.id}>
                <Link href={`/business/${workspace.slug}/planillas/${run.id}`} className="mv-focus flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[var(--mv-panel-hover)]">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${run.status === "CLOSED" ? "bg-gold/10 text-gold" : "bg-[var(--mv-panel-hover)] text-[var(--text-secondary)]"}`}>
                    {run.status === "CLOSED" ? <Lock className="h-4 w-4" aria-hidden /> : <PencilLine className="h-4 w-4" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{periodLabel(run.year, run.month)}</span>
                    <span className="block text-xs text-[var(--text-secondary)]">
                      {run.status === "CLOSED" ? "Cerrada" : "Borrador"} · {t?._count ?? 0} trabajadores
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatMoney(Number(t?._sum.netPay ?? 0), workspace.country, workspace.currency)}</span>
                    <span className="block text-xs text-[var(--text-secondary)]">líquido</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="Todavía no hay planillas">Elegí el mes y creá la primera. Se arma sola con tus trabajadores activos.</Empty>
      )}
    </AppPage>
  );
}
// creado por pato dev y askforvini
