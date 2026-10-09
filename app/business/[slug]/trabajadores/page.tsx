import type { Metadata } from "next";
import { UserPlus } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { toEmployeeView } from "@/lib/business/employees";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs } from "@/components/business/ui";
import { EmployeeList } from "@/components/business/EmployeeList";
import { latamCountry, todayIn } from "@/lib/geo/latam";

export const metadata: Metadata = { title: "Trabajadores" };
export const dynamic = "force-dynamic";

export default async function EmployeesPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.view");
  const rows = await prisma.businessEmployee.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  const employees = rows.map((r) => toEmployeeView(r, ctx.can("employees.viewSensitive")));
  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Trabajadores"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="trabajadores" />}
      actions={
        ctx.can("employees.edit") ? (
          <ButtonLink href={`/business/${ctx.workspace.slug}/trabajadores/nuevo`} size="sm">
            <UserPlus className="h-4 w-4" aria-hidden />
            Agregar
          </ButtonLink>
        ) : null
      }
    >
      <EmployeeList
        slug={ctx.workspace.slug}
        employees={employees}
        country={ctx.workspace.country}
        currency={ctx.workspace.currency}
        today={todayIn(latamCountry(ctx.workspace.country).timezone)}
      />
    </AppPage>
  );
}
// creado por pato dev y askforvini
