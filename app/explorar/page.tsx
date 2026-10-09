import Link from "next/link";
import { ArrowRight, Briefcase, Megaphone, MonitorPlay, Search } from "@/components/icons";
import { Container, PageHero, ButtonLink, buttonClass } from "@/components/site/primitives";

const MODULES = [
  {
    href: "/anuncios",
    module: "Mercav Ads",
    title: "Espacios publicitarios",
    body: "Vallas, pantallas, letreros y vidrieras con calendario de reservas y precio mensual.",
    icon: Megaphone,
    publish: { href: "/anuncios/publicar", label: "Publicar un espacio" },
  },
  {
    href: "/servicios",
    module: "Mercav Services",
    title: "Talento digital",
    body: "Desarrollo, diseño, marketing y video con paquetes de precio cerrado y pago por hitos.",
    icon: MonitorPlay,
    publish: { href: "/servicios/publicar", label: "Ofrecer un servicio" },
  },
  {
    href: "/empleos",
    module: "Mercav Jobs",
    title: "Vacantes de empleo",
    body: "Puestos con modalidad, nivel y, cuando la empresa lo decide, rango salarial visible.",
    icon: Briefcase,
    publish: { href: "/empleos/publicar", label: "Publicar una vacante" },
  },
];

export default function ExplorarPage() {
  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Explorar"
        title="Todo el catálogo de Mercav, en un lugar."
        lead="Buscá en espacios, servicios, vacantes y personas a la vez, o entrá directo al módulo que necesitás."
      >
        <form action="/buscar" method="get" role="search" aria-label="Buscar en Mercav" className="mv-menu flex items-center gap-1 rounded-full p-2 md:max-w-2xl">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full px-4 focus-within:bg-[var(--mv-panel-hover)]">
            <Search className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <span className="sr-only">Buscar en Mercav</span>
            <input
              type="search"
              name="q"
              required
              placeholder="Buscar en todo Mercav…"
              enterKeyHint="search"
              className="h-full w-full min-w-0 bg-transparent text-[0.9375rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </label>
          <button type="submit" className={buttonClass("primary", "md", "shrink-0")}>
            Buscar
          </button>
        </form>
      </PageHero>

      <section aria-labelledby="explorar-modulos" className="pb-14 md:pb-24">
        <Container>
          <h2 id="explorar-modulos" className="sr-only">
            Módulos del marketplace
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {MODULES.map(({ href, module, title, body, icon: Icon, publish }) => (
              <li key={href} className="mv-panel flex flex-col overflow-hidden">
                <Link href={href} className="mv-focus group flex flex-1 flex-col gap-4 rounded-t-[1.5rem] p-6 md:p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mv-kicker">{module}</span>
                  <span className="mv-h3 flex items-center gap-2">
                    {title}
                    <ArrowRight className="h-4 w-4 text-gold transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mv-body">{body}</span>
                </Link>
                <div className="border-t border-[var(--mv-hairline)] p-3">
                  <ButtonLink href={publish.href} tone="ghost" size="sm" className="w-full justify-start">
                    {publish.label}
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
