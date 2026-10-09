import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  DollarSign,
  Eye,
  Globe2,
  Heart,
  Languages,
  Layers,
  Megaphone,
  Scale,
  Target,
  Users,
  X,
} from "@/components/icons";
import { ButtonLink, CTABand, Container, Reveal, Section, SectionHeading } from "@/components/site/primitives";

const PROBLEMS = [
  {
    icon: Megaphone,
    title: "Publicidad fragmentada",
    desc: "Alquilar un espacio publicitario suele requerir conocer al dueño en persona. No había infraestructura digital que conecte anunciantes con propietarios de espacios.",
  },
  {
    icon: Users,
    title: "Talento aislado",
    desc: "Freelancers de la región compiten en plataformas extranjeras con comisiones altas, precios en dólares y soporte que no habla su idioma.",
  },
  {
    icon: Briefcase,
    title: "Empleo desconectado",
    desc: "Las bolsas de empleo de la región están desactualizadas, con una experiencia pobre y sin integración con perfiles profesionales.",
  },
];

const PRINCIPLES = [
  { icon: Globe2, title: "Hecho para Latam", desc: "Precios acordes a nuestra realidad y soporte en español nativo. No adaptamos herramientas de afuera: construimos desde cero para la región." },
  { icon: Scale, title: "Sin intermediarios abusivos", desc: "No escondemos información de contacto ni ponemos trabas artificiales. Tu primer alquiler de espacio no paga comisión de plataforma." },
  { icon: Eye, title: "Transparencia", desc: "Precios claros desde el primer clic, reseñas de clientes reales y las mismas reglas para todos los usuarios." },
  { icon: DollarSign, title: "Precios para la región", desc: "Diez dólares no significan lo mismo en cada país. Los planes están pensados para la realidad económica latinoamericana." },
  { icon: Target, title: "Enfoque en resultados", desc: "Cada función existe para generar valor real. Medimos el éxito por conexiones concretadas y transacciones completadas, no por métricas de vanidad." },
  { icon: Clock, title: "Rapidez sin atajos", desc: "Publicar un servicio, encontrar un profesional o contratar con pago protegido lleva pocos pasos. Tu tiempo es el recurso más valioso." },
];

const COMPARISON = [
  { them: "Comisiones altas en cada transacción", us: "Tu primer alquiler sin comisión de plataforma. Después, comisiones claras antes de confirmar." },
  { them: "Plataformas en inglés traducidas a medias", us: "Construido en español desde la primera línea de código." },
  { them: "Soporte automatizado con respuestas genéricas", us: "Soporte de personas, en tu idioma." },
  { them: "Una herramienta distinta para cada necesidad", us: "Un solo ecosistema, con todo integrado bajo tu perfil." },
  { them: "Precios en dólares sin contexto regional", us: "Planes pensados para la realidad económica de la región." },
];

const MODULES = ["Ads", "Services", "Jobs", "Business", "Tools", "Pwn", "Kosher"];

