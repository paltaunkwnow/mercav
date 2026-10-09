import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronRight, FileSpreadsheet, ShieldCheck, Users } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/calendar/server";
import { AppPage } from "@/components/app-shell/AppPage";
import { CreateWorkspaceForm } from "@/components/business/CreateWorkspaceForm";
import { ROLE_LABELS, type BusinessRoleKey } from "@/lib/business/permissions";
import { isLatamCountry, latamCountry } from "@/lib/geo/latam";

export const metadata: Metadata = { title: "Business", description: "Trabajadores, legajos y planillas de sueldo para tu empresa." };
export const dynamic = "force-dynamic";

export default async function BusinessHome({ searchParams }: { searchParams: { nueva?: string } }) {
  const userId = await sessionUserId();
  if (!userId) redirect("/login?callbackUrl=/business");

  const [memberships, user] = await Promise.all([
    prisma.businessMember.findMany({ where: { userId }, include: { workspace: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { countryCode: true } }),
  ]);

  if (memberships.length === 1 && searchParams.nueva !== "1") redirect(`/business/${memberships[0].workspace.slug}`);
  const defaultCountry = isLatamCountry(user?.countryCode) ? user!.countryCode!.toUpperCase() : "BO";

  if (memberships.length > 0 && searchParams.nueva !== "1") {
    return (
      <AppPage kicker="Mercav Business" title="Tus empresas" lead="Elegí con cuál querés trabajar.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {memberships.map((m) => (
            <li key={m.id}>
              <Link href={`/business/${m.workspace.slug}`} className="mv-panel mv-panel-interactive mv-focus flex items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[var(--text-primary)]">{m.workspace.name}</span>
                  <span className="block text-xs text-[var(--text-secondary)]">
                    {ROLE_LABELS[m.role as BusinessRoleKey]} · {latamCountry(m.workspace.country).name}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/business?nueva=1" className="mv-link mt-6 inline-block text-sm">
          Crear otra empresa
        </Link>
      </AppPage>
    );
  }

  return (
    <AppPage
      kicker="Mercav Business"
      title="Tu empresa, en orden"
      lead="Cargá a tu equipo, guardá sus legajos y armá la planilla de sueldos del mes con los descuentos de ley. Para empresas de toda Latinoamérica."
      width="narrow"
      back={memberships.length ? { href: "/business", label: "Tus empresas" } : undefined}
    >
      <ul className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Users, title: "Legajos", desc: "Datos, contrato y antigüedad de cada persona" },
          { icon: FileSpreadsheet, title: "Planillas", desc: "Cálculo mensual y exportación a Excel" },
          { icon: ShieldCheck, title: "Datos protegidos", desc: "Documentos y cuentas cifrados, acceso por rol" },
        ].map(({ icon: Icon, title, desc }) => (
          <li key={title} className="mv-panel flex flex-col gap-2 p-4">
            <Icon className="h-5 w-5 text-gold" aria-hidden />
            <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
            <span className="text-xs leading-snug text-[var(--text-secondary)]">{desc}</span>
          </li>
        ))}
      </ul>
      <h2 className="mb-3 font-display text-xl font-semibold text-[var(--text-primary)]">Crear empresa</h2>
      <CreateWorkspaceForm defaultCountry={defaultCountry} />
    </AppPage>
  );
}
// creado por pato dev y askforvini
