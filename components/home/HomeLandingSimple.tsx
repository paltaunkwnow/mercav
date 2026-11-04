import Link from "next/link";
import {
  Package,
  Users,
  FileSpreadsheet,
  Check,
  ArrowRight,
} from "@/components/icons";
import { Mervi } from "@/components/mervi/Mervi";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection } from "@/components/site/cartel/primitives";
import type { LandingData } from "./HomeLanding";

/**
 * Landing simplificada: Inventario + Trabajadores + Nómina
 * Diseño limpio, profesional. Iconos animados, sin emojis.
 * Crema + Oro + Liquid glass effects
 */

export function LandingHeroSimple({ data }: { data: LandingData }) {
  return (
    <section aria-labelledby="hero-title" className="relative pt-[calc(var(--c-nav-h)+4rem)] md:pt-[calc(var(--c-nav-h)+6rem)] pb-12">
      <div className="c-container flex flex-col items-center text-center">
        {/* Headline */}
        <h1 id="hero-title" className="c-display text-[clamp(3rem,1rem+8vw,8rem)] leading-[0.88] [text-wrap:balance] font-700">
          <span className="block">Gestiona tu negocio</span>
          <span className="c-yellow block">sin Excel.</span>
        </h1>

        {/* Subtítulo */}
        <p className="c-lead mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
          Inventario, trabajadores y nómina. Todo en un lugar, completamente gratis.
        </p>

        {/* CTA */}
        <div className="mt-12">
          <AuthCTA className="items-center sm:justify-center" />
          <p className="c-label mt-4 text-[var(--c-muted)]">Sin tarjeta de crédito. Sin sorpresas.</p>
        </div>

        {/* Mervi */}
        <figure className="relative mt-24 flex flex-col items-center mb-8">
          <div className="h-64 w-64 flex items-center justify-center">
            <Mervi
              pose="celebrando"
              scale={1.5}
              scaleLg={2}
              label="Mervi celebra tu éxito"
              className="w-full h-full"
            />
          </div>
          <figcaption className="c-label mt-8 text-[1rem] text-[var(--c-soft)]">
            Mercav está hecho en Latinoamérica, para negocios de Latinoamérica.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/**
 * Sección: Problemas reales que enfrentan
 */
export function LandingProblemsMini() {
  const problems = [
    {
      icon: FileSpreadsheet,
      title: "Planillas manuales",
      desc: "Pierdes horas cada mes calculando nómina, impuestos y descuentos.",
    },
    {
      icon: Package,
      title: "Inventario sin control",
      desc: "No sabes cuánto stock tenés. Los productos se agotan sin aviso.",
    },
    {
      icon: Users,
      title: "Equipo disperso",
      desc: "Sueldos, documentos y cambios repartidos en WhatsApp y papeles.",
    },
  ];

  return (
    <CartelSection className="!pb-24">
      <div className="c-container">
        <div className="mb-16 text-center">
          <h2 className="c-h2">
            <span className="c-yellow">Problemas reales.</span> Soluciones reales.
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center group"
              >
                {/* Icono animado con fondo */}
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,175,55,0.1)] to-transparent rounded-[1.5rem] blur-xl group-hover:from-[rgba(212,175,55,0.2)] transition-all duration-500" />
                  <div className="relative bg-[var(--c-raised)] border border-[var(--c-line)] rounded-[1.5rem] p-6 group-hover:border-[var(--c-yellow)] transition-colors duration-300">
                    <Icon className="h-8 w-8 text-[var(--c-yellow)] mv-icon" aria-hidden />
                  </div>
                </div>

                <h3 className="c-display text-[1.3rem] mb-3">{item.title}</h3>
                <p className="text-[var(--c-soft)] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </CartelSection>
  );
}

/**
 * Sección: 3 features principales
 */
