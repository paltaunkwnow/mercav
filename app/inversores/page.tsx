"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, DollarSign, Globe2, Layers, Rocket, Users } from "lucide-react";
import { Container, Reveal, Section, SectionHeading, buttonClass } from "@/components/site/primitives";

const PROBLEMS = [
  "La publicidad offline en Latinoamérica no tiene infraestructura digital. Los dueños dependen de contactos personales y negociaciones informales.",
  "El mercado freelance latinoamericano carece de una plataforma regional confiable con garantías reales.",
  "Las bolsas de empleo existentes están desactualizadas y no integran el perfil profesional con el proceso de selección.",
];

const THESIS = [
  { icon: Globe2, title: "Una región en digitalización", desc: "Latinoamérica es un mercado amplio que se digitaliza año tras año, con necesidades que las plataformas globales no atienden." },
  { icon: BarChart3, title: "Monetización diversificada", desc: "Comisiones, suscripciones premium y herramientas con IA: más de una fuente de ingreso desde el inicio." },
  { icon: Layers, title: "Ventaja por integración", desc: "Un ecosistema integrado genera efectos de red. Quien usa un módulo encuentra el siguiente con la misma cuenta." },
  { icon: Rocket, title: "Escalable país por país", desc: "Infraestructura preparada para crecer mercado por mercado, con costos marginales decrecientes." },
  { icon: Users, title: "Crecimiento con la comunidad", desc: "Un ecosistema conectado invita a sumar a otros: clientes, proveedores y equipos dentro de la misma red." },
  { icon: DollarSign, title: "Ingresos futuros", desc: "Además de comisiones y planes, la publicidad programática es una línea prevista para más adelante." },
];

const LOOKING_FOR = [
  "Inversores ángeles con conexión a Latam",
  "Fondos de venture capital early-stage",
  "Mentores estratégicos con experiencia en marketplaces",
  "Partners tecnológicos que quieran co-construir",
];

