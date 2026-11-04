import type { Metadata } from "next";
import { ArrowLeft } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs, Empty } from "@/components/business/ui";
import { AttendanceHistoricTable } from "@/components/business/AttendanceHistoricTable";

export const metadata: Metadata = { title: "Histórico de Fichaje" };
export const dynamic = "force-dynamic";

export default async function AttendanceHistoricPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.view");

  // Obtener todos los registros de asistencia (últimos 90 días)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const records = await prisma.businessAttendance.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      date: {
        gte: ninetyDaysAgo,
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Obtener empleados únicos para filtros
  const employees = await prisma.businessEmployee.findMany({
    where: {
      workspaceId: ctx.workspace.id,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Histórico de Fichaje"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="fichaje" />}
      actions={
        <ButtonLink href={`/business/${ctx.workspace.slug}/fichaje`} size="sm">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </ButtonLink>
      }
    >
      <div className="mv-panel">
        {records.length > 0 ? (
          <AttendanceHistoricTable
            records={records.map((r) => ({
              ...r,
              date: r.date.toISOString(),
              checkInTime: r.checkInTime.toISOString(),
              checkOutTime: r.checkOutTime?.toISOString() ?? null,
              notes: r.notes ?? undefined,
              employee: {
                ...r.employee,
                position: r.employee.position ?? undefined,
              },
            }))}
            employees={employees}
            workspaceSlug={ctx.workspace.slug}
          />
        ) : (
          <div className="p-5">
            <Empty title="Sin histórico de asistencia">
              No hay registros de asistencia en los últimos 90 días.
            </Empty>
          </div>
        )}
      </div>
    </AppPage>
  );
}
