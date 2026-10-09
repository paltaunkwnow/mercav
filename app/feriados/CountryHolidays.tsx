import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ChevronDown } from "@/components/icons";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection } from "@/components/site/cartel/primitives";
import type { CalendarEntry } from "@/lib/calendar/types";
import { SITE_URL } from "@/lib/seo/site";
import { cn } from "@/lib/utils";
import {
  FERIADO_COUNTRIES,
  daysUntil,
  holidaysOf,
  longDateOf,
  makesLongWeekend,
  monthOf,
  nextDayOff,
  shortDateOf,
  todayFor,
  weekdayOf,
  yearsFor,
  type FeriadoCountry,
} from "./data";

function byMonth(entries: CalendarEntry[]) {
  const months = new Map<string, CalendarEntry[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }
  return [...months.entries()];
}

function HolidayRow({ entry, past }: { entry: CalendarEntry; past: boolean }) {
  const longWeekend = makesLongWeekend(entry);
  return (
    <li className={cn("grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-4 sm:grid-cols-[4.5rem_minmax(0,1fr)]", past && "opacity-55")}>
      <span className="c-display c-num text-[2.4rem] leading-none sm:text-[2.8rem]">
        <time dateTime={entry.date}>{Number(entry.date.slice(8, 10))}</time>
      </span>
      <div className="min-w-0">
        <p className="text-[1.0625rem] font-semibold leading-snug sm:text-[1.125rem]">{entry.title}</p>
        <p className="mt-0.5 text-[0.95rem] text-[var(--c-soft)]">
          {weekdayOf(entry.date)} · {entry.dayOff ? "Con descanso" : "Sin descanso"}
          {longWeekend ? <span className="c-label ml-2 text-[0.95rem] text-[var(--c-yellow-text)]">Fin de semana largo</span> : null}
        </p>
        {entry.note ? <p className="mt-1 text-[0.9rem] leading-snug text-[var(--c-muted)]">{entry.note}</p> : null}
      </div>
    </li>
  );
}

