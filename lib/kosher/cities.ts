import { unstable_cache } from "next/cache";
import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { streetAddress } from "@/lib/kosher/labels";
import type { KosherViewer } from "@/lib/kosher/server";
import { haversineKm, slugify } from "@/lib/kosher/geo";
import { parseHours, placeTimezone, type WeeklyHours } from "@/lib/kosher/hours";

export type KosherCity = {
  slug: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
};

const DEFAULT_CITY = "buenos-aires";

export async function listCities(): Promise<KosherCity[]> {
  return prisma.kosherCommunity.findMany({
    orderBy: [{ countryCode: "asc" }, { city: "asc" }],
    select: { slug: true, name: true, city: true, country: true, countryCode: true, lat: true, lng: true, timezone: true },
  });
}

/** The ?ciudad= slug if valid, else the member's city, else Buenos Aires. */
export function pickCity(cities: KosherCity[], slug: string | undefined, viewer: KosherViewer | null) {
  return (
    cities.find((c) => c.slug === slug) ??
    cities.find((c) => c.city === viewer?.profile?.city && c.countryCode === viewer?.profile?.countryCode) ??
    cities.find((c) => c.slug === DEFAULT_CITY) ??
    cities[0]
  );
}

export async function cityBySlug(slug: string) {
  return prisma.kosherCommunity.findUnique({
    where: { slug },
    select: { slug: true, city: true, country: true, countryCode: true, timezone: true },
  });
}

/** Un lugar pertenece a una ciudad por city + countryCode. Se compara sin tildes ni mayúsculas: "Sao Paulo" es São Paulo. */
export const cityKey = (city: string, countryCode: string) => `${slugify(city)}:${countryCode.toUpperCase()}`;

/** Lugares publicados por ciudad, con la clave de cityKey. */
export async function placeCountsByCity() {
  const rows = await prisma.kosherPlace.groupBy({ by: ["city", "countryCode"], where: { published: true }, _count: { _all: true } });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = cityKey(r.city, r.countryCode);
    counts.set(key, (counts.get(key) ?? 0) + r._count._all);
  }
  return counts;
}

/** Las ciudades que tienen al menos un lugar publicado, con cuántos. Son las que tienen guía y van al sitemap. */
export async function listCitiesWithPlaces() {
  const [cities, counts] = await Promise.all([listCities(), placeCountsByCity()]);
  return cities.map((c) => ({ ...c, places: counts.get(cityKey(c.city, c.countryCode)) ?? 0 })).filter((c) => c.places > 0);
}

/** La ciudad más cercana a un punto, si queda a menos de `maxKm`. */
export function nearestCity<T extends { lat: number; lng: number }>(cities: T[], point: { lat: number; lng: number }, maxKm = 100) {
  let best: { city: T; km: number } | null = null;
  for (const city of cities) {
    const km = haversineKm(point, city);
    if (km <= maxKm && (!best || km < best.km)) best = { city, km };
  }
  return best;
}

export type CityGuidePlace = {
  slug: string;
  name: string;
  type: KosherPlaceType;
  status: KosherStatus;
  address: string;
  agencyName: string | null;
  verified: boolean;
  priceLevel: number | null;
  hours: WeeklyHours | null;
  timezone: string;
};

export type CityGuide = {
  city: KosherCity & { population: number | null; populationYear: number | null; populationSource: string | null };
  places: CityGuidePlace[];
};

/**
 * La guía de una ciudad: la comunidad y sus lugares publicados. Se cachea cinco minutos (sin fechas, para que el
 * caché no las convierta en texto); el "abierto ahora" se calcula al mostrar, nunca se guarda.
 */
export const getCityGuide = unstable_cache(
  async (slug: string): Promise<CityGuide | null> => {
    const city = await prisma.kosherCommunity.findUnique({
      where: { slug },
      select: {
        slug: true,
        name: true,
        city: true,
        country: true,
        countryCode: true,
        lat: true,
        lng: true,
        timezone: true,
        population: true,
        populationYear: true,
        populationSource: true,
      },
    });
    if (!city) return null;
    const rows = await prisma.kosherPlace.findMany({
      where: { published: true, countryCode: city.countryCode },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        type: true,
        status: true,
        address: true,
        city: true,
        agencyName: true,
        verifiedAt: true,
        priceLevel: true,
        hours: true,
        timezone: true,
      },
    });
    const key = cityKey(city.city, city.countryCode);
    const places = rows
      .filter((p) => cityKey(p.city, city.countryCode) === key)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        type: p.type,
        status: p.status,
        // Vacía si solo repite la ciudad (lugares importados sin calle).
        address: streetAddress(p) ?? "",
        agencyName: p.agencyName,
        verified: !!p.verifiedAt,
        priceLevel: p.priceLevel,
        hours: parseHours(p.hours),
        timezone: p.timezone ?? (city.timezone !== "UTC" ? city.timezone : placeTimezone({ countryCode: city.countryCode })),
      }));
    return { city, places };
  },
  ["kosher-city-guide"],
  { revalidate: 300, tags: ["kosher-places"] },
);
// creado por pato dev y askforvini