export default function PorQueMercavPage() {
  return (
    <div className="w-full bg-bg-primary">
      {/* Hero */}
      <header className="relative w-full overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mv-aura" aria-hidden />
        <Container className="relative">
          <Reveal className="max-w-4xl">
            <p className="mv-kicker">Por qué Mercav</p>
            <h1 className="mv-h1 mt-5">
              Latinoamérica tiene el talento. <span className="mv-gold-text">Le faltaban las herramientas.</span>
            </h1>
            <p className="mv-lead mt-6">
              La región está llena de talento y de negocios que funcionan, pero las herramientas para conectarlos fueron diseñadas para otros mercados. Mercav nace para cambiar eso.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg" className="w-full sm:w-auto">
                Empezar gratis <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="#el-problema" tone="secondary" size="lg" className="w-full sm:w-auto">
                Leer el porqué
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </header>

      {/* 1. Problema */}
      <Section tone="raised" id="el-problema" labelledBy="pq-problema">
        <Container>
          <SectionHeading
            id="pq-problema"
            kicker="El problema"
            title="Durante años, la región trabajó con herramientas pensadas para otros continentes."
          />
          <ol className="mt-14 grid gap-4 md:grid-cols-3">
            {PROBLEMS.map(({ icon: Icon, title, desc }, i) => (
              <Reveal as="li" key={title} delay={i * 60} className="mv-panel flex flex-col p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mv-data text-sm text-[var(--text-tertiary)]">0{i + 1}</span>
                </div>
                <h3 className="mv-h3 mt-6">{title}</h3>
                <p className="mv-body mt-3">{desc}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* 2. Solución */}
      <Section labelledBy="pq-solucion">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                id="pq-solucion"
                kicker="La solución"
                title="Un ecosistema completo, bajo una sola cuenta."
                lead="Publicidad offline, talento digital, bolsa de empleo y herramientas de gestión. Todo integrado bajo el mismo perfil profesional."
              />
              <Reveal className="liquid-glass mt-10 rounded-[1.75rem] p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold">
                    <Layers className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="font-semibold text-[var(--text-primary)]">Una cuenta, todos los módulos</p>
                </div>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Módulos de Mercav">
                  {MODULES.map((m) => (
                    <li key={m} className="mv-chip">
                      {m}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {PRINCIPLES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-6">
                  <Icon className="h-5 w-5 text-gold" aria-hidden />
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
                  <p className="mv-body">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* 3. Por qué ahora */}
      <Section tone="raised" tight labelledBy="pq-ahora">
        <Container>
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-16">
            <SectionHeading id="pq-ahora" kicker="Por qué ahora" title="La región ya trabaja en digital." />
            <Reveal>
              <p className="mv-lead">
                Hay más personas conectadas, más negocios digitalizándose y más profesionales que eligen trabajar de forma independiente. Lo que faltaba era una plataforma hecha para ellos, en su idioma y con sus reglas.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* 4. Cómo nos diferenciamos */}
      <Section labelledBy="pq-diferencia">
        <Container>
          <SectionHeading id="pq-diferencia" kicker="Cómo" title="Lo que hacemos distinto." lead="Lo habitual en la industria, y lo que encontrás en Mercav." />
          <div className="mt-12 hidden grid-cols-2 gap-4 px-6 text-sm font-semibold md:grid">
            <p className="text-[var(--text-tertiary)]">Lo habitual</p>
            <p className="text-gold">En Mercav</p>
          </div>
          <ul className="mt-6 space-y-3 md:mt-3">
            {COMPARISON.map((c) => (
              <li key={c.us} className="mv-panel grid overflow-hidden rounded-[1.25rem] md:grid-cols-2">
                <div className="flex items-start gap-3 px-5 py-4 md:px-6 md:py-5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                  <p className="text-[0.9375rem] text-[var(--text-secondary)]">
                    <span className="sr-only">Lo habitual: </span>
                    {c.them}
                  </p>
                </div>
                <div className="flex items-start gap-3 border-t border-[var(--mv-hairline)] bg-[var(--mv-gold-wash)] px-5 py-4 md:border-l md:border-t-0 md:px-6 md:py-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <p className="text-[0.9375rem] font-medium text-[var(--text-primary)]">
                    <span className="sr-only">En Mercav: </span>
                    {c.us}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 5. Confianza: quién lo construye y hacia dónde va */}
      <Section tone="raised" labelledBy="pq-vision">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading id="pq-vision" kicker="Nuestra visión" title="Las mismas herramientas que una gran empresa, al alcance de cualquiera." />
              <Reveal className="mt-8 space-y-5">
                <p className="mv-body text-base">
                  Imaginamos un continente donde cualquier emprendedor, freelancer o empresa pequeña accede a las mismas herramientas profesionales que las grandes corporaciones.
                </p>
                <p className="mv-body text-base">
                  Donde contratar talento, alquilar publicidad o encontrar empleo no depende de a quién conocés, sino de la calidad de lo que ofrecés. Recién estamos empezando.
                </p>
              </Reveal>
            </div>
            <Reveal className="mv-panel flex flex-col justify-between gap-8 p-6 md:p-9">
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
                  <Heart className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mv-h3 mt-6">Construido con intención</h3>
                <p className="mv-body mt-3">
                  Mercav no es un proyecto de capital de riesgo. Es una misión personal de un fundador que creció viendo estos problemas de primera mano, en Santa Cruz de la Sierra. Cada detalle tiene un porqué.
                </p>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
                <li className="inline-flex items-center gap-2">
                  <Languages className="h-4 w-4 text-gold" aria-hidden /> Español nativo
                </li>
                <li className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" aria-hidden /> Primer alquiler sin comisión
                </li>
              </ul>
              <Link href="/nosotros" className="mv-link inline-flex w-fit items-center gap-2 text-sm">
                Conocer al fundador <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Reveal>
          </div>
        </Container>
      </Section>

      <CTABand
        title="¿Listo para ser parte del cambio?"
        lead="Creá tu cuenta gratis y empezá a usar Mercav hoy."
        action={
          <ButtonLink href="/register" size="lg" className="w-full sm:w-auto">
            Empezar gratis <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        }
      />
    </div>
  );
}
// creado por pato dev y askforvini
