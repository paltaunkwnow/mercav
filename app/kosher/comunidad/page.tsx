import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Briefcase, CalendarDays, HandHeart, Landmark, PlusCircle, UsersRound, UtensilsCrossed } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { listCommunityJobs } from "@/lib/kosher/jobs";
import { AGENCIES } from "@/lib/kosher/agencies";
import { CityPills, PageIntro } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Comunidad" };

export default async function KosherCommunityHub({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  const now = new Date();
  const where = city ? { city: city.city, countryCode: city.countryCode } : {};
  const [events, minyanim, hosts, chesed, jobs] = await Promise.all([
    prisma.kosherEvent.count({ where: { ...where, state: "approved", startsAt: { gte: now } } }),
    prisma.kosherMinyan.count({ where: { ...where, startsAt: { gte: new Date(now.getTime() - 30 * 60_000) } } }),
    prisma.kosherHost.count({ where: { ...where, state: "approved", active: true } }),
    prisma.kosherChesed.count({ where: { ...where, state: "approved", closed: false, expiresAt: { gte: now } } }),
    listCommunityJobs(50),
  ]);
  const q = city ? `?ciudad=${city.slug}` : "";

  const sections = [
    { href: `/kosher/comunidad/agenda${q}`, icon: CalendarDays, title: "Agenda", body: "Shiurim, tefilot especiales, jaguim y actividades. Las instituciones publican como oficiales.", count: events, unit: ["evento", "eventos"] },
    { href: `/kosher/comunidad/minian${q}`, icon: UsersRound, title: "Minián", body: "¿Te falta minián para Minjá o para decir kadish? Pedilo y la comunidad confirma hasta llegar a diez.", count: minyanim, unit: ["minián abierto", "minianim abiertos"] },
    { href: `/kosher/comunidad/shabat${q}`, icon: UtensilsCrossed, title: "Mesa de Shabat", body: "Hospitalidad para quien está de paso. Los anfitriones los aprueba un moderador de la kehilá.", count: hosts, unit: ["anfitrión", "anfitriones"] },
    { href: `/kosher/comunidad/jesed${q}`, icon: HandHeart, title: "Jésed", body: "Voluntariado, bikur jolim y donaciones. Pedidos revisados y con fecha de vencimiento.", count: chesed, unit: ["pedido activo", "pedidos activos"] },
    { href: "/kosher/comunidad/empleos", icon: Briefcase, title: "Empleos", body: "Mashgijim, docentes de hebreo, cocina kosher y trabajo en instituciones, desde Mercav Jobs.", count: jobs.length, unit: ["oferta", "ofertas"] },
    { href: "/kosher/comunidad/agencias", icon: BookOpenCheck, title: "Agencias de kashrut", body: "Quién certifica en cada país, con enlace a sus listas oficiales para confirmar un hejsher.", count: AGENCIES.length, unit: ["agencia", "agencias"] },
    { href: "/kosher/comunidades", icon: Landmark, title: "Kehilot", body: "Las ciudades con comunidad en Mercav Kosher, con su mapa y su sala de conversación.", count: cities.length, unit: ["ciudad", "ciudades"] },
    { href: "/kosher/sugerir", icon: PlusCircle, title: "Sugerir un lugar", body: "¿Falta una sinagoga, un restaurante o una mikve? Sumalo con su fuente y lo revisa un moderador.", count: null, unit: ["", ""] },
  ];

  return (
    <div>
      <PageIntro eyebrow="Kehilá" title={city ? `Comunidad en ${city.city}` : "Comunidad"}>
        <p>Todo lo que pasa en tu comunidad, más allá del mapa. Elegí la ciudad para ver su agenda, minianim y mesas de Shabat.</p>
      </PageIntro>
      {city && <CityPills cities={cities} current={city.slug} basePath="/kosher/comunidad" />}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <li key={s.title}>
            <Link
              href={s.href}
              className="group flex h-full flex-col rounded-[1.75rem] border border-border bg-bg-secondary p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[var(--shadow-gold)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold ring-1 ring-gold/20">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-lg font-semibold text-[var(--text-primary)] group-hover:text-gold">{s.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{s.body}</p>
              {s.count != null && (
                <p className="mt-4 text-xs font-medium text-techelet">
                  {s.count} {s.unit[s.count === 1 ? 0 : 1]}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
