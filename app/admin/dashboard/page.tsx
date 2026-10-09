import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Building2, FileText, ImageOff, Inbox, Mail, UserPlus } from "@/components/icons";
import Link from "next/link";

import { AdminUserActions, AdminPostActions, AdminCompanyActions, GlobalSettingsForm } from "@/components/admin/AdminControls";
import { FinancialMetrics } from "@/components/admin/FinancialMetrics";
import { BadgesTab } from "@/components/admin/BadgesTab";
import { FinanceTab } from "@/components/admin/FinanceTab";
import { UsersAdminTab } from "@/components/admin/UsersAdminTab";
import { ReportsTab } from "@/components/admin/ReportsTab";
import { UnusualTrafficTab } from "@/components/admin/UnusualTrafficTab";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPanel, Avatar, EmptyState, KeyValue, MobileCard, StatusBadge, fmt, table } from "@/components/admin/ui";

export default async function AdminDashboardPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);
  const activeTab = searchParams.tab || "overview";

  if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
    redirect("/dashboard");
  }

  // Time range for charts (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      name: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    };
  });

  // Fetch stats and chart data in parallel
  const [
    totalUsers,
    verifiedUsers,
    activeServices,
    activeSpaces,
    openTickets,
    transactions,
    allUsers,
    subscriptions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.service.count(),
    prisma.space.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.transaction.findMany({
      where: { status: "PAID", createdAt: { gte: months[0].start } },
      select: { id: true, amount: true, createdAt: true, metadata: true }
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: months[0].start } },
      select: { createdAt: true, plan: true, isVerified: true }
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { plan: true }
    })
  ]);

  const stats = {
    totalUsers,
    verifiedUsers,
    activeServices,
    activeSpaces,
    openTickets,
  };

  // Prepare chart data
  const revenueData = months.map(m => ({
    month: m.name,
    amount: transactions
      .filter(t => t.createdAt >= m.start && t.createdAt <= m.end)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }));

  const growthData = months.map(m => ({
    month: m.name,
    users: allUsers.filter(u => u.createdAt >= m.start && u.createdAt <= m.end).length
  }));

  // Prepare plan distribution
  const planCounts = {
    FREE: allUsers.filter(u => u.plan === 'FREE').length,
    PROFESSIONAL: allUsers.filter(u => u.plan === 'PROFESSIONAL').length,
    EMPRESA: allUsers.filter(u => u.plan === 'EMPRESA').length,
    ELITE: allUsers.filter(u => u.plan === 'ELITE').length,
  };

  const planDistribution = [
    { name: 'Free', value: planCounts.FREE, color: '#6B7280' },
    { name: 'Pro', value: planCounts.PROFESSIONAL, color: '#D4AF37' },
    { name: 'Empresa', value: planCounts.EMPRESA, color: '#3B82F6' },
    { name: 'Elite', value: planCounts.ELITE, color: '#A855F7' },
  ];

  // Summary metrics
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const mrr = subscriptions.reduce((sum, s) => {
    // Estimating MRR based on plans (needs actual pricing data from a config)
    const prices: Record<string, number> = { FREE: 0, PROFESSIONAL: 29.99, EMPRESA: 99.99, ELITE: 299.99 };
    return sum + (prices[s.plan as string] || 0);
  }, 0);

  const financialSummary = {
    totalRevenue,
    mrr,
    arpu: totalUsers > 0 ? totalRevenue / totalUsers : 0,
    conversionRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0
  };

  // Load users dynamically for UsersAdminTab
  let initialUsers: any[] = [];
  if (activeTab === "users") {
    initialUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        username: true,
        isVerified: true,
        plan: true,
        twoFactorEnabled: true,
        isSanctioned: true,
        roles: { select: { role: true } }
      }
    });
  }

  const adminName = session.user.name || session.user.email || "Administrador";

  return (
    <AdminShell activeTab={activeTab} adminName={adminName}>
            {activeTab === "overview" && (
              <OverviewTab
                stats={stats}
                revenueData={revenueData}
                growthData={growthData}
                planDistribution={planDistribution}
                financialSummary={financialSummary}
                recentTransactions={[...transactions]
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .slice(0, 5)
                  .map(t => ({
                    id: t.id,
                    amount: Number(t.amount),
                    createdAt: t.createdAt.toISOString(),
                    metadata: t.metadata
                  })) as any}
              />
            )}
            {activeTab === "users" && <UsersAdminTab initialUsers={JSON.parse(JSON.stringify(initialUsers))} />}
            {activeTab === "companies" && <CompaniesTab />}
            {activeTab === "services" && <ContentTab type="services" />}
            {activeTab === "spaces" && <ContentTab type="spaces" />}
            {activeTab === "finance" && <FinanceTab />}
            {activeTab === "investors" && <InvestorsTab />}
            {activeTab === "reports" && <ReportsTab tickets={JSON.parse(JSON.stringify(await prisma.ticket.findMany({
              include: {
                user: true,
                involvedUser: true,
                order: { include: { client: true, service: { include: { provider: true } } } }
              },
              orderBy: { createdAt: 'desc' }
            })))} />}
            {activeTab === "traffic" && (
              <UnusualTrafficTab
                events={JSON.parse(JSON.stringify(await prisma.unusualTrafficEvent.findMany({
                  take: 200,
                  orderBy: { createdAt: "desc" },
                  include: { user: { select: { id: true, email: true, username: true, name: true } } },
                })))}
              />
            )}
            {activeTab === "badges" && <BadgesTab />}
            {activeTab === "settings" && <SettingsTab />}
    </AdminShell>
  );
}

