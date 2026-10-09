import { ArrowRight, Briefcase, Megaphone, MonitorPlay } from "@/components/icons";
import Link from "next/link";
import { Container, PageHero } from "@/components/site/primitives";

const PUBLISH_OPTIONS = [
  {
    id: "ads",
    href: "/anuncios/publicar",
    module: "Mercav Ads",
    title: "Un espacio publicitario",
    desc: "Valla, pantalla, letrero o vidriera. Cargás medidas, ubicación y precio mensual; las marcas reservan sobre tu calendario.",
    note: "Tu primer alquiler no paga comisión de plataforma.",
    icon: Megaphone,
  },
  {
    id: "service",
    href: "/servicios/publicar",
    module: "Mercav Services",
    title: "Un servicio profesional",
    desc: "Desarrollo, diseño, marketing o video. Definís precio, plazo de entrega y revisiones.",
    note: "Cobrás por hitos, con el pago en custodia.",
    icon: MonitorPlay,
  },
  {
    id: "job",
    href: "/empleos/publicar",
    module: "Mercav Jobs",
    title: "Una vacante de empleo",
    desc: "Cargo, requisitos, modalidad y nivel. Elegís si mostrás el rango salarial.",
    note: "Recibís las postulaciones en tu cuenta.",
    icon: Briefcase,
  },
];

export default function PublicarPage() {
  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Publicar"
        title="¿Qué querés publicar?"
        lead="Elegí el tipo de publicación. Cada una tiene su propio formulario y aparece en el catálogo de su módulo."
      />
      <section aria-label="Tipos de publicación" className="pb-14 md:pb-24">
        <Container>
          <ul className="grid gap-4 md:grid-cols-3">
            {PUBLISH_OPTIONS.map(({ id, href, module, title, desc, note, icon: Icon }) => (
              <li key={id} className="mv-panel mv-panel-interactive group relative flex flex-col overflow-hidden">
                <div className="flex flex-1 flex-col gap-4 p-6 md:p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mv-kicker">{module}</p>
                  <h2 className="mv-h3">
                    <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                      {title}
                    </Link>
                  </h2>
                  <p className="mv-body">{desc}</p>
                </div>
                <p className="flex items-center justify-between gap-3 border-t border-[var(--mv-hairline)] px-6 py-4 text-sm font-medium text-[var(--text-primary)] md:px-7">
                  {note}
                  <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            Para gestionar lo que ya publicaste, entrá a{" "}
            <Link href="/anuncios/mis-espacios" className="mv-link">mis espacios</Link>,{" "}
            <Link href="/servicios/mis-servicios" className="mv-link">mis servicios</Link> o{" "}
            <Link href="/empleos/mis-empleos" className="mv-link">mis vacantes</Link>.
          </p>
        </Container>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
