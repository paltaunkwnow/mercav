"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  MonitorPlay,
  Megaphone,
  MessageSquare,
  Plus,
  ArrowRight,
  Users,
  Clock,
  ChevronRight,
  Settings,
  Store,
  Wrench,
  Shield,
  UserCheck,
  LifeBuoy,
  Sparkles,
} from "lucide-react";
import { ButtonLink, Container, PageHero, Section, GlassPanel } from "@/components/site/primitives";
import { StarOfDavid } from "@/components/site/StarOfDavid";

export default function DashboardClient({
  user,
  totalApplicants,
  totalViews,
  totalEarnings,
  totalSaved
}: {
  user: any,
  totalApplicants: number,
  totalViews: number,
  totalEarnings: number,
  totalSaved: number
}) {
  const [loading, setLoading] = useState(false);

  const firstName = (user.name || "").split(" ")[0];

  const categories = [
    {
      title: "Ads",
      sub: "Espacios publicitarios",
      desc: "Administrá tus vallas, pantallas y letreros disponibles para reserva.",
      icon: Megaphone,
      link: "/anuncios/mis-espacios",
      stats: `${user.spaces.length} ${user.spaces.length === 1 ? "espacio" : "espacios"}`,
      action: "Gestionar espacios",
      pending: false,
    },
    {
      title: "Services",
      sub: "Servicios freelance",
      desc: "Controlá tus servicios publicados y seguí los pedidos que contrataste.",
      icon: MonitorPlay,
      link: "/servicios/mis-servicios",
      stats: `${user.services?.length || 0} ${(user.services?.length || 0) === 1 ? "servicio" : "servicios"}`,
      action: "Ver mis servicios",
      pending: false,
    },
    {
      title: "Empleos",
      sub: "Vacantes y talento",
      desc: "Gestioná tus búsquedas de talento y las vacantes que tenés activas.",
      icon: Briefcase,
      link: "/empleos/mis-empleos",
      stats: `${user.jobPosts?.length || 0} ${(user.jobPosts?.length || 0) === 1 ? "vacante" : "vacantes"}`,
      action: "Ver mis vacantes",
      pending: false,
    },
    {
      title: "POS",
      sub: "Punto de venta",
      desc: "Cobrá en tu local, llevá el inventario y emití tickets desde el navegador.",
      icon: Store,
      link: user.posConfig ? "/dashboard/pos" : "/dashboard/pos/config",
      stats: user.posConfig ? "Configurado" : "Pendiente",
      action: user.posConfig ? "Abrir terminal" : "Configurar local",
      pending: !user.posConfig,
    },
  ];

  const statCards = [
    { label: "Postulantes", value: totalApplicants, sub: "En tus vacantes" },
    { label: "Visualizaciones", value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews, sub: "De tus vacantes" },
    { label: "Ingresos", value: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(totalEarnings), sub: "Pagos recibidos" },
    { label: "Guardados", value: totalSaved, sub: "Usuarios interesados" },
  ];

  const management = [
    { label: "Pedidos", link: "/dashboard/pedidos", icon: Clock, sub: "Compras, ventas, pagos y reportes" },
    { label: "Clientes", link: "/dashboard/clientes", icon: Users, sub: "Pedidos y reservas que recibiste" },
    { label: "Postulantes", link: "/dashboard/postulantes", icon: UserCheck, sub: "Candidatos de tus vacantes" },
    { label: "Mensajes", link: "/mensajes", icon: MessageSquare, sub: "Conversaciones con clientes y equipos" },
  ];

  const moreModules = [
    { label: "Herramientas", link: "/herramientas", icon: Wrench },
    { label: "Pwn", link: "/pwn", icon: Shield },
    { label: "Kosher", link: "/kosher", icon: StarOfDavid },
    { label: "Ajustes del POS", link: "/dashboard/pos/config", icon: Settings },
    { label: "Premium", link: "/premium", icon: Sparkles },
  ];

  return (
    <div className="w-full min-h-screen bg-bg-primary">
      <PageHero
        kicker="Tu panel"
        title={firstName ? <>Hola, <span className="mv-gold-text">{firstName}</span></> : "Tu panel"}
        lead="Todo lo que pasa en tu cuenta de Mercav, en un solo lugar: publicaciones, pedidos, clientes y módulos."
        actions={
          <>
            <ButtonLink href="/dashboard/crear" size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" aria-hidden /> Nueva publicación
            </ButtonLink>
            <ButtonLink href="/perfil/editar" tone="secondary" size="lg" className="w-full sm:w-auto">
              <Settings className="h-5 w-5" aria-hidden /> Ajustes de perfil
            </ButtonLink>
          </>
        }
      >
        {user.badges && user.badges.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Insignias</span>
            <ul className="flex flex-wrap items-center gap-2">
              {user.badges.map((badge: any) => (
                <li key={badge.id} className="mv-chip h-9 pl-1.5" title={badge.name}>
                  <img src={badge.icon} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                  <span>{badge.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <GlassPanel as="section" className="p-5 sm:p-8">
          <h2 id="dash-resumen" className="sr-only">Resumen</h2>
          <dl aria-labelledby="dash-resumen" className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {statCards.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1.5 lg:border-l lg:border-[var(--mv-hairline)] lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                <dt className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</dt>
                <dd className="mv-data break-words text-xl font-medium tracking-tight text-[var(--text-primary)] sm:text-2xl md:text-3xl">{stat.value}</dd>
                <dd className="text-xs text-[var(--text-tertiary)]">{stat.sub}</dd>
              </div>
            ))}
          </dl>
        </GlassPanel>
      </PageHero>

      <Section tight labelledBy="dash-modulos" className="pt-6 md:pt-8">
        <Container>
          <div className="mb-8 flex flex-col gap-3">
            <p className="mv-kicker">Módulos</p>
            <h2 id="dash-modulos" className="mv-h3">Lo que publicás y gestionás</h2>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categories.map((cat) => (
              <li key={cat.title}>
                <Link
                  href={cat.link}
                  className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col gap-5 p-6 outline-none md:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                        <cat.icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <h3 className="mv-h3">{cat.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{cat.sub}</p>
                      </div>
                    </div>
                    <span className={cat.pending ? "mv-chip shrink-0" : "mv-chip mv-chip-gold shrink-0"}>{cat.stats}</span>
                  </div>
                  <p className="mv-body max-w-md">{cat.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-gold">
                    {cat.action}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <nav aria-label="Otros módulos" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {moreModules.map((item) => (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    className="mv-chip mv-focus h-10 gap-2 px-4 text-sm outline-none transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)]"
                  >
                    <item.icon className="h-4 w-4 text-gold" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>

      <Section tight labelledBy="dash-gestion" className="pt-0 md:pt-0">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-6 flex flex-col gap-3">
                <p className="mv-kicker">Gestión</p>
                <h2 id="dash-gestion" className="mv-h3">Pedidos, clientes y candidatos</h2>
              </div>
              <ul className="mv-panel divide-y divide-[var(--mv-hairline)] overflow-hidden">
                {management.map((item) => (
                  <li key={item.link}>
                    <Link
                      href={item.link}
                      className="group flex min-h-[4.5rem] items-center justify-between gap-4 px-5 py-4 outline-none transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)] md:px-6"
                    >
                      <span className="flex items-center gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mv-hairline)] text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-gold">
                          <item.icon className="h-[18px] w-[18px]" aria-hidden />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
                          <span className="text-sm text-[var(--text-secondary)]">{item.sub}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gold" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <aside aria-labelledby="dash-ayuda" className="flex flex-col lg:col-span-4">
              <div className="mb-6 flex flex-col gap-3">
                <p className="mv-kicker">Soporte</p>
                <h2 id="dash-ayuda" className="mv-h3">¿Necesitás ayuda?</h2>
              </div>
              <div className="mv-panel flex flex-1 flex-col gap-4 p-6 md:p-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
                  <LifeBuoy className="h-5 w-5" aria-hidden />
                </span>
                <p className="mv-body">
                  Si algo no funciona como esperás con un pedido, un pago o un módulo, escribinos y lo revisamos con vos.
                </p>
                <ButtonLink href="/soporte" tone="secondary" className="mt-auto w-full">
                  Contactar soporte
                </ButtonLink>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </div>
  );
}
// creado por pato dev y askforvini
