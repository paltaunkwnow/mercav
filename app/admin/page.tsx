import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Users, FileText, Briefcase, MapPinned, Store, Flag } from "lucide-react";
import { BackToSite } from "@/components/admin/AdminNav";
import { ADMIN_TABS } from "@/components/admin/tabs";
import { Metric, fmt } from "@/components/admin/ui";
import { buttonClass } from "@/components/site/primitives";

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

  const sections = ADMIN_TABS.filter((tab) => tab.id !== "overview");

  return (
    <div className="min-h-screen w-full bg-bg-primary text-[var(--text-primary)]">
      <a href="#admin-main" className="mv-skip">Saltar al contenido</a>

      <div className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
        <div className="liquid-glass mx-auto flex h-14 max-w-[76rem] items-center justify-between gap-3 rounded-[1.25rem] px-3">
          <div className="flex items-center gap-2.5 pl-1">
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-gold font-display text-xs font-semibold text-[var(--mv-on-gold)]">
              M
            </span>
            <span className="text-sm font-semibold">Consola de administración</span>
          </div>
          <BackToSite />
        </div>
      </div>

      <main id="admin-main" className="mv-container flex flex-col gap-10 pb-16 pt-10 md:pt-14">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="mv-kicker">Administración</p>
            <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] md:text-[2.5rem]">Estado de la plataforma</h1>
            <p className="max-w-2xl text-[0.9375rem] text-[var(--text-secondary)]">
              Totales en vivo de la base de datos. Entrá a la consola para moderar, revisar finanzas y ajustar la configuración.
            </p>
          </div>
          <Link href="/admin/dashboard" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
            Abrir la consola <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </header>

        <section aria-labelledby="totals-title" className="flex flex-col gap-3">
          <h2 id="totals-title" className="text-sm font-semibold text-[var(--text-secondary)]">Totales</h2>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Metric label="Usuarios" value={fmt.number(users)} icon={Users} />
            <Metric label="Publicaciones" value={fmt.number(posts)} icon={FileText} />
            <Metric label="Vacantes" value={fmt.number(jobs)} icon={Briefcase} />
            <Metric label="Espacios" value={fmt.number(spaces)} icon={MapPinned} />
            <Metric label="Servicios" value={fmt.number(services)} icon={Store} />
            <Metric label="Reportes pendientes" value={fmt.number(reports)} icon={Flag} tone={reports > 0 ? "danger" : "neutral"} />
          </dl>
        </section>

        <section aria-labelledby="sections-title" className="flex flex-col gap-3">
          <h2 id="sections-title" className="text-sm font-semibold text-[var(--text-secondary)]">Secciones de la consola</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(({ id, title, lead, icon: Icon }) => (
              <li key={id}>
                <Link
                  href={`/admin/dashboard?tab=${id}`}
                  className="mv-panel mv-panel-interactive mv-focus group flex h-full items-start gap-4 rounded-[1.25rem] p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--mv-hairline-strong)] text-gold">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-semibold text-[var(--text-primary)]">
                      {title}
                      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </span>
                    <span className="mt-1 block text-sm text-[var(--text-secondary)]">{lead}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
// creado por pato dev y askforvini