async function OverviewTab({
  stats,
  revenueData,
  growthData,
  planDistribution,
  financialSummary,
  recentTransactions
}: {
  stats: any;
  revenueData: any;
  growthData: any;
  planDistribution: any;
  financialSummary: any;
  recentTransactions: any[];
}) {
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, createdAt: true, username: true, isVerified: true }
  });

  const recentPosts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true, username: true } } }
  });

  return (
    <div className="flex flex-col gap-8">
      <FinancialMetrics
        revenueData={revenueData}
        growthData={growthData}
        planDistribution={planDistribution}
        summary={financialSummary}
        recentTransactions={recentTransactions}
        operationalStats={stats}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <AdminPanel
          id="recent-users"
          className="lg:col-span-3"
          title="Últimas altas"
          description="Las cinco cuentas creadas más recientemente."
          bodyClassName="p-0"
          actions={
            <Link href="/admin/dashboard?tab=users" className="mv-link text-sm">
              Ver todos los usuarios
            </Link>
          }
        >
          {recentUsers.length === 0 ? (
            <div className="p-5"><EmptyState icon={UserPlus} title="Todavía no hay usuarios" /></div>
          ) : (
            <ul>
              {recentUsers.map(user => (
                <li key={user.id} className="flex items-center justify-between gap-3 border-b border-[var(--mv-hairline)] px-5 py-3 last:border-b-0 md:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={user.name} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--text-primary)]">
                        <span className="truncate">{user.name}</span>
                        {user.isVerified ? <StatusBadge tone="info" className="h-5 px-2 text-[0.6875rem]">Verificado</StatusBadge> : null}
                      </p>
                      <p className="truncate text-xs text-[var(--text-tertiary)]">
                        @{user.username} · {user.email} · <span className="mv-data">{fmt.date(user.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                  <AdminUserActions userId={user.id} userName={user.name} isVerified={user.isVerified} />
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          id="recent-posts"
          className="lg:col-span-2"
          title="Moderación rápida"
          description="Publicaciones más recientes del feed."
          bodyClassName="p-0"
        >
          {recentPosts.length === 0 ? (
            <div className="p-5"><EmptyState icon={FileText} title="No hay publicaciones" /></div>
          ) : (
            <ul>
              {recentPosts.map(post => (
                <li key={post.id} className="flex items-start justify-between gap-3 border-b border-[var(--mv-hairline)] px-5 py-3 last:border-b-0 md:px-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gold">@{post.author.username}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">{post.content}</p>
                  </div>
                  <AdminPostActions postId={post.id} />
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}



async function ContentTab({ type }: { type: 'services' | 'spaces' }) {
  const items = type === 'services'
    ? await prisma.service.findMany({ include: { provider: true, packages: true }, orderBy: { createdAt: 'desc' } })
    : await prisma.space.findMany({ include: { owner: true, images: true }, orderBy: { createdAt: 'desc' } });

  const noun = type === 'services' ? 'servicios' : 'espacios';

  if (items.length === 0) {
    return <EmptyState icon={Inbox} title={`No hay ${noun} publicados`} description="Cuando alguien publique, aparecerá acá para revisión." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--text-secondary)]">
        <span className="mv-data text-[var(--text-primary)]">{fmt.number(items.length)}</span> {noun}, del más reciente al más antiguo.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((item: any) => {
          const creator = type === 'services' ? item.provider : item.owner;
          const image = type === 'spaces' ? item.images?.[0]?.url : item.images?.[0];
          const price = type === 'spaces' ? item.pricePerDay : item.packages?.[0]?.price;
          return (
            <li key={item.id} className="mv-panel flex flex-col overflow-hidden rounded-[1.25rem]">
              <div className="relative aspect-[16/9] bg-[var(--mv-panel-hover)]">
                {image ? (
                  <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--text-tertiary)]">
                    <ImageOff className="h-6 w-6" aria-hidden />
                    <span className="sr-only">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                      Por {creator?.name ? `${creator.name} · ` : ""}@{creator?.username}
                    </p>
                  </div>
                  <AdminPostActions postId={item.id} action={type === 'services' ? "DELETE_SERVICE" : "DELETE_SPACE"} />
                </div>
                <dl className="mt-auto flex flex-col gap-1.5 border-t border-[var(--mv-hairline)] pt-3">
                  <KeyValue label={type === 'spaces' ? 'Precio por día' : 'Desde'} mono>
                    {price != null ? fmt.money(price, item.currency || 'USD') : 'Sin precio'}
                  </KeyValue>
                  <KeyValue label="Publicado" mono>{fmt.date(item.createdAt)}</KeyValue>
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


async function SettingsTab() {
  const config = await prisma.globalConfig.findUnique({
    where: { id: "singleton" }
  }) || await prisma.globalConfig.create({ data: { id: "singleton" } });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <GlobalSettingsForm initialConfig={JSON.parse(JSON.stringify(config))} />
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-36 xl:self-start" aria-label="Estado publicado">
        <AdminPanel id="config-live" title="Publicado ahora" description="Valores vigentes en la base de datos.">
          <dl className="flex flex-col gap-2.5">
            <KeyValue label="Registros">
              <StatusBadge tone={config.allowNewRegistrations ? "success" : "danger"}>
                {config.allowNewRegistrations ? "Abiertos" : "Cerrados"}
              </StatusBadge>
            </KeyValue>
            <KeyValue label="Mantenimiento">
              <StatusBadge tone={config.maintenanceMode ? "danger" : "neutral"}>{config.maintenanceMode ? "Activo" : "Inactivo"}</StatusBadge>
            </KeyValue>
            <KeyValue label="Comisión" mono>{config.platformFeePercentage}%</KeyValue>
            <KeyValue label="Puntaje mínimo" mono>{config.minVerificationScore}</KeyValue>
            <KeyValue label="Anuncio global">{config.announcementText ? "Publicado" : "Ninguno"}</KeyValue>
            <KeyValue label="Última edición" mono>{fmt.dateTime(config.updatedAt)}</KeyValue>
          </dl>
        </AdminPanel>
        <p className="px-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
          Los cambios se aplican a todo el sitio al publicarlos y quedan en el registro de auditoría con la cuenta que los hizo.
        </p>
      </aside>
    </div>
  );
}

const MEMBER_STATUS: Record<string, { label: string; tone: "gold" | "success" | "danger" }> = {
  PENDING: { label: "Pendiente", tone: "gold" },
  APPROVED: { label: "Aprobada", tone: "success" },
  REJECTED: { label: "Rechazada", tone: "danger" },
};

async function CompaniesTab() {
  const requests = await prisma.companyMember.findMany({
    include: {
      user: { select: { name: true, username: true, email: true } },
      company: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (requests.length === 0) {
    return <EmptyState icon={Building2} title="No hay solicitudes" description="Cuando alguien pida vincularse a una empresa, la vas a ver acá." />;
  }

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const status = (s: string) => MEMBER_STATUS[s] ?? { label: s, tone: "gold" as const };

  return (
    <AdminPanel
      id="company-requests"
      title="Solicitudes"
      description={`${fmt.number(requests.length)} en total · ${fmt.number(pending)} ${pending === 1 ? "pendiente" : "pendientes"}`}
      bodyClassName="p-0"
    >
      {/* Desktop table */}
      <div className={`hidden md:block ${table.wrap}`}>
        <table className={table.table}>
          <thead>
            <tr>
              <th scope="col" className={table.th}>Solicitante</th>
              <th scope="col" className={table.th}>Empresa</th>
              <th scope="col" className={table.th}>Cargo declarado</th>
              <th scope="col" className={table.th}>Fecha</th>
              <th scope="col" className={table.th}>Estado</th>
              <th scope="col" className={`${table.th} text-right`}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className={table.tr}>
                <td className={table.td}>
                  <div className="flex items-center gap-3">
                    <Avatar name={req.user.name} />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">@{req.user.username}</p>
                      <p className="truncate text-xs text-[var(--text-tertiary)]">{req.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className={table.td}>
                  <p className="font-semibold text-[var(--text-primary)]">{req.company.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{req.company.isVerified ? "Empresa verificada" : "Empresa sin verificar"}</p>
                </td>
                <td className={`${table.td} mv-data text-xs text-[var(--text-primary)]`}>{req.role}</td>
                <td className={`${table.td} mv-data whitespace-nowrap text-xs`}>{fmt.date(req.createdAt)}</td>
                <td className={table.td}>
                  <StatusBadge tone={status(req.status).tone}>{status(req.status).label}</StatusBadge>
                </td>
                <td className={`${table.td} text-right`}>
                  <AdminCompanyActions requestId={req.id} currentStatus={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden">
        {requests.map(req => (
          <MobileCard key={req.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={req.user.name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text-primary)]">@{req.user.username}</p>
                  <p className="truncate text-xs text-[var(--text-tertiary)]">{req.user.email}</p>
                </div>
              </div>
              <StatusBadge tone={status(req.status).tone}>{status(req.status).label}</StatusBadge>
            </div>
            <dl className="flex flex-col gap-1.5">
              <KeyValue label="Empresa">{req.company.name}</KeyValue>
              <KeyValue label="Cargo" mono>{req.role}</KeyValue>
              <KeyValue label="Fecha" mono>{fmt.date(req.createdAt)}</KeyValue>
            </dl>
            <AdminCompanyActions requestId={req.id} currentStatus={req.status} />
          </MobileCard>
        ))}
      </ul>
    </AdminPanel>
  );
}

async function InvestorsTab() {
  const contacts = await prisma.investorContact.findMany({
    orderBy: { createdAt: 'desc' }
  });

  if (contacts.length === 0) {
    return <EmptyState icon={Mail} title="Sin contactos todavía" description="Los mensajes del formulario de inversores aparecerán acá." />;
  }

  return (
    <AdminPanel
      id="investors"
      title="Contactos"
      description={`${fmt.number(contacts.length)} mensajes recibidos`}
      bodyClassName="p-0"
    >
      <div className={`hidden md:block ${table.wrap}`}>
        <table className={table.table}>
          <thead>
            <tr>
              <th scope="col" className={table.th}>Contacto</th>
              <th scope="col" className={table.th}>Empresa</th>
              <th scope="col" className={table.th}>Recibido</th>
              <th scope="col" className={`${table.th} w-[40%]`}>Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => (
              <tr key={contact.id} className={table.tr}>
                <td className={table.td}>
                  <div className="flex items-center gap-3">
                    <Avatar name={contact.name} />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">{contact.name}</p>
                      <a href={`mailto:${contact.email}`} className="mv-link mv-data text-xs font-normal">
                        {contact.email}
                      </a>
                    </div>
                  </div>
                </td>
                <td className={`${table.td} text-[var(--text-primary)]`}>{contact.company || "Particular"}</td>
                <td className={`${table.td} mv-data whitespace-nowrap text-xs`}>{fmt.dateTime(contact.createdAt)}</td>
                <td className={table.td}>
                  <MessageCell text={contact.message} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden">
        {contacts.map(contact => (
          <MobileCard key={contact.id}>
            <div className="flex items-center gap-3">
              <Avatar name={contact.name} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--text-primary)]">{contact.name}</p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">{contact.company || "Particular"}</p>
              </div>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{contact.message}</p>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="mv-data text-[var(--text-tertiary)]">{fmt.dateTime(contact.createdAt)}</span>
              <a href={`mailto:${contact.email}`} className="mv-link inline-flex h-10 items-center">Responder</a>
            </div>
          </MobileCard>
        ))}
      </ul>
    </AdminPanel>
  );
}

/** Long messages collapse behind a native disclosure: keyboard and screen-reader friendly. */
function MessageCell({ text }: { text: string }) {
  if (text.length <= 180) return <p className="whitespace-pre-line leading-relaxed text-[var(--text-secondary)]">{text}</p>;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none leading-relaxed text-[var(--text-secondary)] [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">{text.slice(0, 180)}… </span>
        <span className="mv-link text-xs group-open:hidden">Leer completo</span>
        <span className="mv-link hidden text-xs group-open:inline">Contraer</span>
      </summary>
      <p className="mt-1 whitespace-pre-line leading-relaxed text-[var(--text-secondary)]">{text}</p>
    </details>
  );
}
// creado por pato dev y askforvini
