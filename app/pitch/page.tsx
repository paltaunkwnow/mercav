import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "@/components/icons";
import { ModuleGlyph } from "@/components/icons/ModuleGlyph";
import { HostLink } from "@/components/layout/HostContext";
import { Mervi } from "@/components/mervi/Mervi";
import { FounderRoll } from "@/components/site/cartel/FounderRoll";
import { CartelSection, FitLines, StatusTag } from "@/components/site/cartel/primitives";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { cn } from "@/lib/utils";

const SNAPSHOT = [
  { k: "Etapa", v: "Búsqueda de capital semilla" },
  { k: "Inversión", v: "Sin inversión externa hasta hoy" },
  { k: "Fundada", v: "2026" },
  { k: "Sede", v: "Santa Cruz de la Sierra, Bolivia" },
];

const PROBLEMS = [
  { market: "Publicidad física", body: "Alquilar una valla o una pantalla todavía depende de conocer al dueño. No hay un canal digital para reservar y pagar." },
  { market: "Talento", body: "Quien trabaja por proyecto compite en plataformas extranjeras, en inglés, con precios en dólares y comisiones que no piensan en la región." },
  { market: "Empresas", body: "Una empresa paga por separado los sueldos, la bolsa de empleo y cada herramienta. Nada comparte la misma cuenta ni los mismos datos." },
];

const MODULES: { glyph: ReactNode; name: string; desc: string; route: string }[] = [
  { glyph: <ModuleGlyph name="publicidad" size={36} />, name: "Publicidad", desc: "Vallas, pantallas y vidrieras para alquilar por fechas", route: "/anuncios" },
  { glyph: <ModuleGlyph name="talento" size={36} />, name: "Servicios", desc: "Talento digital con paquetes y pago con tarjeta", route: "/servicios" },
  { glyph: <ModuleGlyph name="empleos" size={36} />, name: "Empleos", desc: "Vacantes, postulaciones y seguimiento de candidatos", route: "/empleos" },
  { glyph: <ModuleGlyph name="business" size={36} />, name: "Business", desc: "Empresas, legajos y planillas de sueldo mensuales", route: "/business" },
  { glyph: <ModuleGlyph name="herramientas" size={36} />, name: "Herramientas", desc: "ROI, contratos, SEO, tarifas, paletas y prompts", route: "/herramientas" },
  { glyph: <ModuleGlyph name="pwn" size={36} />, name: "Pwn", desc: "Ciberinteligencia defensiva: exposición, filtraciones y CVE", route: "/pwn" },
  { glyph: <StarOfDavid width={36} height={36} strokeWidth={1.5} />, name: "Kosher", desc: "Atlas de lugares y kehilot. Informa con fuente; no emite hechsher", route: "/kosher" },
];

const PLANS = [
  { name: "Free", who: "Para explorar la plataforma", price: "$0" },
  { name: "Profesional", who: "Freelancers y profesionales", price: "$9.99" },
  { name: "Empresa", who: "Agencias y negocios", price: "$29" },
  { name: "Elite", who: "La suite completa para escalar", price: "$79" },
];

const FEES = [
  { name: "Servicios", detail: "Se retiene cuando Stripe confirma el pago del pedido.", value: "12 %" },
  { name: "Publicidad", detail: "5 % lo paga el anunciante y 5 % el dueño. El dueño no paga en el primer alquiler de cada espacio.", value: "10 %" },
  { name: "Facturación anual", detail: "Sobre el precio mensual de cualquier plan pago.", value: "−20 %" },
];

const EDGE = [
  { title: "Cada módulo trae usuarios al siguiente", desc: "Quien entra para pagar sueldos encuentra empleo, talento y publicidad sin registrarse de nuevo." },
  { title: "Hecho para la región", desc: "En español desde la primera línea y con planes pensados para la economía latinoamericana." },
  { title: "La seguridad es parte del producto", desc: "2FA, ciberinteligencia defensiva propia y un equipo que trabaja seguridad. La confianza también se vende." },
];

const LIVE = [
  "Plataforma en producción en mercav.lat",
  "Pagos con Stripe en Publicidad, Servicios y planes",
  "Login con correo o Google y 2FA opcional",
  "Business con planilla mensual para Bolivia, Excel y boletas en PDF",
  "Producto en app.mercav.lat y subdominio propio en kosher.mercav.lat",
];

/** Filetes del resumen: 2 columnas en el teléfono, 4 desde lg. */
function snapshotRule(i: number) {
  return cn(i % 2 === 1 ? "border-l-2 pl-4 sm:pl-6" : "pr-4 sm:pr-6", i === 2 && "lg:border-l-2 lg:pl-6", i < SNAPSHOT.length - 1 && "lg:pr-6");
}

