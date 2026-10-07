import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Globe2,
  Layers,
  Megaphone,
  MonitorPlay,
  Shield,
  Store,
  UserRound,
  Wrench,
} from "lucide-react";
import { ButtonLink, Container, Reveal, Section, SectionHeading, buttonClass } from "@/components/site/primitives";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { FOUNDERS } from "@/lib/data/team";

const SNAPSHOT = [
  { k: "Etapa", v: "Búsqueda de capital semilla" },
  { k: "Inversión", v: "Sin inversión externa hasta hoy" },
  { k: "Fundada", v: "2026" },
  { k: "Sede", v: "Santa Cruz de la Sierra, Bolivia" },
];

const PROBLEMS = [
  { market: "Publicidad física", body: "Alquilar una valla o una pantalla todavía depende de conocer al dueño. No hay un canal digital para reservar y pagar." },
  { market: "Talento", body: "Quien trabaja por proyecto compite en plataformas extranjeras, en inglés, con precios en dólares y comisiones que no piensan en la región." },
  { market: "Comercio", body: "Un negocio paga por separado la caja, la bolsa de empleo y cada herramienta. Nada comparte la misma cuenta ni los mismos datos." },
];

const MODULES = [
  { icon: Megaphone, name: "Ads", desc: "Vallas, pantallas y vidrieras para alquilar por fechas", route: "/anuncios" },
  { icon: MonitorPlay, name: "Services", desc: "Talento digital con paquetes y pago con tarjeta", route: "/servicios" },
  { icon: Briefcase, name: "Jobs", desc: "Vacantes, postulaciones y seguimiento de candidatos", route: "/empleos" },
  { icon: Store, name: "POS", desc: "Caja para cualquier rubro, con inventario y cola offline", route: "/dashboard/pos" },
  { icon: Wrench, name: "Tools", desc: "ROI, contratos, SEO, tarifas, paletas y prompts", route: "/herramientas" },
  { icon: Shield, name: "Pwn", desc: "Ciberinteligencia defensiva: exposición, filtraciones y CVE", route: "/pwn" },
  { icon: StarOfDavid, name: "Kosher", desc: "Atlas de lugares y kehilot. Informa con fuente; no emite hechsher", route: "/kosher" },
];

const PLANS = [
  { name: "Free", who: "Para explorar la plataforma", price: "$0" },
  { name: "Profesional", who: "Freelancers y profesionales", price: "$9.99" },
  { name: "Empresa", who: "Agencias y negocios", price: "$29" },
  { name: "Elite", who: "La suite completa para escalar", price: "$79" },
];

const FEES = [
  { name: "Services", detail: "Se retiene cuando Stripe confirma el pago del pedido.", value: "12 %" },
  { name: "Ads", detail: "5 % lo paga el anunciante y 5 % el dueño. El dueño no paga en el primer alquiler de cada espacio.", value: "10 %" },
  { name: "Facturación anual", detail: "Sobre el precio mensual de cualquier plan pago.", value: "−20 %" },
];

const EDGE = [
  { icon: Layers, title: "Cada módulo trae usuarios al siguiente", desc: "Quien entra por la caja encuentra empleo, talento y publicidad sin registrarse de nuevo." },
  { icon: Globe2, title: "Hecho para la región", desc: "En español desde la primera línea y con planes pensados para la economía latinoamericana." },
  { icon: Shield, title: "La seguridad es parte del producto", desc: "2FA, ciberinteligencia defensiva propia y un equipo que trabaja seguridad. La confianza también se vende." },
];

const LIVE = [
  "Plataforma en producción en mercav.lat",
  "Pagos con Stripe en Ads, Services y planes",
  "Login con correo o Google y 2FA opcional",
  "POS con cola offline si se corta la red",
  "Subdominios propios: pwn.mercav.lat y kosher.mercav.lat",
];

/** Grouped inset list, the same shape people know from Settings. Content layer: standard panel, never glass. */
const groupCls = "mv-panel overflow-hidden rounded-[1.5rem]";
const groupLabelCls = "mb-3 px-1 text-sm font-semibold text-[var(--text-secondary)]";
const insetRule = "border-t border-[var(--mv-hairline)]";

