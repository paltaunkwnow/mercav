import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cityKey } from "@/lib/kosher/cities";
import { parseHours, placeTimezone, type WeeklyHours } from "@/lib/kosher/hours";

/**
 * Lo que el mapa y la lista necesitan de cada lugar, y nada más: la ficha completa se pide aparte (/api/kosher/places/[slug]).
 * Con miles de lugares importados, cada campo de más pesa en la primera carga.
 */
export type ExplorePlace = {
  slug: string;
  name: string;
  nameLocal: string | null;
  type: KosherPlaceType;
  status: KosherStatus;
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
  countryCode: string;
  /** La guía de ciudad (KosherCommunity.slug) a la que pertenece, si hay una. */
  citySlug: string | null;
  agencyName: string | null;
  chainName: string | null;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  hours: WeeklyHours | null;
  /** Zona del lugar, o la de su ciudad, o la del país: siempre una para calcular "abierto ahora". */
  timezone: string;
  priceLevel: number | null;
  coverPhotoId: string | null;
};

/** Lugares publicados para explorar. Con `citySlug`, solo los de esa ciudad. */
export async function listExplorePlaces(citySlug?: string | null): Promise<ExplorePlace[]> {
  const [communities, ratings] = await Promise.all([
    prisma.kosherCommunity.findMany({ select: { slug: true, city: true, countryCode: true, timezone: true } }),
    prisma.kosherReview.groupBy({ by: ["placeId"], _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const byKey = new Map(communities.map((c) => [cityKey(c.city, c.countryCode), c]));
  const only = citySlug ? communities.find((c) => c.slug === citySlug) : null;
  if (citySlug && !only) return [];

  const places = await prisma.kosherPlace.findMany({
    where: { published: true, ...(only ? { countryCode: only.countryCode } : {}) },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameLocal: true,
      type: true,
      status: true,
      lat: true,
      lng: true,
      address: true,
      city: true,
      country: true,
      countryCode: true,
      agencyName: true,
      chainName: true,
      verifiedAt: true,
      hours: true,
      timezone: true,
      priceLevel: true,
      coverPhotoId: true,
    },
  });
  const byPlace = new Map(ratings.map((r) => [r.placeId, r]));

  const out: ExplorePlace[] = [];
  for (const p of places) {
    const community = byKey.get(cityKey(p.city, p.countryCode)) ?? null;
    if (only && community?.slug !== only.slug) continue;
    const r = byPlace.get(p.id);
    const avg = r?._avg.rating;
    out.push({
      slug: p.slug,
      name: p.name,
      nameLocal: p.nameLocal,
      type: p.type,
      status: p.status,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      city: p.city,
      country: p.country,
      countryCode: p.countryCode,
      citySlug: community?.slug ?? null,
      agencyName: p.agencyName,
      chainName: p.chainName,
      verified: !!p.verifiedAt,
      rating: avg != null ? Math.round(avg * 10) / 10 : null,
      reviewCount: r?._count._all ?? 0,
      hours: parseHours(p.hours),
      timezone: p.timezone ?? (community && community.timezone !== "UTC" ? community.timezone : placeTimezone(p)),
      priceLevel: p.priceLevel,
      coverPhotoId: p.coverPhotoId,
    });
  }
  return out;
}
// creado por pato dev y askforvini
