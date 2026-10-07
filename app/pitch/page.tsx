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
  Wrench,
} from "lucide-react";
import { ButtonLink, CTABand, Container, Fact, Reveal, Section, SectionHeading, buttonClass } from "@/components/site/primitives";
import { StarOfDavid } from "@/components/site/StarOfDavid";

const SNAPSHOT = [
  { k: "Etapa", v: "Búsqueda de capital semilla" },
  { k: "Inversión", v: "Sin inversión externa hasta hoy" },
  { k: "Fundada", v: "2026" },
  { k: "Sede", v: "Santa Cruz de la Sierra, Bolivia" },
];

const PROBLEMS = [
  "Alquilar una valla o una pantalla todavía depende de conocer al dueño. La publicidad física no tiene un canal digital para reservar y pagar.",
  "El talento de la región compite en plataformas extranjeras, en inglés, con precios en dólares y comisiones que no piensan en Latinoamérica.",
  "Un comercio paga por separado la caja, la bolsa de empleo y cada herramienta. Nada comparte la misma cuenta ni los mismos datos.",
];

const MODULES = [
  { icon: Megaphone, name: "Ads", desc: "Vallas, pantallas y vidrieras para alquilar por fechas, con pago por Stripe." },
  { icon: MonitorPlay, name: "Services", desc: "Talento digital con paquetes y precio claro. El cliente paga con tarjeta." },
  { icon: Briefcase, name: "Jobs", desc: "Vacantes, postulaciones y seguimiento de candidatos con la misma cuenta." },
  { icon: Store, name: "POS", desc: "Caja en el navegador para cualquier rubro: turnos, inventario, reportes y cola offline." },
  { icon: Wrench, name: "Tools", desc: "ROI, contratos, SEO, tarifas, paletas y prompts, sin instalar nada." },
  { icon: Shield, name: "Pwn", desc: "Ciberinteligencia defensiva: exposición, filtraciones, CVE y alertas." },
  { icon: StarOfDavid, name: "Kosher", desc: "Atlas de lugares, sinagogas y kehilot. Informa con fuente; no emite hechsher." },
];

const PLANS = [
  { name: "Free", price: "$0", who: "Para explorar la plataforma" },
  { name: "Profesional", price: "$9.99", who: "Freelancers y profesionales" },
  { name: "Empresa", price: "$29", who: "Agencias y negocios" },
  { name: "Elite", price: "$79", who: "La suite completa para escalar" },
];

const EDGE = [
  { icon: Layers, title: "Una cuenta, siete módulos", desc: "Quien entra por la caja encuentra empleo, talento y publicidad sin registrarse de nuevo. Cada módulo le acerca usuarios al siguiente." },
  { icon: Globe2, title: "Hecho para la región", desc: "En español desde la primera línea, con planes pensados para la economía latinoamericana y pagos con tarjeta por Stripe." },
  { icon: Shield, title: "Seguridad como producto", desc: "2FA, ciberinteligencia defensiva propia y un equipo que trabaja seguridad. La confianza es parte de lo que se vende." },
];

const LIVE = [
  "Plataforma en producción en mercav.lat",
  "Pagos con Stripe en Ads, Services y planes",
  "Login con correo o Google y 2FA opcional",
  "POS con cola offline si se corta la red",
  "Subdominios propios: pwn.mercav.lat y kosher.mercav.lat",
];

