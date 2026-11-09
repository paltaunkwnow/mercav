import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { Mervi } from "@/components/mervi/Mervi";
import { FounderRoll } from "@/components/site/cartel/FounderRoll";
import { KeremPoster } from "@/components/site/cartel/KeremPoster";
import { CartelSection, FitLines } from "@/components/site/cartel/primitives";
import { cn } from "@/lib/utils";
import { InvestorContactForm } from "./InvestorContactForm";

const FACTS = [
  { k: "Etapa", v: "Búsqueda de capital semilla" },
  { k: "Equipo", v: "Fundador y CEO, CSO y Director de Seguridad, equipo técnico y comercial" },
  { k: "Producto", v: "Plataforma construida" },
  { k: "Sede", v: "Santa Cruz de la Sierra, Bolivia" },
  { k: "Modelo", v: "Comisiones, suscripciones y herramientas" },
];

const PROBLEMS = [
  "La publicidad offline en Latinoamérica no tiene infraestructura digital. Los dueños dependen de contactos personales y negociaciones informales.",
  "El mercado freelance latinoamericano carece de una plataforma regional confiable con garantías reales.",
  "Las bolsas de empleo existentes están desactualizadas y no integran el perfil profesional con el proceso de selección.",
];

const THESIS = [
  { title: "Una región en digitalización", desc: "Latinoamérica es un mercado amplio que se digitaliza año tras año, con necesidades que las plataformas globales no atienden." },
  { title: "Monetización diversificada", desc: "Comisiones, suscripciones premium y herramientas con IA: más de una fuente de ingreso desde el inicio." },
  { title: "Ventaja por integración", desc: "Un ecosistema integrado genera efectos de red. Quien usa un módulo encuentra el siguiente con la misma cuenta." },
  { title: "Escalable país por país", desc: "Infraestructura preparada para crecer mercado por mercado, con costos marginales decrecientes." },
  { title: "Crecimiento con la comunidad", desc: "Un ecosistema conectado invita a sumar a otros: clientes, proveedores y equipos dentro de la misma red." },
  { title: "Ingresos futuros", desc: "Además de comisiones y planes, la publicidad programática es una línea prevista para más adelante." },
];

const LOOKING_FOR = [
  "Inversores ángeles con conexión a Latam",
  "Fondos de venture capital early-stage",
  "Mentores estratégicos con experiencia en marketplaces",
  "Partners tecnológicos que quieran co-construir",
];

