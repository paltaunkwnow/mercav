import type { Metadata } from "next";
import { Clock, Plus } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs } from "@/components/business/ui";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { ShiftsCalendar } from "@/components/business/ShiftsCalendar";

export const metadata: Metadata = { title: "Turnos" };
export const dynamic = "force-dynamic";

export default async function ShiftsPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.view");
  const today = todayIn(latamCountry(ctx.workspace.country).timezone);
  const todayDate = new Date(today + "T00:00:00Z");

  // Get all employees
  const employees = await prisma.businessEmployee.findMany({
    where: { workspaceId: ctx.workspace.id, status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Get shifts for current month
  const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const lastDay = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);

  const shifts = await prisma.businessShift.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      date: {
        gte: firstDay,
        lte: lastDay,
      },
    },
    include: {
      employee: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Turnos"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="turnos" />}
      actions={
        ctx.can("employees.edit") ? (
          <ButtonLink href={`/business/${ctx.workspace.slug}/turnos/nuevo`} size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            Agregar Turno
          </ButtonLink>
        ) : null
      }
    >
      <ShiftsCalendar
        slug={ctx.workspace.slug}
        employees={employees}
        shifts={shifts}
        canEdit={ctx.can("employees.edit")}
        today={todayDate}
      />
    </AppPage>
  );
}
// creado por pato dev y askforvini
