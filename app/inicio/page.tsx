import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, LifeBuoy, Megaphone, ShoppingCart, UserCheck } from "@/components/icons";
import { ModuleGlyph, type ModuleGlyphKey } from "@/components/icons/ModuleGlyph";
import { Mervi } from "@/components/mervi/Mervi";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { TOOL_ROUTES } from "@/app/herramientas/toolRoutes";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/site/primitives";
import { APP_SECTION_GROUPS } from "@/lib/app/sections";
import { getCalendarPrefs, userLocale } from "@/lib/calendar/server";
import { upcomingGroups } from "@/lib/calendar";
import { relativeRange } from "@/lib/calendar/dates";
import { calendarSource } from "@/lib/calendar/sources";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { cn } from "@/lib/utils";
import { hostHref, hostKindFor, isAbsoluteUrl, type HostKind } from "@/lib/seo/site";

export const metadata: Metadata = { title: "Inicio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function longDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const text = `${WEEKDAYS[wd]} ${d} de ${MONTHS[m - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A tile link. The Kosher tile lives on kosher.mercav.lat: a plain <a> there, no cross-origin RSC prefetch. */
function SectionLink({ href, hostKind, className, children }: { href: string; hostKind: HostKind; className?: string; children: ReactNode }) {
  const target = hostHref(href, hostKind);
  if (isAbsoluteUrl(target)) {
    return (
      <a href={target} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  );
}

/** Símbolo de la moneda como se escribe en el país (BOB → Bs, ARS → $). */
function currencySymbol(country: string, currency: string) {
  try {
    return new Intl.NumberFormat(`es-${country}`, { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/** Lo que antes estaba en "Mi panel": tus publicaciones, sus números y los accesos a pedidos y postulantes. */
async function activityOf(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      posConfig: { select: { id: true } },
      jobPosts: { select: { viewCount: true, _count: { select: { applications: true, savedBy: true } } } },
      spaces: {
        select: {
          _count: { select: { savedBy: true } },
          reservations: { where: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } }, select: { ownerFee: true } },
        },
      },
      services: {
        select: {
          _count: { select: { savedBy: true } },
          orders: { where: { status: { in: ["COMPLETED", "IN_PROGRESS", "IN_REVIEW"] } }, select: { providerPayout: true } },
        },
      },
    },
  });
  if (!user) return null;
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  return {
    spaces: user.spaces.length,
    services: user.services.length,
    jobs: user.jobPosts.length,
    oldCaja: !!user.posConfig,
    applicants: sum(user.jobPosts.map((j) => j._count.applications)),
    views: sum(user.jobPosts.map((j) => j.viewCount || 0)),
    // Pagos de servicios en curso o terminados y reservas confirmadas de tus espacios.
    earnings:
      sum(user.services.flatMap((s) => s.orders.map((o) => Number(o.providerPayout)))) + sum(user.spaces.flatMap((s) => s.reservations.map((r) => Number(r.ownerFee)))),
    saved: sum([...user.jobPosts, ...user.spaces, ...user.services].map((x) => x._count.savedBy)),
  };
}

/**
 * Con sesión, cada bloque del inicio lee su parte por separado: si una tabla todavía no existe en la base
 * (una migración sin aplicar) o una consulta falla, ese bloque queda vacío y el error va al log, pero el inicio carga.
 */
async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[inicio] No se pudo cargar ${label}:`, error);
    return fallback;
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Las seis tarjetas del inicio, las mismas del celular de la portada. */
const MAIN_KEYS = new Set(["business", "tools", "pwn", "calendario", "kosher"]);

export default async function AppHome() {
  const hostKind = hostKindFor(headers().get("host"));
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  let today = todayIn(latamCountry(null).timezone);
  let upcoming: ReturnType<typeof upcomingGroups> = [];
  let companies: { slug: string; name: string; country: string; currency: string }[] = [];
  let activity: Awaited<ReturnType<typeof activityOf>> = null;
  if (userId) {
    const [locale, prefs, memberships, mine] = await Promise.all([
      safe("la zona horaria", () => userLocale(userId), null),
      safe("el calendario", () => getCalendarPrefs(userId), null),
      safe("las empresas", () =>
        prisma.businessMember.findMany({
          where: { userId },
          include: { workspace: { select: { slug: true, name: true, country: true, currency: true } } },
          orderBy: { createdAt: "asc" },
          take: 3,
        }),
        [],
      ),
      safe("la actividad", () => activityOf(userId), null),
    ]);
    activity = mine;
    if (locale) today = locale.today;
    // Los días seguidos de una misma fecha (Pésaj, Carnaval) van en una sola fila.
    upcoming = prefs ? upcomingGroups(prefs, today, 3) : [];
    companies = memberships.map((m) => m.workspace);
  }
  const firstName = (session?.user?.name ?? "").split(" ")[0];
  const company = companies[0] ?? null;
  const month = MONTHS[Number(today.slice(5, 7)) - 1];

  const tiles: { key: string; href: string; name: string; sub: string; glyph?: ModuleGlyphKey; star?: boolean }[] = [
    { key: "business", href: "/business", glyph: "business", name: "Business", sub: company ? `Planilla de ${month}` : "Equipo y planillas" },
    { key: "fidelizacion", href: company ? `/business/${company.slug}/fidelizacion` : "/business", glyph: "fidelizacion", name: "Fidelización", sub: "Clubes de clientes" },
    { key: "pwn", href: "/pwn", glyph: "pwn", name: "Pwn", sub: "Filtraciones y alertas" },
    { key: "kosher", href: "/kosher", star: true, name: "Kosher", sub: "Atlas, stock y kehilot" },
    { key: "calendario", href: "/calendario", glyph: "calendario", name: "Calendario", sub: upcoming[0]?.title ?? "Feriados y hebreo" },
    { key: "herramientas", href: "/herramientas", glyph: "herramientas", name: "Herramientas", sub: `${TOOL_ROUTES.length} herramientas` },
  ];
  const more = APP_SECTION_GROUPS.flatMap((g) => g.sections).filter((s) => !MAIN_KEYS.has(s.key) && (userId || !s.needsAccount));

  return (
    <div className="w-full pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container width="wide">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center gap-3">
            <img src="/images/logo.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="text-[0.95rem] text-[var(--text-secondary)]">{firstName ? "Hola," : longDay(today)}</p>
              <h1 className="truncate text-[1.75rem] font-bold leading-tight tracking-[-0.022em] text-[var(--text-primary)] sm:text-[2.25rem]">
                {firstName || "Mercav"}
              </h1>
            </div>
          </header>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="relative">
              <Mervi pose="saludando" scale={1} className="pointer-events-none absolute right-4 top-[calc(var(--mervi-unit)*-91)] z-10" />
              {userId ? (
                <Link
                  href={company ? `/business/${company.slug}` : "/business"}
                  className="mv-focus flex h-full flex-col justify-center rounded-[1.25rem] border border-gold/40 bg-[var(--mv-panel-sunk)] p-5 transition-colors duration-150 hover:border-gold/70"
                >
                  <p className="mv-kicker">{company ? "Tu negocio" : "Mercav Business"}</p>
                  <p className="mt-1.5 truncate text-[1.35rem] font-semibold tracking-[-0.012em] text-[var(--text-primary)]">
                    {company ? company.name : "Cargá tu negocio"}
                  </p>
                  <p className="text-[0.95rem] text-[var(--text-secondary)]">
                    {company ? `${latamCountry(company.country).name} · ${currencySymbol(company.country, company.currency)}` : "Equipo, planillas y fidelización en un solo lugar."}
                  </p>
                </Link>
              ) : (
                <div className="flex h-full flex-col gap-4 rounded-[1.25rem] border border-gold/40 bg-[var(--mv-panel-sunk)] p-5">
                  <div>
                    <p className="mv-kicker">Tu cuenta</p>
                    <p className="mt-1.5 text-[1.05rem] text-[var(--text-primary)]">Entrá para usar Business, el Calendario y tus mensajes.</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/login?callbackUrl=/inicio" className="mv-btn mv-btn-secondary mv-btn-sm">
                      Iniciar sesión
                    </Link>
                    <Link href="/register" className="mv-btn mv-btn-primary mv-btn-sm">
                      Crear cuenta
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <section aria-labelledby="inicio-proximas" className="mv-panel flex flex-col gap-1 p-5 pt-3">
              <Link href="/calendario" className="mv-focus -mx-2 flex min-h-11 items-center justify-between rounded-xl px-2 transition-colors hover:bg-[var(--mv-panel-hover)]">
                <span id="inicio-proximas" className="mv-kicker">
                  Próximas fechas
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
              </Link>
              {upcoming.length ? (
                <ul className="-mx-2 flex flex-col">
                  {upcoming.map((e) => (
                    <li key={e.id}>
                      {/* Cada fila abre el calendario en ese día. */}
                      <Link
                        href={`/calendario?fecha=${e.date}`}
                        className="mv-focus flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-[var(--mv-panel-hover)]"
                      >
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", calendarSource(e.source).dot)} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-[0.95rem] text-[var(--text-primary)]">{e.title}</span>
                        <span className="shrink-0 text-[0.85rem] tabular-nums text-[var(--text-secondary)]">{relativeRange(e.date, e.end, today)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[0.95rem] text-[var(--text-secondary)]">{userId ? "Elegí qué feriados querés ver." : "Feriados de tu país y calendario hebreo."}</p>
              )}
            </section>
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3" aria-label="Módulos">
            {tiles.map((t) => (
              <li key={t.key}>
                <SectionLink
                  href={t.href}
                  hostKind={hostKind}
                  className="mv-icon-host mv-panel mv-panel-interactive mv-focus flex h-full flex-col p-4 sm:p-5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]">
                    {t.star ? <StarOfDavid className="h-[22px] w-[22px]" /> : <ModuleGlyph name={t.glyph!} size={24} />}
                  </span>
                  <span className="mt-4 block text-[1.05rem] font-semibold leading-tight text-[var(--text-primary)]">{t.name}</span>
                  <span className="mt-0.5 block truncate text-[0.9rem] text-[var(--text-secondary)]">{t.sub}</span>
                </SectionLink>
              </li>
            ))}
          </ul>

          {activity ? (
            <section id="actividad" aria-labelledby="inicio-actividad" className="mt-10 scroll-mt-28">
              <h2 id="inicio-actividad" className="mv-kicker !text-[var(--text-tertiary)]">
                Tu actividad
              </h2>
              {activity.spaces + activity.services + activity.jobs > 0 ? (
                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Postulantes", value: String(activity.applicants), sub: "En tus vacantes" },
                    { label: "Visitas", value: activity.views >= 1000 ? `${(activity.views / 1000).toFixed(1)}k` : String(activity.views), sub: "De tus vacantes" },
                    {
                      label: "Ingresos",
                      value: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(activity.earnings),
                      sub: "Servicios y reservas",
                    },
                    { label: "Guardados", value: String(activity.saved), sub: "Personas interesadas" },
                  ].map((stat) => (
                    <div key={stat.label} className="mv-panel p-4">
                      <dt className="text-[0.85rem] text-[var(--text-secondary)]">{stat.label}</dt>
                      <dd className="mt-1 text-[1.35rem] font-semibold tabular-nums leading-tight text-[var(--text-primary)]">{stat.value}</dd>
                      <dd className="text-[0.8rem] text-[var(--text-tertiary)]">{stat.sub}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    // Abre la pestaña del tipo que tenés publicado; adentro se cambia entre espacios, servicios y vacantes.
                    href: activity.spaces ? "/anuncios/mis-espacios" : activity.services ? "/servicios/mis-servicios" : activity.jobs ? "/empleos/mis-empleos" : "/anuncios/mis-espacios",
                    icon: Megaphone,
                    label: "Mis publicaciones",
                    sub: `${plural(activity.spaces, "espacio", "espacios")} · ${plural(activity.services, "servicio", "servicios")} · ${plural(activity.jobs, "vacante", "vacantes")}`,
                  },
                  { href: "/dashboard/pedidos", icon: Clock, label: "Pedidos y ventas", sub: "Compras, ventas, pagos y reportes" },
                  { href: "/dashboard/postulantes", icon: UserCheck, label: "Postulantes", sub: "Candidatos de tus vacantes" },
                  // Una sola caja: la anterior se trae a la empresa desde Business, con todas sus ventas (/dashboard/pos sigue andando para quien la tenga guardada).
                  ...(activity.oldCaja ? [{ href: "/business", icon: ShoppingCart, label: "Traé tu caja anterior", sub: "Pasa a tu empresa con todas sus ventas" }] : []),
                  { href: "/soporte", icon: LifeBuoy, label: "Soporte", sub: "Escribinos si algo no anda" },
                ].map(({ href, icon: Icon, label, sub }) => (
                  <li key={href}>
                    <Link href={href} className="mv-panel mv-panel-interactive mv-focus flex h-full items-center gap-3 p-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.95rem] font-semibold text-[var(--text-primary)]">{label}</span>
                        <span className="block truncate text-[0.8rem] text-[var(--text-secondary)]">{sub}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {more.length ? (
            <section aria-labelledby="mas-en-mercav" className="mt-10">
              <h2 id="mas-en-mercav" className="mv-kicker !text-[var(--text-tertiary)]">
                Más en Mercav
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {more.map(({ key, href, label, desc, icon: Icon, isNew }) => (
                  <li key={key}>
                    <SectionLink
                      href={href}
                      hostKind={hostKind}
                      className="mv-panel mv-panel-interactive mv-focus flex h-full items-center gap-3 p-3"
                    >
                      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]">
                        <Icon className="h-5 w-5" aria-hidden />
                        {isNew ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-[var(--mv-panel)]" aria-label="Nuevo" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.95rem] font-semibold text-[var(--text-primary)]">{label}</span>
                        <span className="hidden truncate text-[0.8rem] text-[var(--text-secondary)] sm:block">{desc}</span>
                      </span>
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
