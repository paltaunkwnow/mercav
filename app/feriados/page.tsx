import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { CartelSection } from "@/components/site/cartel/primitives";
import { FERIADO_COUNTRIES, holidaysOf, nextDayOff, shortDateOf, todayFor } from "./data";

export const metadata: Metadata = {
  title: "Feriados en Latinoamérica",
  description: "Los feriados de los 20 países de Latinoamérica: el próximo de cada país, cuántos días de descanso tiene el año y la lista completa con los regionales.",
};

export default function Feriados() {
  const rows = FERIADO_COUNTRIES.map((country) => {
    const { year } = todayFor(country);
    return {
      country,
      year,
      next: nextDayOff(country),
      daysOff: holidaysOf(country, year).national.filter((e) => e.dayOff).length,
    };
  });
  const year = rows[0]?.year ?? new Date().getUTCFullYear();

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <section aria-labelledby="feriados-title" className="pt-[calc(var(--c-nav-h)+2.5rem)] md:pt-[calc(var(--c-nav-h)+4rem)]">
        <div className="c-container">
          <h1 id="feriados-title" className="c-display text-[clamp(2.9rem,1.2rem+6.5vw,6rem)] leading-[0.86] [text-wrap:balance]">
            Feriados {year} <span className="c-text-yellow">en Latinoamérica.</span>
          </h1>
          <p className="c-lead mt-6">
            Elegí tu país: el próximo feriado, los días de descanso del año, los fines de semana largos y los feriados regionales. Son los mismos datos del
            Calendario de Mercav.
          </p>
        </div>
      </section>

      <CartelSection labelledBy="feriados-paises" className="!pt-12 md:!pt-16">
        <div className="c-container">
          <h2 id="feriados-paises" className="sr-only">
            Países
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ country, next, daysOff }) => (
              <li key={country.code}>
                <Link
                  href={`/feriados/${country.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-[1.25rem] p-5 shadow-[inset_0_0_0_2px_var(--c-line)] transition-shadow duration-200 hover:shadow-[inset_0_0_0_2px_var(--c-yellow)] sm:p-6"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="c-h3">{country.name}</span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-[var(--c-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--c-yellow-text)]" aria-hidden />
                  </span>
                  {next ? (
                    <span className="text-[0.98rem] leading-snug">
                      <span className="text-[var(--c-soft)]">Próximo: </span>
                      <span className="font-semibold">{next.title}</span>
                      <span className="c-num text-[var(--c-soft)]"> · {shortDateOf(next.date)}</span>
                    </span>
                  ) : null}
                  <span className="c-label mt-auto text-[0.95rem] text-[var(--c-muted)]">{daysOff} feriados con descanso</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>
    </div>
  );
}
// creado por pato dev y askforvini
