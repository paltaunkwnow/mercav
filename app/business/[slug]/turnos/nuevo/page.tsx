import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs } from "@/components/business/ui";
import { ShiftForm } from "@/components/business/ShiftForm";

export const metadata: Metadata = { title: "Agregar Turno" };
export const dynamic = "force-dynamic";

export default async function NewShiftPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.edit");

  // Get all active employees
  const employees = await prisma.businessEmployee.findMany({
    where: { workspaceId: ctx.workspace.id, status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  if (employees.length === 0) {
    return (
      <AppPage
        kicker={ctx.workspace.name}
        title="Agregar Turno"
        tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="turnos" />}
      >
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No hay empleados activos para asignar turnos. Primero agrega empleados.
          </p>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Agregar Turno"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="turnos" />}
    >
      <div className="max-w-2xl">
        <ShiftForm
          slug={ctx.workspace.slug}
          employees={employees.map((e) => ({
            id: e.id,
            name: `${e.lastName} ${e.firstName}`.trim(),
          }))}
          mode="create"
        />
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
