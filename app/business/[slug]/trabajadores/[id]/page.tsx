import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { toEmployeeView } from "@/lib/business/employees";
import { AppPage } from "@/components/app-shell/AppPage";
import { EmployeeForm } from "@/components/business/EmployeeForm";
import { EmployeeActions } from "@/components/business/EmployeeActions";
import { Notice } from "@/components/business/ui";
import { CONTRACT_LABELS, formatDate } from "@/lib/business/format";
import { serviceYears } from "@/lib/business/bolivia/seniority";
import { formatMoney, latamCountry, todayIn } from "@/lib/geo/latam";
import { idLabels } from "@/lib/business/countries";

export const metadata: Metadata = { title: "Legajo" };
export const dynamic = "force-dynamic";

export default async function EmployeePage({ params }: { params: { slug: string; id: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.view");
  const row = await prisma.businessEmployee.findFirst({ where: { id: params.id, workspaceId: ctx.workspace.id } });
  if (!row) notFound();
  const employee = toEmployeeView(row, ctx.can("employees.viewSensitive"));
  const today = todayIn(latamCountry(ctx.workspace.country).timezone);
  const years = serviceYears(employee.hireDate, employee.endDate ?? today);
  const back = { href: `/business/${ctx.workspace.slug}/trabajadores`, label: "Trabajadores" };
  const lead = [employee.position, `Ingreso ${formatDate(employee.hireDate)}`, `${years} ${years === 1 ? "año" : "años"} de antigüedad`, CONTRACT_LABELS[employee.contractType]]
    .filter(Boolean)
    .join(" · ");

  if (!ctx.can("employees.edit")) {
    const labels = idLabels(ctx.workspace.country);
    const s = employee.sensitive;
    const rows: [string, string | null][] = [
      ["Cargo", employee.position],
      ["Contrato", CONTRACT_LABELS[employee.contractType]],
      ...(s
        ? ([
            ["Haber básico", formatMoney(s.baseSalary, ctx.workspace.country, ctx.workspace.currency)],
            [labels.document, [s.ci, s.ciExt].filter(Boolean).join(" ") || null],
            ["Correo", s.email],
            ["Teléfono", s.phone],
            [labels.pension, s.nua],
            [labels.health, s.cnsNumber],
            ["Banco", s.bankName],
            ["Cuenta", s.bankAccount],
          ] as [string, string | null][])
        : []),
    ];
    return (
      <AppPage kicker={ctx.workspace.name} title={`${employee.firstName} ${employee.lastName}`} lead={lead} back={back}>
        {!s ? <Notice className="mb-6">Tu rol ve el directorio sin salarios ni datos personales.</Notice> : null}
        <dl className="mv-panel max-w-xl divide-y divide-[var(--mv-hairline)] px-5 py-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
              <dd className="text-right text-sm font-semibold text-[var(--text-primary)]">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </AppPage>
    );
  }

  return (
    <AppPage kicker={ctx.workspace.name} title={`${employee.firstName} ${employee.lastName}`} lead={lead} back={back} width="wide">
      {employee.status === "INACTIVE" ? <Notice tone="warn" className="mb-6">De baja desde el {formatDate(employee.endDate)}.</Notice> : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <EmployeeForm slug={ctx.workspace.slug} country={ctx.workspace.country} employee={employee} />
        <EmployeeActions
          slug={ctx.workspace.slug}
          employeeId={employee.id}
          status={employee.status}
          linked={employee.linked}
          canInvite={ctx.can("invites.manage")}
          name={employee.firstName}
          workspaceName={ctx.workspace.name}
        />
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
