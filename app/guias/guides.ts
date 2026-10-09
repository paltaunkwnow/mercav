/** Las guías de mercav.lat/guias. Cada una se arma con datos reales del producto; no hay cifras inventadas. */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  /** yyyy-mm-dd */
  updated: string;
  minutes: number;
  /** La página de producto o la sección de la app con la que sigue. */
  next: { href: string; label: string };
};

export const GUIDES: Guide[] = [
  {
    slug: "planilla-de-sueldos-bolivia",
    title: "Cómo armar la planilla de sueldos en Bolivia",
    description: "Paso a paso, con un ejemplo calculado: total ganado, bono de antigüedad, horas extra, aportes a la Gestora, Aporte Nacional Solidario, RC-IVA, líquido pagable y lo que paga el empleador.",
    updated: "2026-10-09",
    minutes: 7,
    next: { href: "/planillas", label: "Ver Planillas de sueldo" },
  },
  {
    slug: "tarjeta-de-fidelizacion",
    title: "Cómo funciona una tarjeta de fidelización",
    description: "Sellos o puntos, cuántas visitas pedir, qué premio dar y cómo arranca cada uno de los rubros: una guía para que tus clientes vuelvan.",
    updated: "2026-10-09",
    minutes: 5,
    next: { href: "/fidelizacion", label: "Ver Tarjetas de fidelización" },
  },
  {
    slug: "fines-de-semana-largos",
    title: "Feriados y fines de semana largos en Latinoamérica",
    description: "Cuántos feriados con descanso tiene cada país este año, cuántos arman fin de semana largo y cuál es el próximo.",
    updated: "2026-10-09",
    minutes: 4,
    next: { href: "/feriados", label: "Ver los feriados por país" },
  },
  {
    slug: "filtraciones-de-datos",
    title: "Cómo saber si tu empresa apareció en una filtración",
    description: "Qué es una filtración, cómo revisar los correos y el dominio de tu negocio, qué hacer si aparecen y cómo seguir las vulnerabilidades que se están explotando.",
    updated: "2026-10-09",
    minutes: 5,
    next: { href: "/pwn", label: "Abrir Mercav Pwn" },
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}
// creado por pato dev y askforvini
