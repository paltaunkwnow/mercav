import type { ComponentType, CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Globe2, MapPin } from "@/components/icons";
// Kosher, the app and /contacto live on other hosts than mercav.lat.
import { HostLink } from "@/components/layout/HostContext";
import { Mervi, type MerviPose } from "@/components/mervi/Mervi";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { FounderRoll } from "@/components/site/cartel/FounderRoll";
import { KeremPoster } from "@/components/site/cartel/KeremPoster";
import { ProfilePhoto } from "@/components/site/cartel/ProfilePhoto";
import { CartelSection, FitLines } from "@/components/site/cartel/primitives";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { cn } from "@/lib/utils";

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

const SOCIALS: { name: string; icon: ComponentType<{ className?: string }>; href: string }[] = [
  { name: "askforvini.pw", icon: Globe2, href: "https://askforvini.pw" },
  { name: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com/askforvini/" },
  { name: "LinkedIn", icon: LinkedinIcon, href: "https://www.linkedin.com/in/vinicius-salazar-54700938a/" },
  { name: "GitHub", icon: GithubIcon, href: "https://github.com/invertilo" },
];

/** Perfiles públicos de Alejandro Mendoza, CTO. */
const ALEJANDRO_SOCIALS: { name: string; icon: ComponentType<{ className?: string }>; href: string }[] = [
  { name: "GitHub", icon: GithubIcon, href: "https://github.com/alejondr3" },
  { name: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com/alejondre._/" },
];

const JAIDER_SOCIALS: { name: string; icon: ComponentType<{ className?: string }>; href: string }[] = [
  { name: "LinkedIn", icon: LinkedinIcon, href: "https://www.linkedin.com/in/jaider-alejandro/" },
  { name: "GitHub", icon: GithubIcon, href: "https://github.com/Suredials" },
];

const ORDER = [
  { time: "Oficio", title: "Sistemas y seguridad", desc: "Backend, pentesting autorizado, defensa y respuesta post-incidente. El detalle está en askforvini.pw." },
  { time: "Fe", title: "Observancia", desc: "El día se ordena ante el Creador. El trabajo se mide con esa misma seriedad." },
  { time: "Comunidad", title: "Santa Cruz", desc: "Devolver la generosidad es construir algo que cualquiera pueda usar entero." },
  { time: "Servicio", title: "Mercav", desc: "Anuncios, servicios, empleo, herramientas y lo kosher: una plataforma para ayudar." },
];

/** Filetes verticales de una fila que pasa de 1 a 2 columnas, y a 4 desde xl. */
function orderRule(i: number) {
  return cn(
    i % 2 === 1 && "sm:border-l-2 sm:pl-6",
    i % 2 === 0 && "sm:pr-6",
    i > 0 && "xl:border-l-2 xl:pl-8",
    i < ORDER.length - 1 && "xl:pr-8",
  );
}

/**
 * Foto del equipo como afiche pegado, con la mascota correspondiente en la esquina de abajo. Mervi sigue siendo la
 * mascota principal de Mercav; los personajes propios de cada integrante se usan solamente en su perfil. La mascota
 * va fuera del afiche: si girara con la inclinación, el pixel art perdería la nitidez.
 */
type TeamMascot = {
  src: string;
  alt: string;
};

function TeamPhoto({ tilt, pose, mascot, side, tag, children }: { tilt: string; pose?: MerviPose; mascot?: TeamMascot; side: "left" | "right"; tag: ReactNode; children: ReactNode }) {
  const mascotPosition = side === "right" ? "right-2 sm:right-[-3rem]" : "left-2 sm:left-[-3rem]";
  return (
    <div className="relative mx-auto w-full max-w-sm lg:mx-0">
      <figure className="c-poster c-inverse w-full p-2" style={{ "--tilt": tilt } as CSSProperties}>
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--c-raised)]">
          {children}
          <span className="c-label absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-[2px] bg-[#0b0a09] px-2.5 py-1.5 text-[0.95rem] text-[#fffdf8]">{tag}</span>
        </div>
      </figure>
      {mascot ? (
        <img
          src={mascot.src}
          alt={mascot.alt}
          width={192}
          height={192}
          decoding="async"
          className={cn(
            "pointer-events-none absolute bottom-[-12px] z-10 h-24 w-24 object-contain [image-rendering:pixelated] sm:bottom-[-24px] sm:h-48 sm:w-48",
            mascotPosition,
          )}
        />
      ) : pose ? (
        <Mervi
          pose={pose}
          scale={1}
          scaleLg={2}
          className={cn(
            "pointer-events-none absolute bottom-[calc(var(--mervi-unit)*-12)] z-10",
            side === "right" ? "right-2 sm:right-[calc(var(--mervi-unit)*-30)]" : "left-2 sm:left-[calc(var(--mervi-unit)*-30)]",
          )}
        />
      ) : null}
    </div>
  );
}

