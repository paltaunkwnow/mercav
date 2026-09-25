import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Shield, Users, FileText, Briefcase, MapPinned, Store, BarChart3, AlertTriangle } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;

  if (!me || !(await isAdminUser(me.id))) redirect("/forbidden");

  const [users, posts, jobs, spaces, services, reports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.jobPost.count(),
    prisma.space.count(),
    prisma.service.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="min-h-screen w-full bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto max-w-7xl px-4 space-y-8">
        <div className="rounded-3xl border border-border bg-bg-secondary p-8">
          <div className="flex items-center gap-3 text-gold"><Shield className="h-5 w-5" /> Panel administrativo</div>
          <h1 className="mt-3 text-4xl font-bold text-white">Dashboard admin</h1>
          <p className="mt-2 text-gray-400">Estadísticas globales, revisión de usuarios y moderación de contenido.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Usuarios" value={users} icon={Users} />
          <StatCard label="Publicaciones" value={posts} icon={FileText} />
          <StatCard label="Vacantes" value={jobs} icon={Briefcase} />
          <StatCard label="Espacios" value={spaces} icon={MapPinned} />
          <StatCard label="Servicios" value={services} icon={Store} />
          <StatCard label="Reportes pendientes" value={reports} icon={AlertTriangle} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <AdminCard title="Gestión de usuarios" desc="Buscar, cambiar plan, suspender o reactivar cuentas." href="/api/admin/users" />
          <AdminCard title="Moderación de posts" desc="Eliminar publicaciones reportadas y marcar destacadas." href="/api/admin/posts" />
          <AdminCard title="Sistema de reportes" desc="Revisar cola de reportes y resolverlos." href="/api/admin/reports" />
        </div>

        <div className="rounded-3xl border border-border bg-bg-secondary p-6">
          <div className="flex items-center gap-3 mb-4"><BarChart3 className="h-5 w-5 text-gold" /><h2 className="text-xl font-semibold text-white">Accesos rápidos</h2></div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/api/admin/stats" className="rounded-full border border-border bg-bg-primary px-4 py-2 text-gray-300 hover:text-white">Stats</Link>
            <Link href="/api/admin/users" className="rounded-full border border-border bg-bg-primary px-4 py-2 text-gray-300 hover:text-white">Usuarios</Link>
            <Link href="/api/admin/reports" className="rounded-full border border-border bg-bg-primary px-4 py-2 text-gray-300 hover:text-white">Reportes</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-secondary p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gray-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-white">{value}</div>
        </div>
        <Icon className="h-6 w-6 text-gold" />
      </div>
    </div>
  );
}

function AdminCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-border bg-bg-secondary p-6 hover:border-gold/40 transition-colors">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{desc}</p>
    </Link>
  );
}
// creado por Patodev y Invertilo
