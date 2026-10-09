import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, FileSpreadsheet, Gift, ScanLine, ShoppingCart, UserPlus, Users } from "@/components/icons";
import { posLanding } from "@/lib/business/pos";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs, Empty, Notice, Stat } from "@/components/business/ui";
import { toEmployeeView } from "@/lib/business/employees";
import { CONTRACT_LABELS, formatDate, periodLabel } from "@/lib/business/format";
import { countryName, idLabels, payrollSupported } from "@/lib/business/countries";
import { serviceYears } from "@/lib/business/bolivia/seniority";
import { formatMoney, latamCountry, todayIn } from "@/lib/geo/latam";
import { dayOffEntries } from "@/lib/calendar";
import { ROLE_LABELS } from "@/lib/business/permissions";

export const metadata: Metadata = { title: "Business" };
export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-right text-sm font-semibold text-[var(--text-primary)]">{value ?? "—"}</dd>
    </div>
  );
}

export default async function BusinessOverview({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug);
  const { workspace, role } = ctx;
  const money = (v: number | string) => formatMoney(v, workspace.country, workspace.currency);
  const today = todayIn(latamCountry(workspace.country).timezone);

  // Trabajador: su legajo.
  if (!ctx.can("employees.view")) {
    const me = ctx.employee ? toEmployeeView(ctx.employee, true) : null;
    const labels = idLabels(workspace.country);
    return (
      <AppPage
        kicker={workspace.name}
        title="Mi legajo"
        tabs={<BusinessTabs slug={workspace.slug} role={role} active="resumen" />}
        actions={
          ctx.can("pos.sell") ? (
            <ButtonLink href={`/business/${workspace.slug}/caja`}>
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Abrir la caja
            </ButtonLink>
          ) : undefined
        }
      >
        {me ? (
          <dl className="mv-panel max-w-xl divide-y divide-[var(--mv-hairline)] px-5 py-2">
            <Row label="Nombre" value={`${me.firstName} ${me.lastName}`} />
            <Row label="Cargo" value={me.position} />
            <Row label="Fecha de ingreso" value={formatDate(me.hireDate)} />
            <Row label="Antigüedad" value={`${serviceYears(me.hireDate, today)} años`} />
            <Row label="Contrato" value={CONTRACT_LABELS[me.contractType]} />
            <Row label="Haber básico" value={me.sensitive ? money(me.sensitive.baseSalary) : null} />
            <Row label={labels.document} value={me.sensitive?.ci} />
            <Row label={labels.pension} value={me.sensitive?.nua} />
            <Row label={labels.health} value={me.sensitive?.cnsNumber} />
          </dl>
        ) : (
          <Empty title="Todavía no tenés legajo">Pedile a RR.HH. que vincule tu legajo con tu cuenta.</Empty>
        )}
      </AppPage>
    );
  }

  const [active, inactive, lastClosed, draft, holidays] = await Promise.all([
    prisma.businessEmployee.count({ where: { workspaceId: workspace.id, status: "ACTIVE" } }),
    prisma.businessEmployee.count({ where: { workspaceId: workspace.id, status: "INACTIVE" } }),
    ctx.can("payroll.view")
      ? prisma.businessPayrollRun.findFirst({ where: { workspaceId: workspace.id, status: "CLOSED" }, orderBy: [{ year: "desc" }, { month: "desc" }] })
      : null,
    ctx.can("payroll.view")
      ? prisma.businessPayrollRun.findFirst({ where: { workspaceId: workspace.id, status: "DRAFT" }, orderBy: [{ year: "desc" }, { month: "desc" }] })
      : null,
    Promise.resolve(
      [...dayOffEntries(Number(today.slice(0, 4)), workspace.country, workspace.region), ...dayOffEntries(Number(today.slice(0, 4)) + 1, workspace.country, workspace.region)]
        .filter((e) => e.date >= today)
        .slice(0, 3),
    ),
  ]);
  const lastTotals = lastClosed
    ? await prisma.businessPayrollLine.aggregate({ where: { runId: lastClosed.id }, _sum: { netPay: true, employerCost: true } })
    : null;

  return (
    <AppPage
      kicker={`Mercav Business · ${ROLE_LABELS[role]}`}
      title={workspace.name}
      lead={[workspace.legalName, workspace.nit ? `NIT ${workspace.nit}` : null, countryName(workspace.country)].filter(Boolean).join(" · ")}
      tabs={<BusinessTabs slug={workspace.slug} role={role} active="resumen" />}
      actions={
        ctx.can("employees.edit") ? (
          <ButtonLink href={`/business/${workspace.slug}/trabajadores/nuevo`} size="sm">
            <UserPlus className="h-4 w-4" aria-hidden />
            Agregar trabajador
          </ButtonLink>
        ) : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Trabajadores activos" value={active} hint={inactive ? `${inactive} dados de baja` : undefined} />
        {ctx.can("payroll.view") ? (
          <>
            <Stat label="Líquido pagado" value={lastTotals ? money(Number(lastTotals._sum.netPay ?? 0)) : "—"} hint={lastClosed ? periodLabel(lastClosed.year, lastClosed.month) : "Sin planillas cerradas"} />
            <Stat label="Costo empresa" value={lastTotals ? money(Number(lastTotals._sum.employerCost ?? 0)) : "—"} hint="Con aportes patronales y provisiones" />
            <Stat label="En borrador" value={draft ? periodLabel(draft.year, draft.month) : "—"} hint={draft ? <Link className="mv-link" href={`/business/${workspace.slug}/planillas/${draft.id}`}>Seguir editando</Link> : "Nada pendiente"} />
          </>
        ) : null}
      </div>

      {!payrollSupported(workspace.country) ? (
        <Notice className="mt-6">
          La planilla automática todavía no está disponible para {countryName(workspace.country)}. Ya podés cargar a tu equipo y sus legajos; te avisamos cuando llegue.
        </Notice>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="biz-actions">
          <h2 id="biz-actions" className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Accesos rápidos
          </h2>
          <ul className="grid gap-2">
            {[
              { href: `/business/${workspace.slug}/trabajadores`, icon: Users, title: "Trabajadores", desc: "Legajos, altas y bajas", show: true },
              { href: `/business/${workspace.slug}/planillas`, icon: FileSpreadsheet, title: "Planillas", desc: "Armá la del mes y exportala", show: ctx.can("payroll.view") && payrollSupported(workspace.country) },
              { href: `/business/${workspace.slug}/fidelizacion`, icon: Gift, title: "Fidelización", desc: "Tarjetas de cliente frecuente con tu marca", show: ctx.can("loyalty.view") },
              { href: `/business/${workspace.slug}/sellar`, icon: ScanLine, title: "Sellar", desc: "Sumá sellos o puntos en el mostrador", show: ctx.can("loyalty.stamp") },
              { href: posLanding(ctx) ?? "", icon: ShoppingCart, title: "Caja", desc: "Vender, inventario y reportes de ventas", show: !!posLanding(ctx) },
              { href: `/business/${workspace.slug}/ajustes`, icon: UserPlus, title: "Invitar a tu equipo", desc: "RR.HH., contador o trabajadores", show: ctx.can("invites.manage") },
            ]
              .filter((a) => a.show)
              .map(({ href, icon: Icon, title, desc }) => (
                <li key={href}>
                  <Link href={href} className="mv-panel mv-panel-interactive mv-focus flex items-center gap-3 p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">{title}</span>
                      <span className="block text-xs text-[var(--text-secondary)]">{desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section aria-labelledby="biz-holidays">
          <h2 id="biz-holidays" className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <CalendarDays className="h-4 w-4 text-gold" aria-hidden />
            Próximos feriados en {countryName(workspace.country)}
          </h2>
          {holidays.length ? (
            <ul className="mv-panel divide-y divide-[var(--mv-hairline)] px-4">
              {holidays.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{h.title}</span>
                  <span className="shrink-0 text-xs text-[var(--text-secondary)]">{formatDate(h.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mv-panel p-4 text-sm text-[var(--text-secondary)]">No encontramos feriados próximos.</p>
          )}
          <Link href="/calendario" className="mv-link mt-2 inline-block text-xs">
            Ver el calendario completo
          </Link>
        </section>
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
