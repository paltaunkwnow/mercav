import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryHolidays } from "../CountryHolidays";
import { FERIADO_COUNTRIES, countryBySlug, holidaysOf, todayFor } from "../data";

export const dynamicParams = false;

export function generateStaticParams() {
  return FERIADO_COUNTRIES.map((c) => ({ pais: c.slug }));
}

export function generateMetadata({ params }: { params: { pais: string } }): Metadata {
  const country = countryBySlug(params.pais);
  if (!country) return {};
  const { year } = todayFor(country);
  const days = holidaysOf(country, year).national.filter((e) => e.dayOff).length;
  return {
    title: `Feriados ${year} en ${country.name}`,
    description: `Los ${days} feriados nacionales con descanso de ${country.name} en ${year}: fecha, día de la semana, fines de semana largos y feriados regionales.`,
  };
}

export default function FeriadosPais({ params }: { params: { pais: string } }) {
  const country = countryBySlug(params.pais);
  if (!country) notFound();
  return <CountryHolidays country={country} year={todayFor(country).year} />;
}
// creado por pato dev y askforvini
