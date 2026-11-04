import type { Metadata } from "next";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs } from "@/components/business/ui";
import { AddExpenseForm } from "@/components/business/AddExpenseForm";

export const metadata: Metadata = { title: "Agregar gasto" };

export default async function NewExpensePage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "expenses.manage");

  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Agregar gasto"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="gastos" />}
    >
      <div className="mx-auto max-w-2xl">
        <AddExpenseForm slug={ctx.workspace.slug} currency={ctx.workspace.currency} />
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
