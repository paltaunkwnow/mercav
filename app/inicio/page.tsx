import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
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

/** Las seis tarjetas del inicio, las mismas del celular de la portada. */
const MAIN_KEYS = new Set(["business", "tools", "pwn", "calendario", "kosher"]);

export default async function AppHome() {
  const hostKind = hostKindFor(headers().get("host"));
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  let today = todayIn(latamCountry(null).timezone);
  let upcoming: ReturnType<typeof upcomingGroups> = [];
  let companies: { slug: string; name: string; country: string; currency: string }[] = [];
  if (userId) {
    const [locale, prefs, memberships] = await Promise.all([
      userLocale(userId),
      getCalendarPrefs(userId),
      prisma.businessMember.findMany({
        where: { userId },
        include: { workspace: { select: { slug: true, name: true, country: true, currency: true } } },
        orderBy: { createdAt: "asc" },
        take: 3,
      }),
    ]);
    today = locale.today;
    // Los días seguidos de una misma fecha (Pésaj, Carnaval) van en una sola fila.
    upcoming = upcomingGroups(prefs, today, 3);
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