export default function PitchPage() {
  return (
    <div className="w-full bg-bg-primary">
      {/* Hero */}
      <header className="relative w-full overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mv-aura" aria-hidden />
        <Container className="relative">
          <Reveal className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="mv-kicker">Pitch</p>
              <h1 className="mv-h1 mt-5">
                Una sola cuenta para trabajar y vender en <span className="mv-gold-text">Latinoamérica.</span>
              </h1>
              <p className="mv-lead mt-6">
                Mercav reúne publicidad física, talento digital, empleo, caja, herramientas y ciberinteligencia defensiva en una plataforma hecha desde Santa Cruz de la Sierra.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/inversores#contacto-inversores" size="lg" className="w-full sm:w-auto">
                  Hablar con el equipo <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                <a href="#equipo" className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
                  Ver el equipo
                </a>
              </div>
            </div>
            <dl className={groupCls}>
              {SNAPSHOT.map((f, i) => (
                <div key={f.k} className={`flex flex-col gap-0.5 px-5 py-4 ${i > 0 ? insetRule : ""}`}>
                  <dt className="text-xs text-[var(--text-tertiary)]">{f.k}</dt>
                  <dd className="text-[0.9375rem] font-medium text-[var(--text-primary)]">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </header>

      {/* 1. Problema */}
      <Section tone="raised" labelledBy="pitch-problema">
        <Container>
          <SectionHeading
            id="pitch-problema"
            kicker="01 · El problema"
            title="Tres mercados que siguen operando sin infraestructura."
            lead="La demanda existe. Lo que falta es una plataforma regional que la ordene."
          />
          <ul className="mt-14 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <li key={p.market} className="flex flex-col gap-3 border-t border-[var(--mv-hairline-strong)] pt-6">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{p.market}</h3>
                <p className="mv-body">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 2. Producto: la cuenta es la tesis */}
      <Section labelledBy="pitch-producto">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                id="pitch-producto"
                kicker="02 · El producto"
                title="Siete módulos. Una cuenta."
                lead="Mismo login, mismo perfil y mismo medio de pago en todo el ecosistema."
              />
              <ButtonLink href="/" tone="secondary" className="mt-8">
                Abrir Mercav <ArrowUpRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>

            <div className={groupCls}>
              <div className="flex items-center gap-4 px-5 py-5 md:px-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-[#050505]" aria-hidden>
                  <UserRound className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">Tu cuenta Mercav</p>
                  <p className="text-sm text-[var(--text-secondary)]">Correo o Google · 2FA opcional</p>
                </div>
              </div>
              <ul aria-label="Módulos incluidos en la cuenta" className={insetRule}>
                {MODULES.map(({ icon: Icon, name, desc, route }, i) => (
                  <Reveal as="li" key={name} delay={Math.min(i * 45, 270)} className="flex gap-4 pl-5 md:pl-6">
                    <span
                      className="mt-4 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[color-mix(in_srgb,var(--text-primary)_7%,transparent)] text-[var(--text-primary)]"
                      aria-hidden
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className={`flex min-w-0 flex-1 flex-col gap-0.5 py-4 pr-5 sm:flex-row sm:items-center sm:gap-4 md:pr-6 ${i > 0 ? insetRule : ""}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">Mercav {name}</p>
                        <p className="text-sm leading-6 text-[var(--text-secondary)]">{desc}</p>
                      </div>
                      <span className="mv-data shrink-0 text-xs text-[var(--text-tertiary)]">{route}</span>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* 3. Modelo de negocio */}
      <Section tone="raised" labelledBy="pitch-modelo">
        <Container>
          <SectionHeading
            id="pitch-modelo"
            kicker="03 · Modelo de negocio"
            title="Suscripciones y comisiones desde el primer día."
            lead="El plan que paga cada cuenta y la comisión de cada transacción crecen juntos."
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-8">
            <div>
              <h3 className={groupLabelCls}>Planes por mes</h3>
              <ul className={groupCls}>
                {PLANS.map((p, i) => (
                  <li key={p.name} className={`flex items-center justify-between gap-4 px-5 py-4 md:px-6 ${i > 0 ? insetRule : ""}`}>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{p.who}</p>
                    </div>
                    <p className="shrink-0 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">{p.price}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 px-1 text-sm text-[var(--text-tertiary)]">
                Detalle de cada plan en{" "}
                <Link href="/precios" className="mv-link">
                  precios
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className={groupLabelCls}>Comisiones</h3>
              <ul className={groupCls}>
                {FEES.map((f, i) => (
                  <li key={f.name} className={`flex items-start justify-between gap-4 px-5 py-4 md:px-6 ${i > 0 ? insetRule : ""}`}>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">{f.detail}</p>
                    </div>
                    <p className="shrink-0 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">{f.value}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* 4. Ventaja y estado */}
      <Section labelledBy="pitch-ventaja">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <SectionHeading id="pitch-ventaja" kicker="04 · Por qué puede ganar" title="La ventaja está en la integración." />
              <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
                {EDGE.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex flex-col gap-3 border-t border-[var(--mv-hairline-strong)] pt-6">
                    <Icon className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden />
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
                    <p className="mv-body">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:pt-20">
              <h3 className={groupLabelCls}>Lo que ya funciona</h3>
              <ul className={groupCls}>
                {LIVE.map((item, i) => (
                  <li key={item} className={`flex items-center gap-3 px-5 py-4 ${i > 0 ? insetRule : ""}`}>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--mv-gold-ink)]" aria-hidden />
                    <span className="text-[0.9375rem] text-[var(--text-primary)]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 px-1 text-sm text-[var(--text-tertiary)]">El producto no es una maqueta: esto corre hoy, con cuentas y pagos reales.</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* 5. Equipo */}
      <Section tone="raised" id="equipo" labelledBy="pitch-equipo">
        <Container>
          <SectionHeading
            id="pitch-equipo"
            kicker="05 · Equipo"
            title="Tres cofundadores, un mismo producto."
            lead="El equipo que diseña, construye y opera Mercav desde Santa Cruz de la Sierra."
          />
          <ul className="mt-14 grid gap-4 md:grid-cols-3">
            {FOUNDERS.map((m, i) => (
              <Reveal as="li" key={m.name} delay={i * 60} className="mv-panel flex items-center gap-4 rounded-[1.5rem] p-5 md:flex-col md:items-start md:p-6">
                <span
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] font-display text-lg font-semibold text-[var(--text-primary)]"
                >
                  {m.initials}
                </span>
                <div className="min-w-0 md:mt-2">
                  <h3 className="text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)]">{m.name}</h3>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{m.role} · Cofundador</p>
                  {m.profile ? (
                    <Link href={m.profile} className="mv-link mt-3 inline-flex items-center gap-1 text-sm">
                      Ver perfil <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Cierre: una acción principal */}
      <Section labelledBy="pitch-cierre">
        <Container width="narrow">
          <Reveal className="flex flex-col items-center gap-5 text-center">
            <h2 id="pitch-cierre" className="mv-h2">
              Hablemos.
            </h2>
            <p className="mv-lead mx-auto">Buscamos capital semilla y socios que conozcan la región. El contacto pasa por la página de inversores.</p>
            <div className="mt-3 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <ButtonLink href="/inversores#contacto-inversores" size="lg" className="w-full sm:w-auto">
                Contactar al equipo <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/inversores#tesis" tone="ghost" size="lg" className="w-full sm:w-auto">
                Leer la tesis
              </ButtonLink>
            </div>
            <p className="max-w-md text-xs text-[var(--text-tertiary)]">
              Esta página tiene fines informativos. Cualquier inversión se formaliza con documentación y acuerdos legales.
            </p>
          </Reveal>
        </Container>
      </Section>
    </div>
  );
}
// creado por pato dev y askforvini