export function LandingFeaturesMini() {
  const features = [
    {
      icon: Package,
      title: "Inventario",
      subtitle: "Control en tiempo real",
      items: [
        "Registra entradas y salidas",
        "Ve stock desde tu móvil",
        "Alertas de productos agotados",
      ],
    },
    {
      icon: Users,
      title: "Trabajadores",
      subtitle: "Tu equipo en orden",
      items: [
        "Directorio de empleados",
        "Salarios organizados",
        "Boletas digitales",
      ],
    },
    {
      icon: FileSpreadsheet,
      title: "Nómina",
      subtitle: "Planillas sin esfuerzo",
      items: [
        "Cálculo automático",
        "Descarga PDF listo",
        "Historial completo",
      ],
    },
  ];

  return (
    <section className="relative py-24">
      <div className="c-container">
        <div className="mb-16 text-center">
          <h2 className="c-h2">
            Lo que necesitás,
            <span className="c-yellow"> entregado.</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--c-line)] bg-[var(--c-ground)] p-8 transition-all duration-300 hover:border-[var(--c-yellow)] hover:bg-[var(--c-raised)]"
              >
                {/* Liquid glass effect */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,175,55,0.06)] via-transparent to-[rgba(255,255,255,0.02)]" />
                </div>

                <div className="relative z-10">
                  {/* Icono */}
                  <div className="mb-6 inline-block rounded-[1rem] bg-[var(--c-raised)] border border-[var(--c-line)] p-4 group-hover:border-[var(--c-yellow)] transition-colors duration-300">
                    <Icon className="h-6 w-6 text-[var(--c-yellow)] mv-icon" aria-hidden />
                  </div>

                  {/* Título */}
                  <h3 className="c-display text-[1.5rem] mb-1">{feat.title}</h3>
                  <p className="text-[var(--c-muted)] text-sm mb-6">{feat.subtitle}</p>

                  {/* Items */}
                  <ul className="space-y-3">
                    {feat.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-[var(--c-yellow)] flex-shrink-0 mt-1 mv-icon" aria-hidden />
                        <span className="text-[var(--c-text)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Social proof
 */
/**
 * Sección: ¿Y qué más ofrece Mercav?
 */
export function LandingMoreFeatures() {
  const allModules = [
    {
      title: "Publicidad",
      desc: "Alquila vallas, pantallas y vidrieras por fechas.",
    },
    {
      title: "Servicios",
      desc: "Vende talento digital con paquetes y precios claros.",
    },
    {
      title: "Empleos",
      desc: "Publica vacantes y gestiona candidatos.",
    },
    {
      title: "Herramientas",
      desc: "ROI, contratos, SEO, diseño de paletas, más.",
    },
    {
      title: "Ciberseguridad",
      desc: "Monitorea si tu dominio fue hackeado.",
    },
    {
      title: "Kosher",
      desc: "Atlas de lugares, horarios y comunidad judía.",
    },
  ];

  return (
    <section className="relative py-24">
      <div className="c-container">
        <div className="mb-16 text-center">
          <h2 className="c-h2 mb-4">
            <span className="c-yellow">¿Y qué más?</span>
          </h2>
          <p className="text-[var(--c-soft)] text-lg max-w-2xl mx-auto">
            Mercav es mucho más que inventario y nómina. Descubre todo lo que podés hacer.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {allModules.map((mod, i) => (
            <div
              key={i}
              className="group rounded-[1.5rem] border border-[var(--c-line)] bg-[var(--c-ground)] p-6 transition-all duration-300 hover:border-[var(--c-yellow)] hover:bg-[var(--c-raised)] cursor-pointer"
            >
              <h3 className="font-semibold text-[var(--c-text)] mb-2 group-hover:text-[var(--c-yellow)] transition-colors">
                {mod.title}
              </h3>
              <p className="text-[var(--c-soft)] text-sm">{mod.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-[1rem] border-2 border-[var(--c-yellow)] text-[var(--c-yellow)] px-8 py-3 font-semibold hover:bg-[var(--c-yellow)] hover:text-black transition-all duration-300 group"
          >
            Ver todos los módulos
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingProofMini() {
  return (
    <CartelSection>
      <div className="c-container text-center">
        <p className="c-label text-[var(--c-yellow-text)] mb-4">Disponible en</p>
        <h3 className="c-h2 mb-6">
          Bolivia, Argentina, Brasil, Chile,<br />
          Colombia, México, Perú, Uruguay<br />
          <span className="c-yellow">y Costa Rica.</span>
        </h3>
        <p className="text-[var(--c-soft)] text-lg">
          Hecho en Latinoamérica, para negocios de Latinoamérica.
        </p>
      </div>
    </CartelSection>
  );
}

/**
 * CTA final
 */
export function LandingCTAMini() {
  return (
    <section className="relative py-24">
      <div className="c-container">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[var(--c-raised)] to-[var(--c-ground)] px-8 py-20 md:px-16 text-center border border-[var(--c-line)]">
          {/* Animated gradient background */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-[var(--c-yellow)] blur-[120px] opacity-5 -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[var(--c-magenta)] blur-[120px] opacity-5 translate-y-1/2" />
          </div>

          <div className="relative z-10">
            <h2 className="c-display text-[2.4rem] md:text-[3rem] mb-6 [text-wrap:balance] leading-tight">
              Comenzá <span className="c-yellow">sin costo.</span>
            </h2>
            <p className="c-lead mx-auto mb-12 max-w-lg text-lg">
              30 minutos para tener tu negocio funcionando en Mercav.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:items-center">
              <AuthCTA className="sm:flex-row" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ
 */
export function LandingFAQMini() {
  const faqs = [
    {
      q: "¿Es realmente gratis?",
      a: "Sí. Gratis si usás inventario, trabajadores y nómina. Siempre sin publicidad ni sorpresas.",
    },
    {
      q: "¿Qué pasa con mis datos?",
      a: "Cifrados. Solo vos tenés acceso. Si cerramos, los descargas. Promesa de Mercav.",
    },
    {
      q: "¿Cuánto tarda configurar?",
      a: "30 minutos. Te guiamos en cada paso desde el primer login.",
    },
    {
      q: "¿Puedo cambiar de idea?",
      a: "Claro. Descargas todo en un click. Sin contrato, sin atadura.",
    },
    {
      q: "¿Funciona en móvil?",
      a: "Perfectamente. Hecho para que funcione mejor en tu teléfono que en escritorio.",
    },
    {
      q: "¿Cómo empiezo?",
      a: "Arriba a la derecha, 'Crear cuenta'. Email + contraseña. Listo.",
    },
  ];

  return (
    <CartelSection id="faq">
      <div className="c-container">
        <div className="mb-16 text-center">
          <h2 className="c-h2">Preguntas frecuentes.</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="group rounded-[1.5rem] border border-[var(--c-line)] bg-[var(--c-ground)] p-6 transition-all duration-300 hover:border-[var(--c-yellow)] hover:bg-[var(--c-raised)]"
            >
              <h3 className="font-semibold text-[var(--c-text)] text-sm mb-3 leading-tight">
                {faq.q}
              </h3>
              <p className="text-[var(--c-soft)] text-sm leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[var(--c-soft)] mb-4">¿Más dudas?</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 c-label text-[var(--c-yellow-text)] hover:text-[var(--c-yellow)] transition-colors group"
          >
            Escribinos
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden />
          </Link>
        </div>
      </div>
    </CartelSection>
  );
}
