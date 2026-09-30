import { prisma } from "@/lib/prisma";
import type { KosherViewer } from "@/lib/kosher/server";

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