export default function InversoresPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      {/* Portada */}
      <section aria-labelledby="inv-title" className="relative pb-20 pt-[calc(var(--c-nav-h)+2rem)] md:pb-28 md:pt-[calc(var(--c-nav-h)+3rem)]">
        <div
          className="c-container grid gap-12 lg:grid-cols-[minmax(0,var(--hero-w))_minmax(18rem,1fr)] lg:items-end lg:gap-16"
          style={{ "--hero-w": "min(48rem, calc((100svh - 22rem) * 2.4))" } as CSSProperties}
        >
          <div className="flex flex-col gap-8">
            <FitLines
              id="inv-title"
              lines={[
                { text: "Una oportunidad", fit: 15.385 },
                { text: "de construir", fit: 20.072 },
                { text: "junto a Latinoamérica.", fit: 11.204, className: "c-text-orange" },
              ]}
            />
            <p className="c-lead">
              Mercav busca su primer capital semilla para escalar una plataforma que ya está construida: la infraestructura digital que le faltaba a la región.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#contacto-inversores" className="c-btn">
                Contactar al equipo
                <ArrowRight className="h-5 w-5" aria-hidden />
              </a>
              <a href="#tesis" className="c-btn c-btn-ghost">
                Ver la tesis
              </a>
            </div>
          </div>
          <dl className="border-t-2 border-[var(--c-line)] lg:mb-1">
            {FACTS.map((f) => (
              <div key={f.k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-4 border-b-2 border-[var(--c-line)] py-3.5">
                <dt className="c-label text-[0.95rem] text-[var(--c-muted)]">{f.k}</dt>
                <dd className="text-[1rem] font-semibold leading-snug">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* El problema, y la solución pegada al lado */}
      <CartelSection labelledBy="inv-problema" className="!pt-4 md:!pt-8">
        <div className="c-container grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16 xl:gap-20">
          <div>
            <h2 id="inv-problema" className="c-h2">
              Tres mercados que siguen operando sin infraestructura.
            </h2>
            <ul className="mt-12 border-t-2 border-[var(--c-line)] md:mt-16">
              {PROBLEMS.map((p) => (
                <li key={p} className="border-b-2 border-[var(--c-line)] py-6 text-[1.125rem] leading-relaxed md:py-7 md:text-[1.1875rem]">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pt-48">
            <div aria-labelledby="inv-solucion" role="region" className="c-poster c-paste c-inverse p-6 sm:p-10" style={{ "--tilt": "0.6deg" } as CSSProperties}>
              <h2 id="inv-solucion" className="c-display text-[clamp(2.25rem,1.5rem+2vw,3.5rem)] [text-wrap:balance]">
                Un solo ecosistema para lo que hoy está fragmentado.
              </h2>
              <p className="c-body mt-6 text-[1.0625rem]">
                Mercav es una plataforma digital latinoamericana que integra publicidad offline, servicios digitales, bolsa de empleo y herramientas para empresas.
              </p>
              <p className="mt-5 border-t-2 border-[var(--c-text)] pt-5 text-[1.125rem] font-semibold leading-snug">
                El mercado existe, el problema es real y la solución ya está construida. Lo que necesitamos ahora es escala.
              </p>
            </div>
          </div>
        </div>
      </CartelSection>

      {/* Por qué ahora */}
      <section aria-labelledby="inv-ahora" className="c-band c-ink-orange">
        <div className="c-container grid gap-8 py-20 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end md:gap-16 md:py-28">
          <h2 id="inv-ahora" className="c-h2">
            La región ya trabaja en digital.
          </h2>
          <p className="c-lead md:pb-2">
            Hay más personas conectadas, más empresas digitalizándose y más profesionales buscando trabajar de forma independiente. Mercav llega cuando esa demanda ya existe y todavía no tiene una plataforma regional que la ordene.
          </p>
        </div>
      </section>

      {/* Tesis de inversión */}
      <CartelSection id="tesis" labelledBy="inv-tesis" className="scroll-mt-[var(--c-nav-h)]">
        <div className="c-container">
          <h2 id="inv-tesis" className="c-h2 max-w-[16ch]">
            Por qué este modelo puede escalar.
          </h2>
          <ul className="mt-14 grid border-t-2 border-[var(--c-line)] md:mt-20 md:grid-cols-2">
            {THESIS.map((t, i) => (
              <li key={t.title} className={cn("flex flex-col gap-3 border-b-2 border-[var(--c-line)] py-8 md:py-10", i % 2 === 1 ? "md:border-l-2 md:pl-10" : "md:pr-10")}>
                <h3 className="c-h3">{t.title}</h3>
                <p className="c-body">{t.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>

      {/* Kerem by Mercav, proyecto próximo */}
      <CartelSection labelledBy="inv-kerem" className="!pt-4 md:!pt-8">
        <div className="c-container">
          <KeremPoster titleId="inv-kerem" status="Próximamente · Santa Cruz" line="Hospitalidad con kashrut en Santa Cruz." tilt="0.5deg">
            <p>
              Kerem es un proyecto de hospitalidad en Santa Cruz de la Sierra. El estándar es kashrut. En la ciudad no hay una oferta de ese tipo; el objetivo es construirla con el mismo rigor que un sistema: verificable, usable y sostenible.
            </p>
            <p>
              Mercav Kosher es el directorio que lo acompaña: lugares y servicios con fuente. No emite certificación ni hechsher. La expansión a otros países es una fase posterior, no el punto de partida.
            </p>
          </KeremPoster>
          <p className="c-lead mt-14 border-t-2 border-[var(--c-line)] pt-8 md:mt-16">
            Kerem se diseña para quien necesita ese estándar y para quien quiera un servicio claro. Mercav Kosher no certifica: muestra la fuente de cada lugar para que la decisión quede en quien consulta.
          </p>
        </div>
      </CartelSection>

      {/* Quién está detrás, y lo que buscamos */}
      <CartelSection labelledBy="inv-fundador" className="border-t-2 border-[var(--c-line)]">
        <div className="c-container">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-20">
            <div>
              <h2 id="inv-fundador" className="c-h2">
                Un equipo que construye desde adentro.
              </h2>
              <div className="mt-8 flex flex-col gap-4">
                <p className="c-body text-[1.0625rem]">Vinicius Salazar fundó Mercav en Santa Cruz de la Sierra y lo dirige como CEO. Jaider Alejandro Pinto Ribera es CSO, cofundador y Director de Seguridad, responsable de la estrategia de ciberseguridad y de los servicios profesionales para empresas. Los acompañan Sebastian Rojas Cespedes, cofundador, Alejandro Ismael Mendoza Diaz, CTO, y el equipo comercial y regional.</p>
                <p className="c-body text-[1.0625rem]">
                  Mercav no es una maqueta: anuncios, servicios, empleo, planillas de sueldo, herramientas y ciberinteligencia ya corren con una sola cuenta, hechos desde Bolivia.
                </p>
                <p className="c-body text-[1.0625rem]">Queremos devolver la generosidad con un sistema que se pueda usar de punta a punta: claro, completo y al alcance.</p>
              </div>
            </div>
            <div className="flex flex-col">
              <Mervi pose="cool" scale={1} scaleLg={2} label="Mervi, la mascota de Mercav, con anteojos de sol" className="relative z-10 mb-[calc(var(--mervi-unit)*-4)] self-end" />
              <FounderRoll />
              <p className="mt-4 text-[0.95rem] text-[var(--c-soft)]">
                El resumen completo está en el{" "}
                <Link href="/pitch" className="c-link font-semibold text-[var(--c-text)]">
                  pitch
                </Link>
                . El perfil de Vinicius, en{" "}
                <Link href="/nosotros#vinicius" className="c-link font-semibold text-[var(--c-text)]">
                  Quiénes somos
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-20 grid gap-10 border-t-2 border-[var(--c-text)] pt-12 md:mt-28 lg:grid-cols-2 lg:gap-20">
            <div>
              <h3 className="c-display text-[clamp(2.25rem,1.6rem+2.4vw,3.75rem)]">Lo que buscamos</h3>
              <p className="c-body mt-5 text-[1.0625rem]">
                Inversores que aporten capital y visión: personas que entiendan el mercado latinoamericano, que crean en fundadores que construyen desde adentro y que quieran sumarse en los primeros capítulos.
              </p>
            </div>
            <ul className="border-t-2 border-[var(--c-line)] lg:mt-2">
              {LOOKING_FOR.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b-2 border-[var(--c-line)] py-4 text-[1.0625rem] font-semibold leading-snug">
                  <Check className="c-text-green mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CartelSection>

      {/* Contacto: el cierre */}
      <section id="contacto-inversores" aria-labelledby="inv-contacto" className="c-band c-ink-yellow scroll-mt-[var(--c-nav-h)]">
        <div className="c-container grid gap-12 pb-28 pt-20 md:pb-36 md:pt-28 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:pb-44">
          <div className="flex flex-col gap-6">
            <FitLines
              as="h2"
              id="inv-contacto"
              lines={[
                { text: "Contacto para", fit: 17.908 },
                { text: "inversores", fit: 23.372 },
              ]}
              className="max-w-[34rem]"
            />
            <p className="max-w-[30rem] text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">
              Esta página tiene fines informativos. Cualquier proceso de inversión se lleva a cabo mediante documentación formal y acuerdos legales específicos.
            </p>
          </div>
          <InvestorContactForm />
        </div>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
