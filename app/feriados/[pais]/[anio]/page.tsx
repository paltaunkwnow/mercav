import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CountryHolidays } from "../../CountryHolidays";
import { countryBySlug, holidaysOf, todayFor, yearsFor } from "../../data";

function resolve(params: { pais: string; anio: string }) {
  const country = countryBySlug(params.pais);
  const year = Number(params.anio);
  if (!country || !/^\d{4}$/.test(params.anio) || !yearsFor(country).includes(year)) return null;
  return { country, year };
}

export function generateMetadata({ params }: { params: { pais: string; anio: string } }): Metadata {
  const found = resolve(params);
  if (!found) return {};
  const { country, year } = found;
  const days = holidaysOf(country, year).national.filter((e) => e.dayOff).length;
  return {
    title: `Feriados ${year} en ${country.name}`,
    description: `Los ${days} feriados nacionales con descanso de ${country.name} en ${year}: fecha, día de la semana, fines de semana largos y feriados regionales.`,
  };
}

export default function FeriadosPaisAnio({ params }: { params: { pais: string; anio: string } }) {
  const found = resolve(params);
  if (!found) notFound();
  // El año en curso vive en /feriados/<país>: una sola URL por contenido.
  if (found.year === todayFor(found.country).year) permanentRedirect(`/feriados/${found.country.slug}`);
  return <CountryHolidays country={found.country} year={found.year} />;
}
// creado por pato dev y askforvini
