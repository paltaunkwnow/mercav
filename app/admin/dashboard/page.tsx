import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  Users, 
  ShieldCheck, 
  Briefcase, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  LayoutDashboard,
  Search,
  Bell,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Database,
  Lock,
  Globe,
  Trash2,
  Crown,
  Zap,
  Building,
  Check,
  X,
  Medal,
  DollarSign,
  Handshake
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { AdminUserActions, AdminPostActions, AdminCompanyActions, AdminTicketActions, GlobalSettingsForm } from "@/components/admin/AdminControls";
import { FinancialMetrics } from "@/components/admin/FinancialMetrics";
import { BadgesTab } from "@/components/admin/BadgesTab";
import { FinanceTab } from "@/components/admin/FinanceTab";
import { UsersAdminTab } from "@/components/admin/UsersAdminTab";
import { ReportsTab } from "@/components/admin/ReportsTab";

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
    { name: 'Free', value: planCounts.FREE, color: '#4B5563' },
    { name: 'Pro', value: planCounts.PROFESSIONAL, color: '#FFD700' },
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

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/5 bg-black p-6 xl:block z-[50]">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gold flex items-center justify-center font-bold text-black italic">M</div>
          <span className="text-xl font-display font-bold tracking-tighter">MERCAV <span className="text-gold text-[10px] align-top">LAT</span></span>
        </div>

        <nav className="space-y-2">
          <TabLink icon={LayoutDashboard} label="Dashboard" id="overview" active={activeTab === "overview"} />
          <TabLink icon={Users} label="Usuarios" id="users" active={activeTab === "users"} />
          <TabLink icon={Building} label="Empresas" id="companies" active={activeTab === "companies"} />
          <TabLink icon={Briefcase} label="Servicios" id="services" active={activeTab === "services"} />
          <TabLink icon={MapPin} label="Espacios" id="spaces" active={activeTab === "spaces"} />
          <TabLink icon={DollarSign} label="Finanzas" id="finance" active={activeTab === "finance"} />
          <TabLink icon={Handshake} label="Inversores" id="investors" active={activeTab === "investors"} />
          <TabLink icon={AlertTriangle} label="Reportes" id="reports" active={activeTab === "reports"} />
          <TabLink icon={Medal} label="Insignias" id="badges" active={activeTab === "badges"} />
          <div className="pt-10">
            <TabLink icon={Settings} label="Configuración" id="settings" active={activeTab === "settings"} />
          </div>
        </nav>

        <div className="mt-auto pt-10">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
          >
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-gold/20 group-hover:text-gold transition-colors">
              <ArrowRight className="h-4 w-4 rotate-180" />
            </div>
            <span className="font-medium text-sm">Volver al Sitio</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 xl:ml-64 p-4 md:p-10 w-full min-h-screen bg-background">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-tight flex items-center gap-3">
              {activeTab === "overview" && "Centro de Mando"}
              {activeTab === "users" && "Gestión de Usuarios"}
              {activeTab === "companies" && "Validación de Empresas"}
              {activeTab === "services" && "Moderación de Servicios"}
              {activeTab === "spaces" && "Control de Espacios"}
              {activeTab === "finance" && "Auditoría Financiera"}
              {activeTab === "investors" && "Registro de Inversores"}
              {activeTab === "reports" && "Centro de Soporte"}
              {activeTab === "badges" && "Sistema de Insignias"}
              {activeTab === "settings" && "Ajustes del Sistema"}
              <span className="bg-gold/10 text-gold text-[10px] px-2 py-0.5 rounded-md font-mono border border-gold/20">v2.6.5</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Infraestructura administrativa MERCAV.LAT</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                placeholder="Buscar globalmente..." 
                className="bg-bg-secondary border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold/50 transition-all w-full md:w-80"
              />
            </div>
            <div className="h-11 w-11 rounded-xl bg-gold text-black flex items-center justify-center font-bold shadow-lg shadow-gold/10">A</div>
          </div>
        </header>

        {/* Tab Content Container */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "overview" && (
            <OverviewTab 
              stats={stats} 
              revenueData={revenueData} 
              growthData={growthData} 
              planDistribution={planDistribution} 
              financialSummary={financialSummary} 
              recentTransactions={transactions.slice(0, 5).map(t => ({
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
          {activeTab === "badges" && <BadgesTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

function TabLink({ icon: Icon, label, id, active }: { icon: any, label: string, id: string, active: boolean }) {
  return (
    <Link 
      href={`/admin/dashboard?tab=${id}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-gold text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm tracking-tight">{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4" />}
    </Link>
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
    <div className="space-y-12">
      {/* Financial Metrics Integration */}
      <FinancialMetrics 
        revenueData={revenueData} 
        growthData={growthData} 
        planDistribution={planDistribution} 
        summary={financialSummary} 
        recentTransactions={recentTransactions}
        operationalStats={stats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl">
          <h3 className="font-bold mb-6">Últimas Altas de Usuarios</h3>
          <div className="space-y-4">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-[10px] text-gray-500">@{user.username} · {user.email}</p>
                  </div>
                </div>
                <AdminUserActions userId={user.id} userName={user.name} isVerified={user.isVerified} />
              </div>
            ))}
          </div>
          <Link href="/admin/dashboard?tab=users" className="mt-6 block text-center text-xs text-gold hover:underline">Ver todos los usuarios</Link>
        </div>

        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl">
          <h3 className="font-bold mb-6">Moderación Rápida</h3>
          <div className="space-y-4">
            {recentPosts.map(post => (
              <div key={post.id} className="p-3 rounded-2xl border border-white/5 bg-white/5 group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gold font-bold">@{post.author.username}</span>
                  <AdminPostActions postId={post.id} />
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



async function ContentTab({ type }: { type: 'services' | 'spaces' }) {
  const items = type === 'services' 
    ? await prisma.service.findMany({ include: { provider: true, packages: true }, orderBy: { createdAt: 'desc' } })
    : await prisma.space.findMany({ include: { owner: true, images: true }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.length === 0 ? (
        <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
          <p className="text-gray-500 italic">No hay {type === 'services' ? 'servicios' : 'espacios'} registrados todavía.</p>
        </div>
      ) : items.map((item: any) => {
        const creator = type === 'services' ? item.provider : item.owner;
        return (
          <div key={item.id} className="rounded-3xl border border-white/5 bg-black/40 p-5 group relative flex flex-col h-full hover:border-gold/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-bg-tertiary flex items-center justify-center font-bold text-gold text-xs">
                  {creator.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-500">Por @{creator.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminPostActions 
                  postId={item.id} 
                  action={type === 'services' ? "DELETE_SERVICE" : "DELETE_SPACE"} 
                />
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-bg-tertiary/50 mb-4 overflow-hidden border border-white/5 relative">
              {type === 'spaces' && item.images?.[0] ? (
                <img src={item.images[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Preview" />
              ) : type === 'services' && (item as any).images?.[0] ? (
                <img src={(item as any).images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Preview" />
              ) : (
                <div className="w-full h-full flex justify-center items-center bg-white/5">
                  <Database className="h-8 w-8 text-white/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[10px] font-mono text-gold bg-gold/5 px-2 py-1 rounded-md">
                {type === 'spaces' ? `${item.pricePerDay || '0.00'}` : `${item.packages?.[0]?.price || '0.00'}`} {item.currency || 'USD'}
                {type === 'spaces' && <span className="text-[8px] text-gray-500 ml-1">/DÍA</span>}
              </span>
              <span className="text-[9px] text-gray-600 uppercase font-bold">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


async function SettingsTab() {
  const config = await prisma.globalConfig.findUnique({
    where: { id: "singleton" }
  }) || await prisma.globalConfig.create({ data: { id: "singleton" } });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <GlobalSettingsForm initialConfig={JSON.parse(JSON.stringify(config))} />
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-gold" /> Estado del Sistema
        </h3>
        
        <div className="p-6 rounded-3xl border border-white/5 bg-white/5">
          <h4 className="text-white font-bold mb-4 text-sm">Monitor de Infraestructura</h4>
          <div className="space-y-3">
             <div className="flex justify-between text-[10px] font-mono p-2 rounded bg-black/40">
                <span className="text-gray-500">DATABASE_SYNC</span>
                <span className="text-green-500 font-bold">READY</span>
             </div>
             <div className="flex justify-between text-[10px] font-mono p-2 rounded bg-black/40">
                <span className="text-gray-500">AUTH_SERVICE</span>
                <span className="text-green-500 font-bold">ACTIVE</span>
             </div>
             <div className="flex justify-between text-[10px] font-mono p-2 rounded bg-black/40">
                <span className="text-gray-500">STORAGE_BUCKET</span>
                <span className="text-yellow-500 font-bold">84% FULL</span>
             </div>
             <div className="flex justify-between text-[10px] font-mono p-2 rounded bg-black/40">
                <span className="text-gray-500">SSL_CERTIFICATE</span>
                <span className="text-blue-400 font-bold">VALID</span>
             </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-gold/10 bg-gold/5">
          <h4 className="text-gold font-bold mb-2 text-sm">Resumen Administrativo</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Todos los cambios realizados en esta sección se aplican en tiempo real a la infraestructura de MERCAV.LAT. Los logs de auditoría registran quién realizó cada modificación.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, label, desc }: { icon: any, label: string, desc: string }) {
  return (
    <div className="p-6 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-between group hover:border-gold/30 transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-bg-tertiary flex items-center justify-center text-gray-400 group-hover:text-gold transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-white">{label}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-700" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color = "text-gold" }: { label: string, value: number, icon: any, trend?: string, color?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold font-mono">{value.toLocaleString()}</p>
          {trend && <p className="text-[10px] text-green-400 mt-2 font-medium">{trend}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
        <Icon className="h-24 w-24" />
      </div>
    </div>
  );
}

async function CompaniesTab() {
  const requests = await prisma.companyMember.findMany({
    include: {
      user: { select: { name: true, username: true, email: true } },
      company: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400 min-w-[1000px]">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600">
              <th className="px-6 py-5 font-bold">Solicitante</th>
              <th className="px-6 py-5 font-bold">Empresa / Razón Social</th>
              <th className="px-6 py-5 font-bold">Cargo Declarado</th>
              <th className="px-6 py-5 font-bold text-center">Estado</th>
              <th className="px-6 py-5 text-right font-bold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-500 italic">No hay solicitudes de vinculación empresarial.</td>
              </tr>
            ) : requests.map(req => (
              <tr key={req.id} className="group hover:bg-white/[0.03] transition-all">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                      {req.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-bold">@{req.user.username}</p>
                      <p className="text-[10px] text-gray-500">{req.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center border border-gold/20">
                      <Building size={18} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{req.company.name}</p>
                      <p className="text-[10px] text-gray-500">{req.company.industry || "General"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-white font-mono text-xs">
                  {req.role}
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                    req.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    req.status === 'PENDING' ? 'bg-gold/10 text-gold border-gold/20 animate-pulse' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <AdminCompanyActions requestId={req.id} currentStatus={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertItem({ type, label, desc, time }: { type: 'warning' | 'info' | 'success', label: string, desc: string, time: string }) {
  const colors = {
    warning: 'text-yellow-400 bg-yellow-400/10',
    info: 'text-blue-400 bg-blue-400/10',
    success: 'text-green-400 bg-green-400/10'
  };

  return (
    <div className="p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colors[type]}`}>
          {type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {type === 'info' && <Bell className="h-4 w-4" />}
          {type === 'success' && <ShieldCheck className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white mb-0.5">{label}</p>
          <p className="text-[10px] text-gray-500 line-clamp-1">{desc}</p>
          <p className="text-[9px] text-gray-600 mt-1 uppercase tracking-tighter">{time}</p>
        </div>
      </div>
    </div>
  );
}

async function InvestorsTab() {
  const contacts = await prisma.investorContact.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden card-hover-premium transition-all duration-700">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Registro de Potenciales Inversores</h3>
          <p className="text-xs text-gray-500">Contactos interesados en invertir en la plataforma.</p>
        </div>
        <span className="bg-gold/10 text-gold text-xs px-3 py-1 rounded-xl border border-gold/20 font-bold">
          {contacts.length} contactos
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400 min-w-[1000px]">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600">
              <th className="px-6 py-5 font-bold">Inversor / Contacto</th>
              <th className="px-6 py-5 font-bold">Empresa</th>
              <th className="px-6 py-5 font-bold">Correo Electrónico</th>
              <th className="px-6 py-5 font-bold">Fecha de Registro</th>
              <th className="px-6 py-5 font-bold">Mensaje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-500 italic">No hay contactos de inversores registrados por el momento.</td>
              </tr>
            ) : contacts.map(contact => (
              <tr key={contact.id} className="group hover:bg-white/[0.03] transition-all duration-500">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold border border-gold/20">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold">{contact.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-white font-semibold">
                  {contact.company || "Particular"}
                </td>
                <td className="px-6 py-5">
                  <a href={`mailto:${contact.email}`} className="text-gold hover:underline font-mono">
                    {contact.email}
                  </a>
                </td>
                <td className="px-6 py-5 text-xs text-gray-500">
                  {new Date(contact.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </td>
                <td className="px-6 py-5 max-w-sm">
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300 cursor-help" title={contact.message}>
                    {contact.message}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