/** Feriados de un país en un año: el próximo, la lista por mes, los regionales y las fechas festivas. */
export function CountryHolidays({ country, year }: { country: FeriadoCountry; year: number }) {
  const { today, year: currentYear } = todayFor(country);
  const { national, festive, regions } = holidaysOf(country, year);
  const daysOff = national.filter((e) => e.dayOff);
  const longWeekends = daysOff.filter(makesLongWeekend).length;
  const next = year === currentYear ? nextDayOff(country) : null;
  const years = yearsFor(country).filter((y) => y !== year);
  const others = FERIADO_COUNTRIES.filter((c) => c.code !== country.code);
  const yearHref = (y: number) => (y === currentYear ? `/feriados/${country.slug}` : `/feriados/${country.slug}/${y}`);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mercav", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Feriados", item: `${SITE_URL}/feriados` },
      { "@type": "ListItem", position: 3, name: `Feriados ${year} en ${country.name}`, item: `${SITE_URL}${yearHref(year)}` },
    ],
  };

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <section aria-labelledby="feriados-title" className="pt-[calc(var(--c-nav-h)+2.5rem)] md:pt-[calc(var(--c-nav-h)+4rem)]">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <div>
            <nav aria-label="Ruta" className="c-label text-[1rem] text-[var(--c-muted)]">
              <Link href="/feriados" className="c-link">
                Feriados
              </Link>{" "}
              / {country.name}
            </nav>
            <h1 id="feriados-title" className="c-display mt-5 text-[clamp(2.9rem,1.2rem+6.5vw,6rem)] leading-[0.86] [text-wrap:balance]">
              Feriados {year} <span className="c-text-yellow">en {country.name}.</span>
            </h1>
            <p className="c-lead mt-6">
              {daysOff.length} feriados nacionales con descanso
              {longWeekends ? `, ${longWeekends} con fin de semana largo` : ""}. Con su fecha, el día de la semana y los regionales, calculados con el mismo
              motor del Calendario de Mercav.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Otros años">
              {years.map((y) => (
                <li key={y}>
                  <Link href={yearHref(y)} className="c-label inline-flex rounded-full px-4 py-1.5 text-[1.05rem] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-shadow hover:shadow-[inset_0_0_0_2px_currentColor]">
                    {y}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {next ? (
            <aside aria-label="Próximo feriado" className="c-tile c-band c-ink-yellow p-7 sm:p-8" style={{ "--tilt": "0deg" } as CSSProperties}>
              <p className="c-label text-[1.05rem]">Próximo feriado en {country.name}</p>
              <p className="c-display mt-3 text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-[0.95]">{longDateOf(next.date)}</p>
              <p className="mt-2 text-[1.125rem] font-semibold">{next.title}</p>
              <p className="c-label mt-4 text-[1rem]">
                {next.date === today ? "Es hoy" : `Faltan ${daysUntil(today, next.date)} ${daysUntil(today, next.date) === 1 ? "día" : "días"}`}
                {makesLongWeekend(next) ? " · Fin de semana largo" : ""}
              </p>
            </aside>
          ) : null}
        </div>
      </section>

      <CartelSection labelledBy="feriados-nacionales" className="!pb-12 md:!pb-16">
        <div className="c-container">
          <h2 id="feriados-nacionales" className="c-h2">
            Feriados nacionales.
          </h2>
          {national.length ? (
            <div className="mt-10 border-b-2 border-[var(--c-line)] md:mt-14">
              {byMonth(national).map(([month, entries]) => (
                <section key={month} aria-label={monthOf(entries[0].date)} className="grid gap-5 border-t-2 border-[var(--c-line)] py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
                  <h3 className="c-h3">{monthOf(entries[0].date)}</h3>
                  <ul className="grid gap-5">
                    {entries.map((e) => (
                      <HolidayRow key={e.id} entry={e} past={e.date < today} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p className="c-body mt-8">Todavía no hay feriados cargados para {country.name} en {year}.</p>
          )}
        </div>
      </CartelSection>

      {regions.length ? (
        <CartelSection labelledBy="feriados-regionales" className="!pt-8 !pb-12 md:!pb-16">
          <div className="c-container">
            <h2 id="feriados-regionales" className="c-h2">
              {country.code === "BO" ? "Feriados departamentales." : "Feriados regionales."}
            </h2>
            <p className="c-body mt-4 max-w-[34rem]">Rigen solo en una parte del país, además de los nacionales.</p>
            <div className="mt-10 max-w-[48rem] border-t-2 border-[var(--c-line)]">
              {regions.map((r) => (
                <details key={r.code} className="c-faq group border-b-2 border-[var(--c-line)]">
                  <summary className="flex items-center justify-between gap-6 py-4">
                    <span className="text-[1.0625rem] font-semibold">
                      {r.name} <span className="font-normal text-[var(--c-muted)]">· {r.entries.length}</span>
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[var(--c-muted)] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                  </summary>
                  <ul className="grid gap-2 pb-5">
                    {r.entries.map((e) => (
                      <li key={e.id} className="flex items-baseline justify-between gap-4 text-[0.98rem]">
                        <span className="min-w-0">{e.title}</span>
                        <span className="c-num shrink-0 text-[var(--c-soft)]">
                          {weekdayOf(e.date)} {shortDateOf(e.date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </CartelSection>
      ) : null}

      {festive.length ? (
        <CartelSection labelledBy="feriados-festivas" className="!pt-8">
          <div className="c-container">
            <h2 id="feriados-festivas" className="c-h2">
              Otras fechas.
            </h2>
            <p className="c-body mt-4 max-w-[34rem]">Se celebran, pero no son feriado: se trabaja normal.</p>
            <ul className="mt-10 grid gap-x-10 border-t-2 border-[var(--c-line)] sm:grid-cols-2 lg:grid-cols-3">
              {festive.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--c-line)] py-3 text-[0.98rem]">
                  <span className="min-w-0">{e.title}</span>
                  <span className="c-num shrink-0 text-[var(--c-soft)]">{shortDateOf(e.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CartelSection>
      ) : null}

      <section aria-labelledby="feriados-cta" className="c-band c-ink-yellow">
        <div className="c-container grid gap-8 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <h2 id="feriados-cta" className="c-h2">
            Tenelos en tu calendario.
          </h2>
          <div className="flex flex-col gap-6 lg:pb-2">
            <p className="max-w-[30rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              Con tu cuenta de Mercav los suscribís a Google, Apple u Outlook: si un decreto mueve un feriado, te llega solo. También suma el calendario hebreo.
            </p>
            <AuthCTA tone="ink" />
          </div>
        </div>
      </section>

      <CartelSection labelledBy="feriados-otros">
        <div className="c-container">
          <h2 id="feriados-otros" className="c-h2">
            Otros países.
          </h2>
          <ul className="mt-10 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.code}>
                <Link
                  href={`/feriados/${c.slug}`}
                  className="c-label inline-flex items-center gap-2 rounded-full px-4 py-2 text-[1.1rem] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-shadow hover:shadow-[inset_0_0_0_2px_currentColor]"
                >
                  {c.name}
                  <ArrowRight className="h-4 w-4" aria-hidden />
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
