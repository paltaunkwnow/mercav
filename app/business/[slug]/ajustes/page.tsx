import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs } from "@/components/business/ui";
import { CompanyForm, TeamSettings } from "@/components/business/WorkspaceSettings";
import type { BusinessRoleKey } from "@/lib/business/permissions";

export const metadata: Metadata = { title: "Ajustes de la empresa" };
export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug);
  if (!ctx.can("workspace.edit") && !ctx.can("members.manage")) notFound();
  const { workspace } = ctx;
  const [members, invites] = await Promise.all([
    prisma.businessMember.findMany({ where: { workspaceId: workspace.id }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
    ctx.can("invites.manage")
      ? prisma.businessInvite.findMany({
          where: { workspaceId: workspace.id, usedAt: null, expiresAt: { gt: new Date() } },
          include: { employee: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return (
    <AppPage kicker={workspace.name} title="Ajustes" tabs={<BusinessTabs slug={workspace.slug} role={ctx.role} active="ajustes" />} width="wide">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <CompanyForm
          workspace={{ slug: workspace.slug, name: workspace.name, legalName: workspace.legalName, nit: workspace.nit, country: workspace.country, region: workspace.region, city: workspace.city, productive: workspace.productive }}
          canEdit={ctx.can("workspace.edit")}
        />
        <TeamSettings
          slug={workspace.slug}
          workspaceName={workspace.name}
          members={members.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role as BusinessRoleKey, isMe: m.userId === ctx.userId }))}
          invites={invites.map((i) => ({
            id: i.id,
            role: i.role as BusinessRoleKey,
            employeeName: i.employee ? `${i.employee.firstName} ${i.employee.lastName}` : null,
            email: i.email,
            expiresAt: i.expiresAt.toISOString(),
          }))}
          canManageMembers={ctx.can("members.manage")}
          canInvite={ctx.can("invites.manage")}
          isOwner={ctx.role === "OWNER"}
        />
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