export default function InversoresPage() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/contact/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSent(true);
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  const labelCls = "mb-2 block text-sm font-medium text-[var(--text-primary)]";

  return (
    <div className="w-full bg-bg-primary">
      {/* Hero */}
      <header className="relative w-full overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mv-aura" aria-hidden />
        <Container className="relative">
          <Reveal className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="mv-kicker">Inversores</p>
              <h1 className="mv-h1 mt-5">
                Una oportunidad de construir <span className="mv-gold-text">junto a Latinoamérica.</span>
              </h1>
              <p className="mv-lead mt-6">
                Mercav busca su primer capital semilla para escalar una plataforma que ya está construida: la infraestructura digital que le faltaba a la región.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#contacto-inversores" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                  Contactar al fundador <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <a href="#tesis" className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
                  Ver la tesis
                </a>
              </div>
            </div>
            <dl className="mv-panel divide-y divide-[var(--mv-hairline)] rounded-[1.5rem]">
              {[
                { k: "Etapa", v: "Búsqueda de capital semilla" },
                { k: "Producto", v: "Plataforma construida" },
                { k: "Sede", v: "Santa Cruz de la Sierra, Bolivia" },
                { k: "Modelo", v: "Comisiones, suscripciones y herramientas" },
              ].map((f) => (
                <div key={f.k} className="flex flex-col gap-0.5 px-5 py-4">
                  <dt className="text-xs text-[var(--text-tertiary)]">{f.k}</dt>
                  <dd className="text-[0.9375rem] font-medium text-[var(--text-primary)]">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </header>

      {/* 1. Problema → 2. Solución */}
      <Section tone="raised" labelledBy="inv-problema">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading id="inv-problema" kicker="El problema" title="Tres mercados que siguen operando sin infraestructura." />
              <ol className="mt-10 space-y-4">
                {PROBLEMS.map((p, i) => (
                  <li key={i} className="mv-panel flex gap-4 rounded-[1.25rem] p-5 md:p-6">
                    <span className="mv-data shrink-0 pt-0.5 text-sm text-gold">0{i + 1}</span>
                    <p className="mv-body text-[var(--text-primary)]">{p}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:pt-24">
              <Reveal className="liquid-glass rounded-[1.75rem] p-6 md:p-9">
                <p className="mv-kicker">La solución</p>
                <h2 className="mv-h3 mt-4">Un solo ecosistema para lo que hoy está fragmentado.</h2>
                <p className="mv-body mt-4">
                  Mercav es una plataforma digital latinoamericana que integra publicidad offline, servicios digitales, bolsa de empleo y herramientas para empresas.
                </p>
                <p className="mv-body mt-4">
                  El mercado existe, el problema es real y la solución ya está construida. Lo que necesitamos ahora es escala.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 3. Por qué ahora */}
      <Section tight labelledBy="inv-ahora">
        <Container>
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-16">
            <SectionHeading id="inv-ahora" kicker="Por qué ahora" title="La región ya trabaja en digital." />
            <Reveal>
              <p className="mv-lead">
                Hay más personas conectadas, más empresas digitalizándose y más profesionales buscando trabajar de forma independiente. Mercav llega cuando esa demanda ya existe y todavía no tiene una plataforma regional que la ordene.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* 4. Cómo: tesis */}
      <Section tone="raised" id="tesis" labelledBy="inv-tesis">
        <Container>
          <SectionHeading id="inv-tesis" kicker="Tesis de inversión" title="Por qué este modelo puede escalar." />
          <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {THESIS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-6">
                <Icon className="h-5 w-5 text-gold" aria-hidden />
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
                <p className="mv-body">{desc}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Kerem by Mercav — proyecto próximo */}
      <Section labelledBy="inv-kerem">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="mv-kicker">Kerem by Mercav</p>
                <span className="mv-chip">Próximamente · Santa Cruz</span>
              </div>
              <h2 id="inv-kerem" className="mv-h2 mt-5">
                Hospitalidad con kashrut en Santa Cruz.
              </h2>
              <p className="mv-body mt-6 text-base">
                Kerem es un proyecto de hospitalidad en Santa Cruz de la Sierra. El estándar es kashrut. En la ciudad no hay una oferta de ese tipo; el objetivo es construirla con el mismo rigor que un sistema: verificable, usable y sostenible.
              </p>
              <p className="mv-body mt-4 text-base">
                Mercav Kosher es el directorio que lo acompaña: lugares y servicios con fuente. No emite certificación ni hechsher. La expansión a otros países es una fase posterior, no el punto de partida.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--mv-hairline)] pt-6">
                {[
                  { t: "Estándar", s: "Kashrut" },
                  { t: "Sede", s: "Santa Cruz" },
                  { t: "Alcance", s: "Bolivia" },
                  { t: "Directorio", s: "Mercav Kosher" },
                ].map((f) => (
                  <div key={f.t}>
                    <dt className="text-xs text-[var(--text-tertiary)]">{f.t}</dt>
                    <dd className="mt-1 font-semibold text-[var(--text-primary)]">{f.s}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-[var(--mv-hairline)] bg-bg-tertiary">
                <img
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover grayscale-[40%]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              <figcaption className="mt-3 text-xs text-[var(--text-tertiary)]">Imagen ilustrativa. Kerem todavía no abrió sus puertas.</figcaption>
            </figure>
          </div>
          <p className="mv-body mx-auto mt-14 max-w-3xl border-t border-[var(--mv-hairline)] pt-8 text-center">
            Kerem se diseña para quien necesita ese estándar y para quien quiera un servicio claro. Mercav Kosher no certifica: muestra la fuente de cada lugar para que la decisión quede en quien consulta.
          </p>
        </Container>
      </Section>

      {/* 5. Confianza: quién está detrás + qué buscamos */}
      <Section tone="raised" labelledBy="inv-fundador">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <SectionHeading id="inv-fundador" kicker="Quién está detrás" title="Un fundador que construye desde adentro." />
              <Reveal className="mt-8 space-y-4">
                <p className="mv-body text-base">Me llamo Vinicius. Tengo 19 años y vivo en Santa Cruz de la Sierra.</p>
                <p className="mv-body text-base">
                  Soy el fundador de Mercav. Diseño sistemas —backend, autenticación, datos— y trabajo ciberseguridad defensiva: pentesting autorizado, defensa, auditoría y respuesta post-incidente. El perfil técnico está en{" "}
                  <a href="https://askforvini.pw" target="_blank" rel="noopener noreferrer" className="mv-link">
                    askforvini.pw
                  </a>
                  .
                </p>
                <p className="mv-body text-base">
                  Aprendí el oficio construyendo software para negocios reales: punto de venta, comercio y herramientas que alguien usaba al día siguiente. Mercav reúne anuncios, servicios, empleo y herramientas en un solo lugar, hecho desde Bolivia.
                </p>
                <p className="mv-body text-base">
                  Quiero devolver la generosidad con un sistema que se pueda usar de punta a punta: claro, completo y al alcance. El trabajo, la fe ante el Creador y el servicio van juntos.
                </p>
              </Reveal>
            </div>
            <div>
              <h3 className="mv-h3">Lo que buscamos</h3>
              <p className="mv-body mt-3">
                Inversores que aporten capital y visión: personas que entiendan el mercado latinoamericano, que crean en fundadores que construyen desde adentro y que quieran sumarse en los primeros capítulos.
              </p>
              <ul className="mt-6 space-y-2.5">
                {LOOKING_FOR.map((item) => (
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

      {/* 6. CTA: contacto */}
      <Section id="contacto-inversores" labelledBy="inv-contacto">
        <Container width="narrow">
          <div className="liquid-glass rounded-[2rem] p-6 sm:p-8 md:p-12">
            <p className="mv-kicker">Contacto directo</p>
            <h2 id="inv-contacto" className="mv-h2 mt-4">
              Contacto para inversores
            </h2>
            <p className="mv-body mt-4">
              Esta página tiene fines informativos. Cualquier proceso de inversión se lleva a cabo mediante documentación formal y acuerdos legales específicos.
            </p>

            {sent ? (
              <div role="status" className="mv-fade mt-10 flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-gold" aria-hidden />
                <h3 className="mv-h3 mt-5">Mensaje enviado</h3>
                <p className="mv-body mt-2">Te vamos a responder a la brevedad.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="inv-name" className={labelCls}>
                    Nombre completo
                  </label>
                  <input
                    id="inv-name"
                    name="name"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Tu nombre"
                    className="mv-input"
                  />
                </div>
                <div>
                  <label htmlFor="inv-email" className={labelCls}>
                    Correo electrónico
                  </label>
                  <input
                    id="inv-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="mv-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="inv-company" className={labelCls}>
                    Empresa u organización <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span>
                  </label>
                  <input
                    id="inv-company"
                    name="company"
                    autoComplete="organization"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nombre de tu empresa"
                    className="mv-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="inv-message" className={labelCls}>
                    Mensaje
                  </label>
                  <textarea
                    id="inv-message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="¿Por qué te interesa invertir en Mercav?"
                    className="mv-input min-h-40 resize-y py-3"
                  />
                </div>
                <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-[var(--text-tertiary)]">Todos los campos son obligatorios salvo la empresa.</p>
                  <button type="submit" disabled={sending} aria-busy={sending} className={buttonClass("primary", "md", "w-full md:w-auto")}>
                    {sending ? "Enviando…" : (
                      <>
                        Quiero saber más <ArrowRight className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}
// creado por pato dev y askforvini
