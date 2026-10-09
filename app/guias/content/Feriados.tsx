import Link from "next/link";
import { FERIADO_COUNTRIES, holidaysOf, makesLongWeekend, nextDayOff, shortDateOf, todayFor, weekdayOf } from "@/app/feriados/data";
import { GuideList, GuideNote, GuideSection } from "../GuideShell";

function countryRows() {
  return FERIADO_COUNTRIES.map((country) => {
    const { year } = todayFor(country);
    const dayOff = holidaysOf(country, year).national.filter((e) => e.dayOff);
    return { country, year, dayOff: dayOff.length, longWeekends: dayOff.filter(makesLongWeekend).length, next: nextDayOff(country) };
  });
}

const list = (labels: string[]) => (labels.length < 2 ? labels.join("") : `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`);

export function FeriadosGuide() {
  const rows = countryRows();
  const year = rows[0]?.year ?? new Date().getUTCFullYear();
  const mostLong = Math.max(...rows.map((r) => r.longWeekends));
  const leaders = rows.filter((r) => r.longWeekends === mostLong).map((r) => r.country.name);
  const mostDays = Math.max(...rows.map((r) => r.dayOff));
  const fewestDays = Math.min(...rows.map((r) => r.dayOff));
  const fewest = rows.filter((r) => r.dayOff === fewestDays).map((r) => r.country.name);
  const most = rows.filter((r) => r.dayOff === mostDays).map((r) => r.country.name);

  return (
    <>
      <GuideSection title={`Los números de ${year}`}>
        <p>
          Un feriado con descanso que cae lunes o viernes se pega al fin de semana y arma uno largo, de tres días. Para un negocio son las fechas que más cambian la semana: hay quien cierra, quien abre con otro horario y quien vende más que nunca.
        </p>
        <p>
          En {year}, {list(leaders)} {leaders.length > 1 ? "son los países" : "es el país"} con más fines de semana largos: {mostLong}. Los feriados nacionales con descanso van de {fewestDays} en {list(fewest)} a {mostDays} en {list(most)}.
        </p>
      </GuideSection>

      <GuideSection title="País por país">
        <p>Feriados nacionales con descanso de {year}, cuántos caen lunes o viernes y cuál es el próximo. Tocá un país para ver la lista completa.</p>
        <div>
          <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_minmax(0,11rem)] gap-4 border-b-2 border-[var(--c-line)] pb-2 text-[0.9rem] font-semibold text-[var(--c-muted)] sm:grid">
            <span>País</span>
            <span className="text-right">Con descanso</span>
            <span className="text-right">Lunes o viernes</span>
            <span>Próximo</span>
          </div>
          <ul>
            {rows.map((r) => (
              <li key={r.country.code} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b-2 border-[var(--c-line)] py-3 text-[1rem] sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_minmax(0,11rem)] sm:items-baseline">
                <Link href={`/feriados/${r.country.slug}`} className="c-link font-semibold text-[var(--c-text)]">
                  {r.country.name}
                </Link>
                <span className="c-num text-right">
                  {r.dayOff}
                  <span className="sm:hidden"> feriados</span>
                </span>
                <span className="c-num text-[0.95rem] text-[var(--c-muted)] sm:text-right sm:text-[1rem] sm:text-[var(--c-soft)]">
                  {r.longWeekends}
                  <span className="sm:hidden"> en lunes o viernes</span>
                </span>
                <span className="text-right text-[0.95rem] text-[var(--c-muted)] sm:text-left sm:text-[1rem] sm:text-[var(--c-soft)]">
                  {r.next ? (
                    <>
                      <span className="sm:hidden">Próximo: </span>
                      {weekdayOf(r.next.date).slice(0, 3)} {shortDateOf(r.next.date)}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <GuideNote title="Lo que no entra en la cuenta">
          <p>
            Solo cuentan los feriados nacionales con descanso. Los departamentales, provinciales o estatales y las fechas cívicas sin descanso están en la página de cada país. Si el gobierno traslada un feriado o declara uno nuevo durante el año, conviene confirmarlo con el anuncio oficial.
          </p>
        </GuideNote>
      </GuideSection>

      <GuideSection title="Cómo prepararte">
        <GuideList
          items={[
            "Marcá en tu calendario los fines de semana largos del año y decidí con tiempo si abrís, cerrás o cambiás el horario.",
            "Si vas a abrir, armá los turnos antes: en muchos países el feriado trabajado se paga con recargo.",
            "Avisá a tus clientes el horario especial unos días antes, por tus redes o con una campaña de tu tarjeta de fidelización.",
            "Si vendés más en esas fechas, reforzá el stock la semana anterior.",
          ]}
        />
        <p>
          El Calendario de Mercav ya trae los feriados de tu país, con los de tu departamento o provincia, y lo podés suscribir desde Google Calendar o el calendario del celular para verlos donde ya mirás tu semana.
        </p>
      </GuideSection>
    </>
  );
}
// creado por pato dev y askforvini