/** Una fila de la pizarra de precios: nombre y detalle a la izquierda, la cifra pintada a la derecha. */
function PriceRow({ name, detail, value }: { name: string; detail: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-6 border-b-2 border-[var(--c-line)] py-5">
      <div className="min-w-0">
        <p className="c-h3 !text-[clamp(1.6rem,1.3rem+1vw,2.1rem)]">{name}</p>
        <p className="mt-1.5 text-[0.95rem] leading-snug text-[var(--c-soft)]">{detail}</p>
      </div>
      <p className="c-display c-num shrink-0 text-[clamp(2.25rem,1.8rem+1.6vw,3rem)] leading-none">{value}</p>
    </li>
  );
}

export default function PitchPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      {/* Portada */}
      <section aria-labelledby="pitch-title" className="relative flex flex-col pt-[calc(var(--c-nav-h)+2rem)] md:pt-[calc(var(--c-nav-h)+3rem)] lg:min-h-[100svh]">
        <div
          className="c-container grid flex-1 content-center gap-8 pb-28 lg:grid-cols-[minmax(0,var(--hero-w))_minmax(17rem,1fr)] lg:items-end lg:gap-14 lg:pb-14"
          style={{ "--hero-w": "min(52rem, calc((100svh - 20rem) * 2.4))" } as CSSProperties}
        >
          <FitLines
            id="pitch-title"
            lines={[
              { text: "Una sola cuenta", fit: 15.917 },
              { text: "para trabajar y vender", fit: 11.006 },
              { text: "en Latinoamérica.", fit: 14.484, className: "c-text-magenta" },
            ]}
          />
          <div className="flex flex-col gap-7 lg:pb-36">
            <p className="c-lead">
              Mercav reúne publicidad física, talento digital, empleo, planillas de sueldo, herramientas y ciberinteligencia defensiva en una plataforma hecha desde Santa Cruz de la Sierra.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/inversores#contacto-inversores" className="c-btn">
                Hablar con el equipo
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <a href="#equipo" className="c-btn c-btn-ghost">
                Ver el equipo
              </a>
            </div>
          </div>
        </div>

        <div className="c-container relative pb-10 md:pb-14">
          <Mervi pose="emprendedor" scale={1} scaleLg={2} label="Mervi, la mascota de Mercav, junto a una pantalla con el mapa de Latinoamérica" className="absolute right-[var(--c-gutter)] top-[calc(var(--mervi-unit)*-92)] z-10" />
          <dl className="grid grid-cols-2 border-t-2 border-[var(--c-line)] lg:grid-cols-4">
            {SNAPSHOT.map((f, i) => (
              <div key={f.k} className={cn("flex flex-col gap-1.5 border-b-2 border-[var(--c-line)] py-4 md:py-5", snapshotRule(i))}>
                <dt className="c-label text-[0.95rem] text-[var(--c-muted)]">{f.k}</dt>
                <dd className="text-[1rem] font-semibold leading-snug md:text-[1.0625rem]">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* El problema */}
      <CartelSection labelledBy="pitch-problema" className="!pt-12 md:!pt-16">
        <div className="c-container">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <h2 id="pitch-problema" className="c-h2">
              Tres mercados que siguen operando sin infraestructura.
            </h2>
            <p className="c-lead lg:pb-2">La demanda existe. Lo que falta es una plataforma regional que la ordene.</p>
          </div>
          <ul className="mt-14 border-t-2 border-[var(--c-line)] md:mt-20">
            {PROBLEMS.map((p) => (
              <li key={p.market} className="grid gap-4 border-b-2 border-[var(--c-line)] py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12 md:py-10">
                <h3 className="c-h3">{p.market}</h3>
                <p className="c-body text-[1.0625rem]">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>

      {/* El producto: la cuenta es la tesis */}
      <CartelSection labelledBy="pitch-producto" className="!pt-0">
        <div className="c-container grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--c-nav-h)+3rem)] lg:self-start">
            <h2 id="pitch-producto" className="c-h2">
              Siete módulos. Una cuenta.
            </h2>
            <p className="c-lead">Mismo login, mismo perfil y mismo medio de pago en todo el ecosistema.</p>
            <Link href="/" className="c-link inline-flex w-fit items-center gap-2 font-semibold">
              Abrir Mercav
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="c-poster c-paste c-inverse" style={{ "--tilt": "0.5deg" } as CSSProperties}>
            <div className="border-b-2 border-[var(--c-text)] p-6 sm:px-10 sm:pt-10">
              <p className="c-display text-[clamp(2.5rem,1.8rem+2.6vw,4rem)]">Tu cuenta Mercav</p>
              <p className="mt-3 text-[1rem] text-[var(--c-soft)]">Correo o Google · 2FA opcional</p>
            </div>
            <ul aria-label="Módulos incluidos en la cuenta" className="px-6 pb-4 sm:px-10 sm:pb-6">
              {MODULES.map((m, i) => (
                <li
                  key={m.name}
                  className={cn(
                    "mv-icon-host grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-x-5",
                    i > 0 && "border-t-2 border-[var(--c-line)]",
                  )}
                >
                  <span className="row-span-2 mt-0.5 sm:row-span-1 sm:mt-0" aria-hidden>
                    {m.glyph}
                  </span>
                  <div className="min-w-0">
                    <p className="c-label text-[1.3rem]">Mercav {m.name}</p>
                    <p className="mt-0.5 text-[0.95rem] leading-snug text-[var(--c-soft)]">{m.desc}</p>
                  </div>
                  <span className="text-[0.875rem] text-[var(--c-muted)]">{m.route}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CartelSection>

      {/* Modelo de negocio: la pizarra de precios */}
      <section aria-labelledby="pitch-modelo" className="c-band c-ink-yellow">
        <div className="c-container py-20 md:py-28 lg:py-32">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12">
            <h2 id="pitch-modelo" className="c-h2">
              Suscripciones y comisiones desde el primer día.
            </h2>
            <p className="c-lead md:pb-2">El plan que paga cada cuenta y la comisión de cada transacción crecen juntos.</p>
          </div>
          <div className="mt-14 grid gap-14 md:mt-20 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="c-label border-b-2 border-[var(--c-text)] pb-3 text-[1.35rem]">Planes por mes</h3>
              <ul>
                {PLANS.map((p) => (
                  <PriceRow key={p.name} name={p.name} detail={p.who} value={p.price} />
                ))}
              </ul>
              <p className="mt-4 text-[0.95rem] text-[var(--c-soft)]">
                Detalle de cada plan en{" "}
                {/* /precios is on app.mercav.lat. */}
                <HostLink href="/precios" className="c-link font-semibold text-[var(--c-text)]">
                  precios
                </HostLink>
                .
              </p>
            </div>
            <div>
              <h3 className="c-label border-b-2 border-[var(--c-text)] pb-3 text-[1.35rem]">Comisiones</h3>
              <ul>
                {FEES.map((f) => (
                  <PriceRow key={f.name} name={f.name} detail={f.detail} value={f.value} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Por qué puede ganar, y lo que ya corre */}
      <CartelSection labelledBy="pitch-ventaja">
        <div className="c-container grid gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          <div>
            <h2 id="pitch-ventaja" className="c-h2 max-w-[14ch]">
              La ventaja está en la integración.
            </h2>
            <ul className="mt-12 border-t-2 border-[var(--c-line)] md:mt-16">
              {EDGE.map((e) => (
                <li key={e.title} className="flex flex-col gap-3 border-b-2 border-[var(--c-line)] py-8">
                  <h3 className="c-h3">{e.title}</h3>
                  <p className="c-body text-[1.0625rem]">{e.desc}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pt-28">
            <div className="c-poster c-paste c-band c-ink-green p-6 sm:p-10" style={{ "--tilt": "-0.6deg" } as CSSProperties}>
              <StatusTag />
              <h3 className="c-display mt-6 text-[clamp(2.5rem,1.8rem+2.4vw,3.75rem)]">Lo que ya funciona</h3>
              <ul className="mt-6 border-t-2 border-[var(--c-line-strong)]">
                {LIVE.map((item) => (
                  <li key={item} className="flex items-start gap-3 border-b-2 border-[var(--c-line)] py-3.5 text-[1rem] font-medium leading-snug">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[0.95rem] font-semibold leading-snug">El producto no es una maqueta: esto corre hoy, con cuentas y pagos reales.</p>
            </div>
          </div>
        </div>
      </CartelSection>

      {/* El equipo */}
      <CartelSection id="equipo" labelledBy="pitch-equipo" className="scroll-mt-[var(--c-nav-h)] !pt-4 md:!pt-8">
        <div className="c-container">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12">
            <h2 id="pitch-equipo" className="c-h2">
              Un equipo, un mismo producto.
            </h2>
            <p className="c-lead md:pb-2">Vinicius Salazar fundó Mercav y lo dirige. Con su equipo lo diseñan, construyen y operan desde Santa Cruz de la Sierra, y Marco Sánchez lo lleva a Costa Rica.</p>
          </div>
          <FounderRoll size="lg" className="mt-14 md:mt-20" />
        </div>
      </CartelSection>

      {/* Cierre: una acción principal */}
      <section aria-labelledby="pitch-cierre" className="c-band c-ink-magenta">
        <div className="c-container grid gap-10 pb-28 pt-20 md:pb-36 md:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16 lg:pb-44">
          <FitLines as="h2" id="pitch-cierre" lines={[{ text: "Hablemos.", fit: 24.852 }]} className="max-w-[44rem]" />
          <div className="flex flex-col gap-6 lg:pb-3">
            <p className="max-w-[30rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              Buscamos capital semilla y socios que conozcan la región. El contacto pasa por la página de inversores.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/inversores#contacto-inversores" className="c-btn c-btn-lg c-btn-ink">
                Contactar al equipo
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="/inversores#tesis" className="c-btn c-btn-lg c-btn-ghost">
                Leer la tesis
              </Link>
            </div>
            <p className="max-w-[28rem] text-[0.875rem] leading-snug text-[var(--c-soft)]">
              Esta página tiene fines informativos. Cualquier inversión se formaliza con documentación y acuerdos legales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
