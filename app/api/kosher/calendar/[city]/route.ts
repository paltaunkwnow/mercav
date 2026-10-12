import { prisma } from "@/lib/prisma";
import { calendarFor } from "@/lib/kosher/zmanim";
import { kosherIcs } from "../feed";

export const dynamic = "force-dynamic";

/**
 * Calendario suscripto por ciudad: /api/kosher/calendar/buenos-aires.ics. Es público (no hay datos de nadie):
 * Google, Apple u Outlook lo leen sin sesión y lo vuelven a pedir cada día. Va de dos semanas atrás a un año adelante.
 */
export async function GET(_req: Request, { params }: { params: { city: string } }) {
  const slug = params.city.replace(/\.ics$/i, "").toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response("No encontrado", { status: 404 });
  const city = await prisma.kosherCommunity.findUnique({
    where: { slug },
    select: { slug: true, city: true, countryCode: true, lat: true, lng: true, timezone: true },
  });
  if (!city) return new Response("No encontrado", { status: 404 });

  const items = calendarFor(city, 380, new Date(Date.now() - 14 * 86_400_000));
  return new Response(kosherIcs(city, items), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="mercav-kosher-${slug}.ics"`,
      // Igual para todos: la CDN lo guarda unas horas y lo sirve viejo mientras lo rehace.
      "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
// creado por pato dev y askforvini
