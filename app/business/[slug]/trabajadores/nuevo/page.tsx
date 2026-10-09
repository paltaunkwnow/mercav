import type { Metadata } from "next";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { EmployeeForm } from "@/components/business/EmployeeForm";

export const metadata: Metadata = { title: "Agregar trabajador" };
export const dynamic = "force-dynamic";

export default async function NewEmployeePage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.edit");
  return (
    <AppPage kicker={ctx.workspace.name} title="Agregar trabajador" back={{ href: `/business/${ctx.workspace.slug}/trabajadores`, label: "Trabajadores" }} width="narrow">
      <EmployeeForm slug={ctx.workspace.slug} country={ctx.workspace.country} />
    </AppPage>
  );
}
// creado por pato dev y askforvini
