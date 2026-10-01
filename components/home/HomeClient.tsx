"use client";

import Link from "next/link";
import React, { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Check,
  CreditCard,
  FileText,
  Fingerprint,
  KeyRound,
  Lock,
  Megaphone,
  MessagesSquare,
  MonitorPlay,
  Search,
  Shield,
  Palette,
  Store,
  Wrench,
  MapPin,
  Clock,
  Layers,
  Radar,
} from "lucide-react";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { HeroBackground3D } from "@/components/ui/HeroBackground3D";
import { AuthHeroButton } from "@/components/ui/AuthHeroButton";
import { TransactionCard } from "@/components/home/TransactionCard";
import { KosherAtlasPreview, type KosherPreviewPlace } from "@/components/kosher/KosherHero";
import { Container, Reveal, Section, SectionHeading, buttonClass } from "@/components/site/primitives";

interface ActivityItem {
  id: string;
  type: "SERVICE" | "SPACE" | "JOB";
  title: string;
  location: string;
  price?: string;
  category: string;
  createdAt: Date;
  image?: string;
}

const EASE = [0.23, 1, 0.32, 1] as const;

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const RAIL = [
  { href: "/anuncios", label: "Ads", icon: Megaphone },
  { href: "/servicios", label: "Services", icon: MonitorPlay },
  { href: "/empleos", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/pos", label: "POS", icon: Store },
  { href: "/herramientas", label: "Tools", icon: Wrench },
  { href: "/pwn", label: "Pwn", icon: Shield },
  { href: "/kosher", label: "Kosher", icon: StarOfDavid },
];

export function HomeHero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <section aria-labelledby="home-hero" className="relative isolate flex min-h-[92svh] w-full flex-col overflow-hidden pt-28 md:min-h-[100svh] md:pt-32">
      <HeroBackground3D />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-32 bg-gradient-to-b from-bg-primary via-bg-primary/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-56 bg-gradient-to-b from-transparent to-bg-primary" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-[55%] bg-gradient-to-r from-bg-primary/80 via-bg-primary/40 to-transparent lg:block" />

      <Container className="relative z-10 flex flex-1 flex-col justify-center pb-10">
        <div className="max-w-[46rem]">
          <motion.p {...rise(0)} className="mv-kicker">
            Construido para Latinoamérica
          </motion.p>
          <motion.h1
            id="home-hero"
            initial={reduce ? false : { y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            className="mv-display mt-6"
          >
            Tu negocio entero,
            <br />
            <span className="mv-gold-text">en una sola cuenta.</span>
          </motion.h1>
          <motion.p {...rise(0.15)} className="mv-lead mt-6">
            Alquilá publicidad física, contratá talento con pagos por hitos, publicá vacantes, cobrá en tu local y vigilá la exposición
            de tu empresa. Todo desde Mercav.
          </motion.p>
          <motion.div {...rise(0.25)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <AuthHeroButton label="Crear cuenta gratis" className="sm:max-w-[24rem]" />
            <a href="#plataforma" className={buttonClass("secondary", "lg", "sm:h-16 md:h-20 md:px-8")}>
              Ver la plataforma
            </a>
          </motion.div>
        </div>
      </Container>

      <motion.div {...rise(0.4)} className="relative z-10 hidden pb-12 md:block">
        <Container>
          <nav aria-label="Módulos de Mercav" className="liquid-glass rounded-[1.5rem] p-1.5 md:rounded-full">
            <ul className="scrollbar-hide flex gap-1 overflow-x-auto md:justify-between">
              {RAIL.map(({ href, label, icon: Icon }) => (
                <li key={href} className="shrink-0 md:flex-1">
                  <Link
                    href={href}
                    className="group flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] focus-visible:bg-[var(--mv-panel-hover)] focus-visible:text-[var(--text-primary)]"
                  >
                    <Icon className="h-4 w-4 text-gold transition-transform duration-200 group-hover:scale-110" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Problem → answer                                                    */
/* ------------------------------------------------------------------ */

const FRICTIONS = [
  {
    icon: CreditCard,
    title: "Comisiones que se comen el margen",
    body: "Alquilar un espacio o vender un servicio suele dejar un porcentaje en cada intermediario.",
    answer: "Tu primer alquiler en Ads no paga comisión de plataforma.",
  },
  {
    icon: Lock,
    title: "Pagar sin garantía",
    body: "Contratar a alguien que no conocés significa adelantar dinero y esperar que cumpla.",
    answer: "Services libera el pago hito por hito, cuando el trabajo se entrega.",
  },
  {
    icon: Layers,
    title: "Diez herramientas, diez cuentas",
    body: "Publicidad, empleo, caja y contratos viven en sistemas que no se hablan entre sí.",
    answer: "Una cuenta Mercav abre todos los módulos con el mismo perfil.",
  },
  {
    icon: Radar,
    title: "Exposición que nadie vigila",
    body: "Los correos y dominios de una empresa aparecen en filtraciones sin que nadie se entere.",
    answer: "Pwn consulta fuentes públicas y te avisa cuando aparece algo tuyo.",
  },
];

export function HomeProblem() {
  return (
    <Section labelledBy="home-problem">
      <Container>
        <SectionHeading
          id="home-problem"
          kicker="El problema"
          title="Hacer crecer un negocio no debería costar tanta fricción."
          lead="Cuatro cosas que vemos repetirse en Latinoamérica, y cómo las resuelve Mercav."
        />
        <ul className="mt-14 grid gap-4 md:grid-cols-2">
          {FRICTIONS.map(({ icon: Icon, title, body, answer }, i) => (
            <Reveal as="li" key={title} delay={i * 60} className="mv-panel flex flex-col overflow-hidden">
              <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mv-h3">{title}</h3>
                <p className="mv-body">{body}</p>
              </div>
              <p className="flex items-start gap-3 border-t border-[var(--mv-hairline)] bg-[var(--mv-gold-wash)] px-6 py-4 text-sm font-medium text-[var(--text-primary)] md:px-8">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {answer}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Platform: modules as an interactive tablist                         */
/* ------------------------------------------------------------------ */

function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">{children}</p>;
}

function MilestonePreview() {
  const steps = [
    { label: "Diseño de marca", state: "Liberado", tone: "done" },
    { label: "Sitio web", state: "En revisión", tone: "active" },
    { label: "Campaña de lanzamiento", state: "Retenido", tone: "idle" },
  ];
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="liquid-glass rounded-[1.5rem] p-5 md:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Contrato por hitos</p>
          <span className="mv-chip mv-chip-gold">Escrow</span>
        </div>
        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3 rounded-2xl border border-[var(--mv-hairline)] px-4 py-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  s.tone === "done" ? "bg-gold text-[var(--mv-on-gold)]" : s.tone === "active" ? "border border-gold text-gold" : "border border-[var(--mv-hairline-strong)] text-[var(--text-tertiary)]"
                }`}
              >
                {s.tone === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{s.label}</span>
              <span className={`text-xs font-medium ${s.tone === "done" ? "text-gold" : "text-[var(--text-secondary)]"}`}>{s.state}</span>
            </li>
          ))}
        </ol>
      </div>
      <Caption>Ejemplo ilustrativo</Caption>
    </div>
  );
}

function JobsPreview() {
  const stages = [
    { label: "Postulaciones", w: "100%" },
    { label: "Revisadas", w: "62%" },
    { label: "Entrevista", w: "28%" },
  ];
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="liquid-glass rounded-[1.5rem] p-5 md:p-6">
        <p className="text-xs text-[var(--text-secondary)]">Vacante</p>
        <p className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)]">Encargada de ventas</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="mv-chip">Tiempo completo</span>
          <span className="mv-chip">Presencial</span>
        </div>
        <div className="mt-6 space-y-3">
          {stages.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>{s.label}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--mv-panel-hover)]">
                <div className="h-full rounded-full bg-gold/80" style={{ width: s.w }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Caption>Ejemplo ilustrativo</Caption>
    </div>
  );
}

function PosPreview() {
  const lines = [
    { name: "Café americano", qty: 2, price: "6,00" },
    { name: "Medialuna", qty: 3, price: "4,50" },
    { name: "Agua mineral", qty: 1, price: "1,80" },
  ];
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="liquid-glass rounded-[1.5rem] p-5 md:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Venta en caja</p>
          <span className="mv-data text-xs text-[var(--text-tertiary)]">Ticket 0042</span>
        </div>
        <ul className="mt-4 divide-y divide-[var(--mv-hairline)]">
          {lines.map((l) => (
            <li key={l.name} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-[var(--text-primary)]">
                <span className="mv-data mr-2 text-[var(--text-tertiary)]">{l.qty}×</span>
                {l.name}
              </span>
              <span className="mv-data text-[var(--text-secondary)]">{l.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-end justify-between border-t border-dashed border-[var(--mv-hairline-strong)] pt-4">
          <span className="text-sm text-[var(--text-secondary)]">Total</span>
          <span className="mv-data text-2xl font-medium text-gold">12,30</span>
        </div>
      </div>
      <Caption>Ejemplo ilustrativo · cualquier rubro, cualquier moneda</Caption>
    </div>
  );
}

function ToolsPreview() {
  const tools = [
    { icon: FileText, name: "Generador de contratos" },
    { icon: Layers, name: "Calculadora de ROI" },
    { icon: Search, name: "Analizador SEO" },
    { icon: CreditCard, name: "Simulador de precios" },
    { icon: Palette, name: "Generador de paletas" },
    { icon: MessagesSquare, name: "Prompts para IA" },
  ];
  return (
    <ul className="mx-auto grid w-full max-w-md grid-cols-2 gap-2">
      {tools.map(({ icon: Icon, name }) => (
        <li key={name} className="liquid-glass flex items-center gap-3 rounded-2xl p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-[13px] font-medium leading-tight text-[var(--text-primary)]">{name}</span>
        </li>
      ))}
    </ul>
  );
}

function PwnPreview({ sources }: { sources: string[] }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="liquid-glass rounded-[1.5rem] p-5 md:p-6">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Consultar exposición</p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
          <span className="mv-data text-sm text-[var(--text-secondary)]">tuempresa.com</span>
        </div>
        <p className="mt-5 text-xs text-[var(--text-secondary)]">Fuentes consultadas</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {sources.slice(0, 7).map((s) => (
            <li key={s} className="mv-chip">
              {s}
            </li>
          ))}
          {sources.length > 7 && <li className="mv-chip mv-chip-gold">+{sources.length - 7}</li>}
        </ul>
      </div>
    </div>
  );
}

type ModuleDef = {
  key: string;
  group: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  does: string;
  solves: string;
  gets: string[];
  preview: ReactNode;
};

export function HomePlatform({ pwnSources, kosherPreview }: { pwnSources: string[]; kosherPreview: KosherPreviewPlace[] }) {
  const modules: ModuleDef[] = [
    {
      key: "ads",
      group: "Vender",
      name: "Ads",
      icon: Megaphone,
      href: "/anuncios",
      does: "Un catálogo de vallas, pantallas y vidrieras para alquilar con reserva por fechas.",
      solves: "Encontrar y pagar publicidad física sin llamar a diez intermediarios.",
      gets: ["Primer alquiler sin comisión de plataforma", "Calendario de disponibilidad", "Pago con tarjeta vía Stripe"],
      preview: <TransactionCard />,
    },
    {
      key: "services",
      group: "Contratar",
      name: "Services",
      icon: MonitorPlay,
      href: "/servicios",
      does: "Un mercado de talento digital con paquetes y contratos divididos en hitos.",
      solves: "El riesgo de adelantar todo el pago a alguien que no conocés.",
      gets: ["Pago retenido hasta cada entrega", "Paquetes con precio claro", "Reseñas de clientes reales"],
      preview: <MilestonePreview />,
    },
    {
      key: "jobs",
      group: "Contratar",
      name: "Jobs",
      icon: Briefcase,
      href: "/empleos",
      does: "Publicación de vacantes y gestión de postulantes desde tu panel.",
      solves: "Vacantes dispersas en grupos y planillas sin seguimiento.",
      gets: ["Postulaciones ordenadas por vacante", "Salario visible u oculto, a tu elección", "El mismo perfil para postular"],
      preview: <JobsPreview />,
    },
    {
      key: "pos",
      group: "Operar",
      name: "POS",
      icon: Store,
      href: "/dashboard/pos",
      does: "Caja, inventario y reportes para cualquier rubro, desde el navegador.",
      solves: "Pagar un sistema aparte para cobrar en el local.",
      gets: ["Escáner de códigos con la cámara", "Inventario y reportes de ventas", "Moneda y sucursal configurables"],
      preview: <PosPreview />,
    },
    {
      key: "tools",
      group: "Operar",
      name: "Tools",
      icon: Wrench,
      href: "/herramientas",
      does: "Herramientas de trabajo diario: contratos, cálculos, SEO, precios y prompts.",
      solves: "Pagar una suscripción distinta por cada pequeña tarea.",
      gets: ["Contratos listos para firmar", "Reportes exportables", "Incluidas según tu plan"],
      preview: <ToolsPreview />,
    },
    {
      key: "pwn",
      group: "Proteger",
      name: "Pwn",
      icon: Shield,
      href: "/pwn",
      does: "Ciberinteligencia defensiva: exposición de correos y dominios, filtraciones, CVE y alertas.",
      solves: "Enterarte tarde de que datos de tu empresa circulan en una filtración.",
      gets: ["Consulta abierta de correo o dominio", "Seguimiento de objetivos verificados", "Cada hallazgo cita su fuente"],
      preview: <PwnPreview sources={pwnSources} />,
    },
    {
      key: "kosher",
      group: "Comunidad",
      name: "Kosher",
      icon: StarOfDavid,
      href: "/kosher",
      does: "Atlas de lugares kosher, sinagogas y kehilot, con stock por sucursal y chat por ciudad.",
      solves: "Saber dónde comer, comprar y rezar al llegar a una ciudad.",
      gets: ["Mapa con el estado de cada lugar", "Modo Shabat de solo lectura", "No emite hechsher: muestra la fuente"],
      preview:
        kosherPreview.length > 0 ? (
          <div className="mx-auto w-full max-w-md">
            <KosherAtlasPreview preview={kosherPreview} />
          </div>
        ) : null,
    },
  ];

  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = modules[active];

  function select(i: number) {
    setActive(i);
    tabRefs.current[i]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next = active;
    if (e.key in keys) next = (active + keys[e.key] + modules.length) % modules.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = modules.length - 1;
    else return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <Section id="plataforma" tone="raised" labelledBy="home-platform">
      <Container>
        <SectionHeading
          id="home-platform"
          kicker="La plataforma"
          title="Siete módulos. Una cuenta. El mismo perfil en todos."
          lead="Cada módulo resuelve un trabajo concreto. Elegí uno para ver qué hace, qué problema resuelve y qué te llevás."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
          <div role="tablist" aria-label="Módulos" aria-orientation="vertical" onKeyDown={onKey} className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:[mask-image:none]">
            {modules.map((m, i) => {
              const on = i === active;
              const Icon = m.icon;
              const showGroup = i === 0 || modules[i - 1].group !== m.group;
              return (
                <div key={m.key} role="presentation" className="contents">
                  {showGroup && <p aria-hidden className="hidden px-3 pb-1 pt-4 text-xs font-semibold text-[var(--text-tertiary)] first:pt-0 lg:block">{m.group}</p>}
                  <button
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    role="tab"
                    id={`${baseId}-tab-${m.key}`}
                    aria-selected={on}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => select(i)}
                    className={`mv-focus relative flex h-11 shrink-0 items-center gap-3 rounded-full px-4 text-left text-sm font-semibold transition-colors duration-200 lg:h-12 lg:rounded-2xl ${
                      on ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId={reduce ? undefined : `${baseId}-pill`}
                        className="liquid-glass absolute inset-0 rounded-[inherit]"
                        transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                      />
                    )}
                    <Icon className={`relative h-4 w-4 ${on ? "text-gold" : ""}`} aria-hidden />
                    <span className="relative">Mercav {m.name}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${current.key}`} className="mv-panel min-h-[34rem] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.key}
                initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.22, ease: EASE }}
                className="grid h-full gap-8 p-6 md:p-10 xl:grid-cols-[1fr_1fr] xl:items-center"
              >
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="text-sm text-[var(--text-tertiary)]">{current.group}</p>
                    <h3 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Mercav {current.name}</h3>
                  </div>
                  <dl className="grid gap-5">
                    <div>
                      <dt className="text-xs font-semibold text-gold">Qué hace</dt>
                      <dd className="mv-body mt-1 text-[var(--text-primary)]">{current.does}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gold">Qué resuelve</dt>
                      <dd className="mv-body mt-1">{current.solves}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gold">Qué obtenés</dt>
                      <dd className="mt-2">
                        <ul className="grid gap-2">
                          {current.gets.map((g) => (
                            <li key={g} className="flex items-start gap-2.5 text-[15px] text-[var(--text-primary)]">
                              <Check className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                  <Link href={current.href} className={buttonClass("secondary", "md", "w-fit")}>
                    Abrir Mercav {current.name}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                {current.preview ? <div className="min-w-0">{current.preview}</div> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Capabilities shared by every module                                 */
/* ------------------------------------------------------------------ */

const CAPABILITIES = [
  {
    icon: CreditCard,
    title: "Pagos con Stripe",
    body: "Cobros con tarjeta procesados por Stripe. Mercav no guarda los datos de tu tarjeta.",
    span: "md:col-span-2",
  },
  {
    icon: Fingerprint,
    title: "Verificación en dos pasos",
    body: "Activala desde tu perfil para que una contraseña sola no alcance.",
    span: "",
  },
  {
    icon: KeyRound,
    title: "Contraseñas que no viajan",
    body: "Al comprobar una contraseña en Pwn, el hash se calcula en tu navegador y solo salen sus primeros cinco caracteres.",
    span: "",
  },
  {
    icon: MessagesSquare,
    title: "Mensajes y feed",
    body: "Hablá con clientes, candidatos y proveedores sin salir de la plataforma.",
    span: "",
  },
  {
    icon: Search,
    title: "Una búsqueda para todo",
    body: "Espacios, servicios, vacantes y perfiles desde un mismo buscador.",
    span: "md:col-span-2 lg:col-span-1",
  },
];

export function HomeCapabilities() {
  return (
    <Section labelledBy="home-capabilities">
      <Container>
        <SectionHeading
          id="home-capabilities"
          kicker="En todos los módulos"
          title="Lo que viene incluido, sin configurarlo."
        />
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body, span }, i) => (
            <Reveal as="li" key={title} delay={i * 50} className={`mv-panel mv-panel-interactive group flex flex-col gap-4 p-6 md:p-7 ${span}`}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold transition-transform duration-300 group-hover:-translate-y-0.5">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mv-h3">{title}</h3>
              <p className="mv-body">{body}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Pwn spotlight                                                       */
/* ------------------------------------------------------------------ */

export function HomeSecurity({ sources }: { sources: string[] }) {
  const steps = [
    { title: "Consultá", body: "Escribí un correo o un dominio. La consulta es abierta y no exige demostrar propiedad." },
    { title: "Seguí", body: "Verificá los objetivos que son tuyos para monitorearlos de forma continua." },
    { title: "Recibí la alerta", body: "Cuando una fuente publica algo que te afecta, te llega con el nombre de la fuente y qué hacer." },
  ];
  return (
    <Section tone="raised" labelledBy="home-security">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <SectionHeading
              id="home-security"
              kicker="Mercav Pwn"
              title="Seguridad incluida en la misma cuenta."
              lead="Ciberinteligencia defensiva para empresas y gobierno. Pwn cruza fuentes públicas de filtraciones, vulnerabilidades y noticias para decirte qué te afecta."
            />
            <ol className="mt-10 grid gap-5">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 70} className="flex gap-4">
                  <span className="mv-data grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/40 text-sm text-gold">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{s.title}</p>
                    <p className="mv-body mt-1">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/pwn/exposure" className={buttonClass("primary", "md")}>
                Consultar exposición
              </Link>
              <Link href="/pwn" className={buttonClass("ghost", "md")}>
                Conocer Pwn
              </Link>
            </div>
          </div>

          <Reveal>
            <div className="liquid-glass relative overflow-hidden rounded-[2rem] p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Fuentes que consulta Pwn</p>
                <span className="mv-chip mv-chip-gold mv-data">{sources.length}</span>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sources.slice(0, 12).map((s) => (
                  <li key={s} className="flex items-center gap-2.5 rounded-xl border border-[var(--mv-hairline)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                    <span className="truncate">{s}</span>
                  </li>
                ))}
              </ul>
              {sources.length > 12 && (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Y {sources.length - 12} más.{" "}
                  <Link href="/pwn/sources" className="mv-link">
                    Ver todas las fuentes
                  </Link>
                </p>
              )}
              <div className="mv-divider my-6" />
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[var(--text-secondary)]">Ciclo de análisis</dt>
                  <dd className="mt-1 font-semibold text-[var(--text-primary)]">Cada hora</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-secondary)]">Señales de foros</dt>
                  <dd className="mt-1 font-semibold text-[var(--text-primary)]">Cada 10 minutos</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Latest activity (real listings only)                                */
/* ------------------------------------------------------------------ */

const TYPE_LABEL = { SPACE: "Anuncio", SERVICE: "Servicio", JOB: "Vacante" } as const;
const TYPE_ICON = { SPACE: Megaphone, SERVICE: MonitorPlay, JOB: Briefcase } as const;
const TYPE_HREF = { SPACE: "/anuncios", SERVICE: "/servicios", JOB: "/empleos" } as const;

function daysAgo(date: Date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

export function HomeLatestActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Section labelledBy="home-activity">
      <Container>
        <SectionHeading
          id="home-activity"
          kicker="Ahora en Mercav"
          title="Lo último publicado."
          action={
            items.length > 0 ? (
              <Link href="/explorar" className={buttonClass("secondary", "sm")}>
                Explorar todo
              </Link>
            ) : undefined
          }
        />

        {items.length === 0 ? (
          <Reveal className="mv-panel mt-12 flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h3 className="mv-h3">Todavía no hay publicaciones activas.</h3>
              <p className="mv-body mt-2 max-w-lg">Publicá un espacio, un servicio o una vacante y aparecé acá para todo el ecosistema.</p>
            </div>
            <Link href="/publicar" className={buttonClass("primary", "md")}>
              Publicar ahora
            </Link>
          </Reveal>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const Icon = TYPE_ICON[item.type];
              return (
                <Reveal as="li" key={item.id} delay={i * 50}>
                  <Link href={`${TYPE_HREF[item.type]}/${item.id}`} className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[16/9] overflow-hidden bg-bg-tertiary">
                      {item.image ? (
                        <img src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[var(--text-tertiary)]">
                          <Icon className="h-10 w-10 opacity-40" aria-hidden />
                        </div>
                      )}
                      <span className="liquid-glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">{TYPE_LABEL[item.type]}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <p className="text-xs font-medium capitalize text-gold">{item.category.toLowerCase()}</p>
                      <h3 className="line-clamp-2 font-semibold text-[var(--text-primary)]">{item.title}</h3>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {item.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {daysAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="mv-data border-t border-[var(--mv-hairline)] pt-3 text-base text-[var(--text-primary)]">{item.price || "Consultar"}</p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust: only things a visitor can check                              */
/* ------------------------------------------------------------------ */

export function HomeTrust({ facts }: { facts: { value: string; label: string }[] }) {
  const principles = [
    { title: "Cada dato cita su fuente", body: "Pwn y Kosher muestran de dónde salió cada hallazgo o cada estado. Una afirmación sin verificar no se presenta como hecho." },
    { title: "Tu primer alquiler, sin comisión", body: "En Ads, el primer alquiler de cada espacio no paga comisión de plataforma." },
    { title: "Hay una persona detrás", body: "Mercav lo construye su fundador desde Santa Cruz. Podés leer quién es y escribirle." },
  ];
  const stack = ["Stripe", "Have I Been Pwned", "NVD", "CISA KEV", "MapLibre", "PostgreSQL"];

  return (
    <Section labelledBy="home-trust">
      <Container>
        <SectionHeading
          id="home-trust"
          kicker="Confianza"
          title="Lo que podés comprobar por tu cuenta."
          lead="Sin logos prestados ni cifras infladas. Estos datos salen de la plataforma en vivo."
        />

        {facts.length > 0 && (
          <Reveal as="dl" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-[var(--mv-hairline)] py-10 md:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-[var(--text-secondary)]">{f.label}</dt>
                <dd className="font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums md:text-5xl">{f.value}</dd>
              </div>
            ))}
          </Reveal>
        )}

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 60} className="mv-panel p-6 md:p-7">
              <h3 className="mv-h3">{p.title}</h3>
              <p className="mv-body mt-3">{p.body}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--text-secondary)]">Construido sobre</p>
          <ul className="flex flex-wrap gap-2">
            {stack.map((s) => (
              <li key={s} className="mv-chip">
                {s}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="mt-8">
          <Link href="/nosotros" className="mv-link inline-flex items-center gap-1.5 text-sm">
            Conocer al fundador
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

export function HomeCTA() {
  return (
    <Section labelledBy="home-cta">
      <Container>
        <Reveal>
          <div className="liquid-glass relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-10 md:rounded-[2.75rem] md:py-24">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-48 mx-auto h-96 max-w-3xl rounded-full bg-gold/20 blur-[100px]" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <h2 id="home-cta" className="mv-h2">
                Abrí tu cuenta y empezá por el módulo que necesitás hoy.
              </h2>
              <p className="mv-lead mx-auto">Crear la cuenta es gratis. Los demás módulos te esperan con el mismo perfil.</p>
              <div className="mt-2 w-full max-w-md">
                <AuthHeroButton label="Crear cuenta gratis" />
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="mv-link">
                  Iniciá sesión
                </Link>
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
// creado por pato dev y askforvini