export default function Nosotros() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      {/* Portada: el equipo */}
      <section aria-labelledby="nosotros-title" className="relative pb-20 pt-[calc(var(--c-nav-h)+2rem)] md:pb-28 md:pt-[calc(var(--c-nav-h)+3rem)]">
        <div className="c-container">
          <FitLines
            id="nosotros-title"
            lines={[
              { text: "Un fundador, un equipo,", fit: 10.803 },
              { text: "un mismo producto.", fit: 12.723, className: "c-text-green" },
            ]}
          />
          <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16">
            <div className="flex flex-col gap-8 lg:pb-4">
              <p className="c-lead">
                Diseñamos, construimos y operamos Mercav desde Santa Cruz de la Sierra. Sistemas, ciberseguridad y una plataforma que se pueda usar de verdad.
              </p>
              <Link href="/pitch" className="c-btn c-btn-ghost w-full sm:w-fit">
                Ver el pitch
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex flex-col">
              <Mervi pose="comunidad" scale={1} scaleLg={2} label="Mervi, la mascota de Mercav, con un corazón dorado" className="relative z-10 mb-[calc(var(--mervi-unit)*-4)] self-end" />
              <FounderRoll />
            </div>
          </div>
        </div>
      </section>

      {/* Vinicius */}
      <CartelSection id="vinicius" labelledBy="vinicius-title" className="scroll-mt-[var(--c-nav-h)] border-t-2 border-[var(--c-line)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-20 lg:gap-y-10">
          <div className="lg:col-start-2 lg:row-start-1">
            <FitLines
              as="h2"
              id="vinicius-title"
              lines={[
                { text: "Vinicius", fit: 33.015 },
                { text: "Salazar", fit: 32.923, className: "c-text-green" },
              ]}
              className="max-w-[30rem]"
            />
            <p className="c-label mt-5 text-[1.25rem] md:text-[1.45rem]">Fundador, CEO y encargado de Ciberseguridad</p>
          </div>

          <div className="flex flex-col gap-8 lg:sticky lg:top-[calc(var(--c-nav-h)+2rem)] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
            <TeamPhoto
              tilt="-1deg"
              pose="cool"
              side="right"
              tag={
                <>
                  <MapPin className="h-4 w-4" aria-hidden />
                  Santa Cruz, Bolivia
                </>
              }
            >
              <img
                src="/images/vinicius.jpg"
                alt="Vinicius Salazar, fundador, CEO y encargado de ciberseguridad de Mercav, en Santa Cruz de la Sierra"
                width={960}
                height={1280}
                decoding="async"
                className="h-full w-full object-cover object-[center_30%]"
              />
            </TeamPhoto>
            <ul className="mx-auto w-full max-w-sm border-t-2 border-[var(--c-line)] lg:mx-0" aria-label="Perfiles de Vinicius">
              {SOCIALS.map(({ name, icon: Icon, href }) => (
                <li key={name} className="border-b-2 border-[var(--c-line)]">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c-label flex items-center gap-3 rounded-[2px] py-3 text-[1.15rem] text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{name}</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex max-w-[65ch] flex-col gap-6 text-[1.0625rem] leading-[1.75] text-[var(--c-soft)] lg:col-start-2">
            <div className="border-b-2 border-[var(--c-line)] pb-8">
              <p lang="he" dir="rtl" className="text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-snug text-[var(--c-text)]">
                בעזרת השם, כל עכבה לטובה.
              </p>
              <p className="mt-3 text-[1rem] text-[var(--c-soft)]">Con la ayuda del Creador, cada demora es para bien.</p>
            </div>
            <p>
              Me llamo <span className="font-semibold text-[var(--c-text)]">Vinicius</span>. Tengo 19 años y vivo en Santa Cruz de la Sierra, Bolivia. Soy el fundador y CEO de Mercav: diseño la lógica de los sistemas —APIs, autenticación, datos, reglas de negocio— y trabajo ciberseguridad defensiva de alto nivel: pentesting autorizado, defensa, auditoría y respuesta post-incidente. El perfil técnico está en{" "}
              <a href="https://askforvini.pw" target="_blank" rel="noopener noreferrer" className="c-link font-semibold text-[var(--c-text)]">
                askforvini.pw
              </a>
              .
            </p>
            <p>
              Aprendí el oficio construyendo software para negocios reales, no recitando teoría. Mercav es el resultado de ese trabajo: anuncios, servicios, empleo, herramientas y ciberinteligencia en una sola plataforma, hecha desde Bolivia para quien necesita usarla de verdad.
            </p>

            <aside className="my-2 flex items-start gap-4 border-y-2 border-[var(--c-text)] py-7 md:gap-6" aria-label="Agradecimiento">
              <StarOfDavid className="mt-1 h-8 w-8 shrink-0 text-[var(--c-text)]" strokeWidth={1.75} />
              <div className="min-w-0 space-y-3">
                <p className="text-[1.25rem] font-semibold leading-snug text-[var(--c-text)] md:text-[1.4rem]">
                  Agradezco a Hashem el conocimiento con el que puedo desarrollar este sistema.
                </p>
                <p className="text-[1rem] leading-7">Mis creencias y valores piden que no quede a medias: que se entienda, esté completo y cualquiera pueda usarlo.</p>
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
      </CartelSection>

      {/* Jaider, cofundador y director de seguridad */}
      <CartelSection id="jaider" labelledBy="jaider-title" className="scroll-mt-[var(--c-nav-h)] border-t-2 border-[var(--c-line)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-x-20">
          <div className="flex flex-col gap-8">
            <div>
              <h2 id="jaider-title" className="c-display text-[clamp(3rem,1.6rem+4.4vw,5.75rem)] [text-wrap:balance]">
                Jaider Alejandro <span className="text-red-500">Pinto Ribera</span>
              </h2>
              <p className="c-label mt-5 text-[1.25rem] md:text-[1.45rem]">CSO, Cofundador y Director de Seguridad</p>
            </div>
            <div className="flex max-w-[65ch] flex-col gap-6 text-[1.0625rem] leading-[1.75] text-[var(--c-soft)]">
              <p><span className="font-semibold text-[var(--c-text)]">Jaider Alejandro Pinto Ribera</span> dirige la estrategia de seguridad de Mercav y cofundó la nueva línea de auditorías de ciberseguridad para empresas.</p>
              <p>El equipo ofrece pentesting ético autorizado, auditorías y respuesta a incidentes con alcance previamente acordado. Los datos, evidencias, alcances y contratos de cada cliente se manejan de forma confidencial bajo contrato.</p>
            </div>
            <ul className="max-w-[44rem] border-t-2 border-[var(--c-line)]" aria-label="Perfiles de Jaider">
              {JAIDER_SOCIALS.map(({ name, icon: Icon, href }) => (
                <li key={name} className="border-b-2 border-[var(--c-line)]">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="c-label flex items-center gap-3 rounded-[2px] py-3 text-[1.15rem] text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{name}</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <TeamPhoto
            tilt="1deg"
            mascot={{ src: "/team-mascots/jaider-tuxedo.png", alt: "Mascota de Jaider: su gato tuxedo de pelo largo, con pecho blanco, ojos amarillo verdosos y una mancha oscura junto a la nariz" }}
            side="right"
            tag="CSO · Dirección de Seguridad"
          >
            <ProfilePhoto src="/images/jaider.png" alt="Jaider Alejandro Pinto Ribera, CSO, cofundador y director de seguridad de Mercav" initials="JP" position="55% 35%" />
          </TeamPhoto>
        </div>
      </CartelSection>

      {/* Kerem by Mercav, próximo */}
      {/* Sebastian, cofundador */}
      <CartelSection id="sebastian" labelledBy="sebastian-title" className="scroll-mt-[var(--c-nav-h)] border-t-2 border-[var(--c-line)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-x-20">
          <div className="flex flex-col gap-8">
            <div>
              <h2 id="sebastian-title" className="c-display text-[clamp(3rem,1.6rem+4.4vw,5.75rem)] [text-wrap:balance]">
                Sebastian <span className="c-text-green">Rojas</span>
              </h2>
              <p className="c-label mt-5 text-[1.25rem] md:text-[1.45rem]">Cofundador</p>
            </div>
            <div className="flex max-w-[65ch] flex-col gap-6 text-[1.0625rem] leading-[1.75] text-[var(--c-soft)]">
              <p>
                <span className="font-semibold text-[var(--c-text)]">Sebastian Rojas Cespedes</span> es cofundador de Mercav. Se especializa en desarrollo
                frontend y en análisis de endpoints: construye las interfaces que usan las empresas y revisa cómo se comunican con el servidor, para que
                cada pantalla sea rápida, clara y segura.
              </p>
            </div>
            <ul className="max-w-[44rem] border-t-2 border-[var(--c-line)]" aria-label="Especialidades de Sebastian">
              {[
                { k: "Desarrollo frontend", v: "Interfaces web claras, accesibles y rápidas, del diseño al código que llega al navegador." },
                { k: "Análisis de endpoints", v: "Revisión de las rutas y APIs que consume una aplicación para detectar errores de diseño, datos de más y configuraciones débiles." },
              ].map((x) => (
                <li key={x.k} className="grid gap-2 border-b-2 border-[var(--c-line)] py-5 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-8">
                  <span className="c-h3">{x.k}</span>
                  <span className="text-[0.98rem] leading-relaxed text-[var(--c-soft)]">{x.v}</span>
                </li>
              ))}
            </ul>
          </div>
          <TeamPhoto
            tilt="1.2deg"
            mascot={{ src: "/team-mascots/sebastian-avocado.png", alt: "Mascota de Sebastian: una palta desarrolladora trabajando en una interfaz web" }}
            side="left"
            tag="Cofundador · Mercav"
          >
            <ProfilePhoto src="/images/sebastian-rojas.jpg" alt="Sebastian Rojas Cespedes, cofundador de Mercav" initials="SR" position="44% 30%" />
          </TeamPhoto>
        </div>
      </CartelSection>

      {/* Alejandro, CTO */}
      <CartelSection id="alejandro" labelledBy="alejandro-title" className="scroll-mt-[var(--c-nav-h)] border-t-2 border-[var(--c-line)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-20">
          <div className="flex flex-col gap-8 lg:order-2">
            <div>
              <FitLines
                as="h2"
                id="alejandro-title"
                lines={[
                  { text: "Alejandro", fit: 24.755 },
                  { text: "Mendoza", fit: 29.453, className: "c-text-magenta" },
                ]}
                className="max-w-[30rem]"
              />
              <p className="c-label mt-5 text-[1.25rem] md:text-[1.45rem]">CTO</p>
            </div>
            <div className="flex max-w-[65ch] flex-col gap-6 text-[1.0625rem] leading-[1.75] text-[var(--c-soft)]">
              <p>
                <span className="font-semibold text-[var(--c-text)]">Alejandro Ismael Mendoza Diaz</span> es el CTO de Mercav. Se especializa en
                desarrollo backend y en el reconocimiento técnico de aplicaciones web: entiende cómo está construido un servicio y qué superficie deja
                expuesta en internet, para que pueda protegerse antes de que alguien la aproveche.
              </p>
              <p>Trabaja con métodos no intrusivos y siempre sobre sistemas propios o con autorización expresa de sus dueños.</p>
            </div>
            <ul className="max-w-[44rem] border-t-2 border-[var(--c-line)]" aria-label="Especialidades de Alejandro">
              {[
                { k: "Desarrollo backend", v: "Arquitectura del lado del servidor: modelos de datos, lógica de negocio, APIs y su rendimiento." },
                { k: "Escaneo pasivo web", v: "Reconocimiento no intrusivo de la información, las tecnologías y los activos que un sitio expone públicamente, sin interactuar con sus sistemas." },
                { k: "Escaneo de endpoints", v: "Relevamiento de rutas y APIs expuestas para detectar configuraciones débiles y reducir la superficie de ataque." },
              ].map((x) => (
                <li key={x.k} className="grid gap-2 border-b-2 border-[var(--c-line)] py-5 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-8">
                  <span className="c-h3">{x.k}</span>
                  <span className="text-[0.98rem] leading-relaxed text-[var(--c-soft)]">{x.v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-8 lg:order-1 lg:sticky lg:top-[calc(var(--c-nav-h)+2rem)] lg:self-start">
            <TeamPhoto
              tilt="-1.2deg"
              mascot={{ src: "/team-mascots/alejandro-penguin.png", alt: "Mascota de Alejandro: un pingüino CTO revisando una terminal de backend" }}
              side="right"
              tag="CTO · Mercav"
            >
              <ProfilePhoto src="/images/alejandro-mendoza.jpg" alt="Alejandro Mendoza, CTO de Mercav" initials="AM" />
            </TeamPhoto>
            <ul className="mx-auto w-full max-w-sm border-t-2 border-[var(--c-line)] lg:mx-0" aria-label="Perfiles de Alejandro">
              {ALEJANDRO_SOCIALS.map(({ name, icon: Icon, href }) => (
                <li key={name} className="border-b-2 border-[var(--c-line)]">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c-label flex items-center gap-3 rounded-[2px] py-3 text-[1.15rem] text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{name}</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CartelSection>

      {/* José Alberto, CRO */}
      <CartelSection id="jose-alberto" labelledBy="jose-alberto-title" className="scroll-mt-[var(--c-nav-h)] border-t-2 border-[var(--c-line)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-20 lg:gap-y-10">
          <div className="lg:col-start-2 lg:row-start-1">
            <FitLines
              as="h2"
              id="jose-alberto-title"
              lines={[
                { text: "José", fit: 33.015 },
                { text: "Alberto", fit: 32.923, className: "c-text-green" },
              ]}
              className="max-w-[30rem]"
            />
            <p className="c-label mt-5 text-[1.25rem] md:text-[1.45rem]">Chief Revenue Officer</p>
          </div>

          <div className="flex flex-col gap-8 lg:sticky lg:top-[calc(var(--c-nav-h)+2rem)] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
            <TeamPhoto
              tilt="-1deg"
              mascot={{ src: "/team-mascots/jose-crow-cro.png", alt: "Mascota de José Alberto: un cuervo CRO mostrando crecimiento de ingresos" }}
              side="right"
              tag={
                <>
                  <MapPin className="h-4 w-4" aria-hidden />
                  Mercav · CRO
                </>
              }
            >
              <img
                src="/images/java.jpg"
                alt="José Alberto Vargas Aguilera, Chief Revenue Officer de Mercav"
                width={960}
                height={1280}
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
            </TeamPhoto>
          </div>

          <div className="flex max-w-[65ch] flex-col gap-6 text-[1.0625rem] leading-[1.75] text-[var(--c-soft)] lg:col-start-2">
            <p>
              <span className="font-semibold text-[var(--c-text)]">José Alberto Vargas Aguilera</span> es Chief Revenue Officer de Mercav. Se encarga de la estrategia comercial, crecimiento de ventas y expansión de la plataforma en Latinoamérica. Lidera las iniciativas de go-to-market y relaciones comerciales con empresas y socios estratégicos.
            </p>
            <p>
              Su experiencia en desarrollo empresarial y estrategia comercial ayuda a Mercav a crecer de manera sostenible, llevando la plataforma a nuevos mercados y asegurando que el producto resuelva las necesidades reales de las empresas de la región.
            </p>
          </div>
        </div>
      </CartelSection>

      {/* Marco, Costa Rica */}
      <CartelSection id="marco" labelledBy="marco-title" className="scroll-mt-[var(--c-nav-h)] border-t-2 border-[var(--c-line)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-x-20">
          <div className="flex flex-col gap-8">
            <div>
              <h2 id="marco-title" className="c-display text-[clamp(3rem,1.6rem+4.4vw,5.75rem)] [text-wrap:balance]">
                Marco <span className="c-text-orange">Sánchez</span>
              </h2>
              <p className="c-label mt-5 text-[1.25rem] md:text-[1.45rem]">Representante de Mercav en Costa Rica</p>
            </div>
            <div className="flex max-w-[65ch] flex-col gap-6 text-[1.0625rem] leading-[1.75] text-[var(--c-soft)]">
              <p>
                <span className="font-semibold text-[var(--c-text)]">Marco Sánchez</span> representa a Mercav en Costa Rica, donde vive. Está a cargo de
                llevar la plataforma al país: presentarla a negocios y comunidades costarricenses, cuidar la imagen de la marca y encabezar su marketing
                local, en coordinación con Vinicius Salazar.
              </p>
            </div>
            <ul className="max-w-[44rem] border-t-2 border-[var(--c-line)]" aria-label="Responsabilidades de Marco">
              {[
                { k: "Expansión en Costa Rica", v: "Abre el mercado costarricense: acerca Mercav a negocios, comercios y comunidades, y trae de vuelta lo que necesitan para usarlo." },
                { k: "Imagen de marca", v: "Cuida que Mercav se vea y se escuche en Costa Rica con la misma seriedad que en el resto de la región." },
                { k: "Marketing local", v: "Campañas, redes y presencia en el país, pensadas para el público costarricense." },
              ].map((x) => (
                <li key={x.k} className="grid gap-2 border-b-2 border-[var(--c-line)] py-5 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-8">
                  <span className="c-h3">{x.k}</span>
                  <span className="text-[0.98rem] leading-relaxed text-[var(--c-soft)]">{x.v}</span>
                </li>
              ))}
            </ul>
          </div>
          <TeamPhoto
            tilt="1.2deg"
            pose="emprendedor"
            side="left"
            tag={
              <>
                <MapPin className="h-4 w-4" aria-hidden />
                Costa Rica · Mercav
              </>
            }
          >
            <ProfilePhoto src="/images/marco-sanchez.jpg" alt="Marco Sánchez, representante de Mercav en Costa Rica" initials="MS" position="45% 30%" />
          </TeamPhoto>
        </div>
      </CartelSection>

      <CartelSection labelledBy="kerem-title">
        <div className="c-container">
          <KeremPoster titleId="kerem-title" status="Próximamente" line="Hospitalidad · Santa Cruz">
            <p>
              <span className="font-semibold text-[var(--c-text)]">Kerem</span> es el próximo proyecto: una mesa física de hospitalidad en Santa Cruz de la Sierra. El estándar es kashrut: ingredientes, cocina y servicio con el mismo rigor que aplico a un sistema.
            </p>
            <p>El criterio es el mismo en la cocina y en el código: que el estándar se pueda verificar y que el servicio se pueda usar.</p>
            <p>
              <HostLink href="/kosher" className="c-link font-semibold text-[var(--c-text)]">
                Mercav Kosher
              </HostLink>{" "}
              es la capa digital: un directorio de lugares y servicios. No emite certificación, hechsher ni psak, y no sustituye a una agencia. Informa, con fuente, para quien necesita decidir.
            </p>
          </KeremPoster>
        </div>
      </CartelSection>

      {/* El trabajo, en orden */}
      <CartelSection labelledBy="orden-title" className="!pt-4 md:!pt-8">
        <div className="c-container">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12">
            <h2 id="orden-title" className="c-h2">
              El trabajo, en orden.
            </h2>
            <p className="c-lead md:pb-2">Sistemas, ciberseguridad, fe y un producto que tiene que servir.</p>
          </div>
          <ol className="mt-14 grid border-t-2 border-[var(--c-line)] sm:grid-cols-2 md:mt-20 xl:grid-cols-4">
            {ORDER.map((m, i) => (
              <li key={m.title} className={cn("flex flex-col gap-3 border-b-2 border-[var(--c-line)] py-8 md:py-10", orderRule(i))}>
                <h3 className="c-h3">{m.time}</h3>
                <p className="text-[1.0625rem] font-semibold leading-snug">{m.title}</p>
                <p className="c-body">{m.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </CartelSection>

      {/* Cierre */}
      <section aria-labelledby="nosotros-cierre" className="c-band c-ink-yellow">
        <div className="c-container grid gap-10 pb-28 pt-20 md:pb-36 md:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16 lg:pb-44">
          <FitLines
            as="h2"
            id="nosotros-cierre"
            lines={[
              { text: "Si querés", fit: 28.485 },
              { text: "hablar.", fit: 34.41 },
            ]}
            className="max-w-[36rem]"
          />
          <div className="flex flex-col gap-6 lg:pb-3">
            <p className="max-w-[30rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              Podés usar Mercav, leer el{" "}
              <Link href="/pitch" className="c-link font-semibold text-[var(--c-text)]">
                pitch
              </Link>{" "}
              o escribirnos. El trabajo se toma en serio.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <AuthCTA tone="ink" secondary={false} className="[&>a]:w-full sm:[&>a]:w-auto" />
              <HostLink href="/contacto" className="c-btn c-btn-lg c-btn-ghost w-full sm:w-auto">
                Escribinos
              </HostLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
