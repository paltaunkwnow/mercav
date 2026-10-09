"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "@/components/icons";
import { Container, ButtonLink, buttonClass } from "@/components/site/primitives";

const SUGGESTIONS = [
  { href: "/anuncios", label: "Ads" },
  { href: "/servicios", label: "Services" },
  { href: "/empleos", label: "Jobs" },
  { href: "/herramientas", label: "Tools" },
  { href: "/faq", label: "Ayuda" },
];

export default function NotFound() {
  return (
    <section aria-labelledby="nf-title" className="relative flex min-h-[80svh] w-full items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container width="narrow" className="relative flex flex-col items-center text-center">
        <span className="mv-panel grid h-14 w-14 place-items-center rounded-2xl text-gold">
          <Compass className="h-6 w-6" aria-hidden />
        </span>
        <p className="mv-kicker mt-8">
          Error <span className="mv-data">404</span>
        </p>
        <h1 id="nf-title" className="mv-h1 mt-4">
          No encontramos esta página.
        </h1>
        <p className="mv-lead mx-auto mt-5">
          Puede que el enlace esté mal escrito, que la página se haya movido o que ya no exista. Revisá la dirección o seguí desde el inicio.
        </p>
        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink href="/" className="w-full sm:w-auto">
            Ir al inicio
          </ButtonLink>
          <button type="button" onClick={() => history.back()} className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Volver atrás
          </button>
        </div>
        <nav aria-label="Secciones de Mercav" className="mt-12 w-full">
          <p className="text-sm text-[var(--text-tertiary)]">O andá directo a</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="mv-chip mv-focus h-9 px-3.5 text-[13px] transition-colors hover:text-[var(--text-primary)]">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  );
}
// creado por pato dev y askforvini
