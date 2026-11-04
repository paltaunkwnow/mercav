import type { Metadata } from "next";
import { Plus } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs } from "@/components/business/ui";
import { ExpenseList } from "@/components/business/ExpenseList";
import { ExpenseStats } from "@/components/business/ExpenseStats";

export const metadata: Metadata = { title: "Gastos" };
export const dynamic = "force-dynamic";

export default async function ExpensesPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "expenses.view");

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const expenses = await prisma.businessExpense.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Gastos"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="gastos" />}
      actions={
        ctx.can("expenses.manage") ? (
          <ButtonLink href={`/business/${ctx.workspace.slug}/gastos/nuevo`} size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            Agregar gasto
          </ButtonLink>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseList
            slug={ctx.workspace.slug}
            expenses={expenses.map((e) => ({
              id: e.id,
              date: e.date,
              category: e.category,
              amount: Number(e.amount),
              description: e.description,
              receipt: e.receipt,
            }))}
            currency={ctx.workspace.currency}
          />
        </div>
        <div>
          <ExpenseStats
            total={total}
            byCategory={byCategory}
            currency={ctx.workspace.currency}
            country={ctx.workspace.country}
          />
        </div>
      </div>
    </AppPage>
  );
}
