import type { Metadata } from "next";
import { Clock, Download } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs, Empty } from "@/components/business/ui";
import { formatDate } from "@/lib/business/format";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { AttendanceTable } from "@/components/business/AttendanceTable";
import { AttendanceActions } from "@/components/business/AttendanceActions";

export const metadata: Metadata = { title: "Fichaje" };
export const dynamic = "force-dynamic";

export default async function AttendancePage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "employees.view");
  const today = todayIn(latamCountry(ctx.workspace.country).timezone);
  const todayDate = new Date(today + "T00:00:00Z");

  // Obtener registros de hoy
  const todayRecords = await prisma.businessAttendance.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      date: todayDate,
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
    orderBy: { checkInTime: "asc" },
  });

  // Obtener empleados activos para el dropdown
  const employees = await prisma.businessEmployee.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      status: "ACTIVE",
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
    },
  });

  return (
    <AppPage
      kicker={ctx.workspace.name}
      title="Fichaje"
      tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="fichaje" />}
      actions={
        ctx.can("employees.view") ? (
          <ButtonLink href={`/business/${ctx.workspace.slug}/fichaje/historico`} size="sm">
            <Download className="h-4 w-4" aria-hidden />
            Histórico
          </ButtonLink>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Sección de acciones rápidas */}
        <div className="mv-panel p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Registrar Asistencia</h3>
          <AttendanceActions
            workspaceSlug={ctx.workspace.slug}
            employees={employees.map((e) => ({
              ...e,
              position: e.position ?? undefined,
            }))}
            todayRecords={todayRecords.map((r) => ({
              id: r.id,
              employeeId: r.employeeId,
              checkOutTime: r.checkOutTime?.toISOString() ?? null,
            }))}
          />
        </div>

        {/* Tabla de registros de hoy */}
        <div className="mv-panel">
          <div className="border-b border-[var(--mv-hairline)] px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Clock className="h-4 w-4" aria-hidden />
              Registros de {formatDate(todayDate)}
            </h3>
          </div>
          {todayRecords.length > 0 ? (
            <AttendanceTable
              records={todayRecords.map((r) => ({
                ...r,
                checkInTime: r.checkInTime.toISOString(),
                checkOutTime: r.checkOutTime?.toISOString() ?? null,
                notes: r.notes ?? undefined,
                employee: {
                  ...r.employee,
                  position: r.employee.position ?? undefined,
                },
              }))}
              workspaceSlug={ctx.workspace.slug}
              readonly={!ctx.can("employees.edit")}
            />
          ) : (
            <div className="p-5">
              <Empty title="Sin registros de asistencia">
                No hay fichajas registradas para hoy aún.
              </Empty>
            </div>
          )}
        </div>
      </div>
    </AppPage>
  );
}