const TEAM = [
  { name: "Vinicius Salazar", role: "CEO", initials: "VS", href: "/nosotros" },
  { name: "Sebastian Rojas Cespedes", role: "CTO", initials: "SR" },
  { name: "Alejandro Ismael Mendoza Diaz", role: "CTO", initials: "AM" },
];

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
                Mercav reúne publicidad física, talento digital, empleo, caja POS, herramientas y ciberinteligencia defensiva en una plataforma hecha desde Santa Cruz de la Sierra.
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
            <dl className="mv-panel divide-y divide-[var(--mv-hairline)] rounded-[1.5rem]">
              {SNAPSHOT.map((f) => (
                <div key={f.k} className="flex flex-col gap-0.5 px-5 py-4">
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
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                id="pitch-problema"
                kicker="01 · El problema"
                title="Tres mercados que siguen operando sin infraestructura."
                lead="La demanda existe. Lo que falta es una plataforma regional que la ordene."
              />
            </div>
            <ol className="space-y-4">
              {PROBLEMS.map((p, i) => (
                <Reveal as="li" key={i} delay={i * 60} className="mv-panel flex gap-4 rounded-[1.25rem] p-5 md:p-6">
                  <span className="mv-data shrink-0 pt-0.5 text-sm text-gold">0{i + 1}</span>
                  <p className="mv-body text-[var(--text-primary)]">{p}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* 2. Producto */}
      <Section labelledBy="pitch-producto">
        <Container>
          <SectionHeading
            id="pitch-producto"
            kicker="02 · El producto"
            title="Siete módulos. Una cuenta."
            lead="Mismo login, mismo perfil y mismo medio de pago en todo el ecosistema."
            action={
              <ButtonLink href="/" tone="secondary">
                Abrir Mercav <ArrowUpRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            }
          />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map(({ icon: Icon, name, desc }, i) => (
              <Reveal as="li" key={name} delay={Math.min(i * 50, 250)} className="liquid-glass flex flex-col rounded-[1.5rem] p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Mercav {name}</h3>
                <p className="mv-body mt-2">{desc}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 3. Modelo de negocio */}
      <Section tone="raised" labelledBy="pitch-modelo">
        <Container>
          <SectionHeading
            id="pitch-modelo"
            kicker="03 · Modelo de negocio"
            title="Suscripciones y comisiones desde el primer día."
            lead="Dos fuentes de ingreso que crecen juntas: el plan que paga cada cuenta y la comisión de cada transacción."
          />
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            <Fact value="4" label="Planes mensuales" />
            <Fact value="12 %" label="Comisión por pedido en Services" />
            <Fact value="10 %" label="Comisión por alquiler en Ads" />
            <Fact value="20 %" label="Descuento con facturación anual" />
          </dl>
          <div className="mt-14 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <ul className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((p) => (
                <li key={p.name} className="mv-panel flex flex-col rounded-[1.25rem] p-5 md:p-6">
                  <span className="text-sm font-semibold text-gold">{p.name}</span>
                  <span className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                    {p.price}
                    <span className="ml-1 text-base font-normal text-[var(--text-tertiary)]">/mes</span>
                  </span>
                  <span className="mv-body mt-2">{p.who}</span>
                </li>
              ))}
            </ul>
            <Reveal className="liquid-glass rounded-[1.75rem] p-6 md:p-8">
              <p className="mv-kicker">Cómo se cobra</p>
              <div className="mt-5 space-y-4 text-[0.9375rem] leading-7 text-[var(--text-secondary)]">
                <p>
                  <span className="font-medium text-[var(--text-primary)]">Services:</span> la plataforma retiene el 12 % de cada pedido cuando Stripe confirma el pago.
                </p>
                <p>
                  <span className="font-medium text-[var(--text-primary)]">Ads:</span> 5 % lo paga el anunciante y 5 % el dueño del espacio. El dueño no paga comisión en el primer alquiler de cada espacio.
                </p>
                <p>
                  Detalle de cada plan en{" "}
                  <Link href="/precios" className="mv-link">
                    precios
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
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
                  <li key={title} className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-6">
                    <Icon className="h-5 w-5 text-gold" aria-hidden />
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
                    <p className="mv-body">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:pt-20">
              <h3 className="mv-h3">Lo que ya funciona</h3>
              <p className="mv-body mt-3">El producto no es una maqueta. Esto corre hoy, con cuentas y pagos reales.</p>
              <ul className="mt-6 space-y-2.5">
                {LIVE.map((item) => (
                  <li key={item} className="mv-panel flex items-center gap-3 rounded-[1.25rem] px-5 py-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                    <span className="text-[0.9375rem] font-medium text-[var(--text-primary)]">{item}</span>
                  </li>
                ))}
              </ul>
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
            {TEAM.map((m, i) => (
              <Reveal as="li" key={m.name} delay={i * 60} className="liquid-glass flex flex-col rounded-[1.75rem] p-6 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span
                    aria-hidden
                    className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] font-display text-lg font-semibold text-gold"
                  >
                    {m.initials}
                  </span>
                  <span className="mv-chip mv-chip-gold">{m.role}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-[var(--text-primary)]">{m.name}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Cofundador · {m.role}
                </p>
                {m.href ? (
                  <Link href={m.href} className="mv-link mt-5 inline-flex items-center gap-1 self-start text-sm">
                    Quién soy <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : null}
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <CTABand
        title="Hablemos."
        lead="Buscamos capital semilla y socios que conozcan la región. El contacto pasa por la página de inversores."
        action={
          <>
            <ButtonLink href="/inversores#contacto-inversores" size="lg" className="w-full sm:w-auto">
              Contactar al equipo <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/inversores#tesis" tone="ghost" size="lg" className="w-full sm:w-auto">
              Leer la tesis
            </ButtonLink>
          </>
        }
        note="Esta página tiene fines informativos. Cualquier inversión se formaliza con documentación y acuerdos legales."
      />
    </div>
  );
}
// creado por pato dev y askforvini
