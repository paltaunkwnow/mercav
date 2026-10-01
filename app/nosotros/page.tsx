import Link from "next/link";
import { ArrowUpRight, BookOpen, Globe2, Heart, MapPin, Shield, Target, Workflow } from "lucide-react";
import { ButtonLink, CTABand, Container, Reveal, Section, SectionHeading } from "@/components/site/primitives";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

function StarOfDavid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" className={className} aria-hidden>
      <path d="M12 3.2 20.2 17.4H3.8Z" />
      <path d="M12 20.8 3.8 6.6h16.4Z" />
    </svg>
  );
}

const SOCIALS = [
  { name: "askforvini.pw", icon: Globe2, href: "https://askforvini.pw" },
  { name: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com/askforvini/" },
  { name: "LinkedIn", icon: LinkedinIcon, href: "https://www.linkedin.com/in/vinicius-salazar-54700938a/" },
  { name: "GitHub", icon: GithubIcon, href: "https://github.com/invertilo" },
];

const HOW_I_WORK = [
  {
    icon: Target,
    title: "Sistemas",
    body: "Diseño el servicio, lo pruebo y lo cierro. APIs, autenticación y datos que tienen que sostener carga.",
  },
  {
    icon: Shield,
    title: "Ciberseguridad",
    body: "Seguridad defensiva de alto nivel: pentesting autorizado, auditoría y respuesta post-incidente. Qué pasó, qué quedó expuesto y qué hay que cerrar.",
  },
  {
    icon: StarOfDavid,
    title: "Fe",
    body: "Agradezco a Hashem el conocimiento para construir. Ante el Creador, el trabajo pide la misma seriedad que el resto del día.",
  },
  {
    icon: Heart,
    title: "Valores",
    body: "Ayudar a otras personas. Si el producto no sirve a alguien concreto, no vale.",
  },
  {
    icon: BookOpen,
    title: "Uso",
    body: "Claro, completo y al alcance. Nadie debería perderse para publicar, contratar o consultar.",
  },
  {
    icon: Workflow,
    title: "Cierre",
    body: "No publico recetas de ataque. Documento el fallo y el arreglo: el informe tiene que servir para defender.",
  },
];

const ORDER = [
  { time: "Oficio", title: "Sistemas y seguridad", desc: "Backend, pentesting autorizado, defensa y respuesta post-incidente. El detalle está en askforvini.pw." },
  { time: "Fe", title: "Observancia", desc: "El día se ordena ante el Creador. El trabajo se mide con esa misma seriedad." },
  { time: "Comunidad", title: "Santa Cruz", desc: "Devolver la generosidad es construir algo que cualquiera pueda usar entero." },
  { time: "Servicio", title: "Mercav", desc: "Anuncios, servicios, empleo, herramientas y lo kosher: una plataforma para ayudar." },
];

export default function Nosotros() {
  return (
    <div className="w-full bg-bg-primary">
      {/* Hero */}
      <header className="relative w-full overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mv-aura" aria-hidden />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-20">
            <Reveal>
              <p className="mv-kicker">Quién soy</p>
              <h1 className="mv-h1 mt-5">
                Vinicius, <span className="mv-gold-text">fundador de Mercav.</span>
              </h1>
              <p className="mv-lead mt-6">
                19 años. Santa Cruz de la Sierra. Sistemas, ciberseguridad y una plataforma que se pueda usar de verdad.
              </p>
              <ul className="mt-9 flex flex-wrap gap-2" aria-label="Perfiles de Vinicius">
                {SOCIALS.map(({ name, icon: Icon, href }) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mv-focus inline-flex h-10 items-center gap-2 rounded-full border border-[var(--mv-hairline-strong)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)]"
                    >
                      <Icon className="h-4 w-4" />
                      {name}
                      <span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120} className="mx-auto w-full max-w-sm lg:max-w-none">
              <figure className="liquid-glass liquid-glass-lens overflow-hidden rounded-[2rem] p-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-bg-tertiary">
                  <img
                    src="/images/vinicius.jpg"
                    alt="Vinicius, fundador de Mercav, en Santa Cruz de la Sierra"
                    width={960}
                    height={1280}
                    decoding="async"
                    className="h-full w-full object-cover object-[center_30%]"
                  />
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-black/65 px-3 text-xs font-medium text-white">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> Santa Cruz, Bolivia
                  </span>
                </div>
                <figcaption className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
                  <span>
                    <span className="block font-display text-lg font-semibold text-[var(--text-primary)]">Vinicius</span>
                    <span className="block text-sm text-[var(--text-secondary)]">Fundador de Mercav</span>
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border-gold)] text-gold">
                    <StarOfDavid className="h-5 w-5" />
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </Container>
      </header>

      {/* Presentación */}
      <Section tone="raised" labelledBy="presentacion">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="mv-kicker">Presentación</p>
              <h2 id="presentacion" className="sr-only">
                Presentación
              </h2>
              <Reveal className="mt-6">
                <p lang="he" dir="rtl" className="font-display text-3xl font-medium leading-snug text-[var(--text-primary)] md:text-4xl">
                  בעזרת השם, כל עכבה לטובה.
                </p>
                <p className="mt-4 text-[0.9375rem] text-[var(--text-secondary)]">Con la ayuda del Creador, cada demora es para bien.</p>
                <div className="mt-6 h-px w-24 bg-gradient-to-r from-gold to-transparent" aria-hidden />
              </Reveal>
            </div>

            <div className="max-w-[65ch] space-y-6 text-[1.0625rem] leading-[1.75] text-[var(--text-secondary)]">
              <p>
                Me llamo <span className="font-semibold text-[var(--text-primary)]">Vinicius</span>. Tengo 19 años y vivo en Santa Cruz de la Sierra, Bolivia. Soy el fundador de Mercav: diseño la lógica de los sistemas —APIs, autenticación, datos, reglas de negocio— y trabajo ciberseguridad defensiva de alto nivel: pentesting autorizado, defensa, auditoría y respuesta post-incidente. El perfil técnico está en{" "}
                <a href="https://askforvini.pw" target="_blank" rel="noopener noreferrer" className="mv-link">
                  askforvini.pw
                </a>
                .
              </p>
              <p>
                Aprendí el oficio construyendo software para negocios reales, no recitando teoría. Mercav es el resultado de ese trabajo: anuncios, servicios, empleo, herramientas y ciberinteligencia en una sola plataforma, hecha desde Bolivia para quien necesita usarla de verdad.
              </p>

              <aside className="liquid-glass rounded-[1.75rem] p-6 md:p-8" aria-label="Agradecimiento">
                <div className="flex items-start gap-4 md:gap-5">
                  <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                    <StarOfDavid className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 space-y-3">
                    <p className="text-[1.0625rem] font-medium leading-7 text-[var(--text-primary)] md:text-lg">
                      Agradezco a Hashem el conocimiento con el que puedo desarrollar este sistema.
                    </p>
                    <p className="text-base leading-7 text-[var(--text-secondary)]">
                      Mis creencias y valores piden que no quede a medias: que se entienda, esté completo y cualquiera pueda usarlo.
                    </p>
                  </div>
                </div>
              </aside>

              <p>
                La observancia ordena el día con la misma seriedad con la que reviso un sistema. Ante el Creador, el trabajo tiene que ser limpio, ayudar a otras personas y no usar a nadie como medio.
              </p>
              <p>
                Quiero ayudar. Mercav tiene que ser usable de punta a punta: publicar, contratar, buscar empleo o consultar una herramienta sin perderse. Kerem y Mercav Kosher siguen el mismo criterio: un estándar verificable y un servicio que se pueda usar.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Cómo trabajo */}
      <Section labelledBy="como-trabajo-title">
        <Container>
          <SectionHeading
            id="como-trabajo-title"
            kicker="Cómo trabajo"
            title="Backend, ciberseguridad y un producto que tiene que cerrar bien."
            lead="El detalle técnico está en askforvini.pw. Acá, los criterios que ordenan el trabajo."
          />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_I_WORK.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={Math.min(i * 50, 250)} className="liquid-glass flex flex-col rounded-[1.5rem] p-6 md:p-7">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
                <p className="mv-body mt-2">{body}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Kerem by Mercav — próximo */}
      <Section tone="raised" labelledBy="kerem-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="mv-kicker">Hospitalidad · Santa Cruz</p>
                <span className="mv-chip">Próximamente</span>
              </div>
              <h2 id="kerem-title" className="mv-h2 mt-5">
                Kerem <span className="font-normal text-[var(--text-secondary)]">by Mercav</span>
              </h2>
              <div className="mt-6 space-y-5 text-[1.0625rem] leading-[1.75] text-[var(--text-secondary)]">
                <p>
                  <span className="font-medium text-[var(--text-primary)]">Kerem</span> es el próximo proyecto: una mesa física de hospitalidad en Santa Cruz de la Sierra. El estándar es kashrut: ingredientes, cocina y servicio con el mismo rigor que aplico a un sistema.
                </p>
                <p>El criterio es el mismo en la cocina y en el código: que el estándar se pueda verificar y que el servicio se pueda usar.</p>
                <p>
                  <Link href="/kosher" className="mv-link">
                    Mercav Kosher
                  </Link>{" "}
                  es la capa digital: un directorio de lugares y servicios. No emite certificación, hechsher ni psak, y no sustituye a una agencia. Informa, con fuente, para quien necesita decidir.
                </p>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--mv-hairline)] pt-6">
                {[
                  { label: "Estándar", val: "Kashrut" },
                  { label: "Sede", val: "Santa Cruz" },
                  { label: "Alcance", val: "Bolivia" },
                  { label: "Directorio", val: "Mercav Kosher" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-[var(--text-tertiary)]">{item.label}</dt>
                    <dd className="mt-1 font-semibold text-[var(--text-primary)]">{item.val}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-[var(--mv-hairline)] bg-bg-tertiary lg:aspect-[4/5]">
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
        </Container>
      </Section>

      {/* El trabajo, en orden */}
      <Section labelledBy="orden-title">
        <Container>
          <SectionHeading id="orden-title" kicker="En orden" title="El trabajo, en orden." lead="Sistemas, ciberseguridad, fe y un producto que tiene que servir." />
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER.map((m, i) => (
              <li key={m.title} className="mv-panel flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gold">{m.time}</span>
                  <span className="mv-data text-xs text-[var(--text-tertiary)]">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-[var(--text-primary)]">{m.title}</h3>
                <p className="mv-body mt-2">{m.desc}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <CTABand
        title="Si querés hablar"
        lead="Podés usar Mercav, leer el oficio en askforvini.pw o escribirme. El trabajo se toma en serio."
        action={
          <>
            <ButtonLink href="/register" size="lg" className="w-full sm:w-auto">
              Crear cuenta
            </ButtonLink>
            <a href="https://askforvini.pw" target="_blank" rel="noopener noreferrer" className="mv-btn mv-btn-ghost mv-btn-lg w-full sm:w-auto">
              askforvini.pw <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </>
        }
      />
    </div>
  );
}
// creado por pato dev y askforvini
