import { prisma } from "@/lib/prisma";
import { cityThreadKey, placeThreadKey } from "@/lib/kosher/geo";

export type ThreadInfo = { key: string; kind: "city" | "place"; title: string; subtitle: string };

export async function listCityThreads(): Promise<ThreadInfo[]> {
  const [communities, cities] = await Promise.all([
    prisma.kosherCommunity.findMany({ orderBy: { name: "asc" } }),
    prisma.kosherPlace.findMany({
      where: { published: true },
      distinct: ["city", "countryCode"],
      select: { city: true, country: true, countryCode: true },
    }),
  ]);
  const map = new Map<string, ThreadInfo>();
  for (const c of communities) {
    const key = cityThreadKey(c.city, c.countryCode);
    map.set(key, { key, kind: "city", title: c.city, subtitle: c.country });
  }
  for (const c of cities) {
    const key = cityThreadKey(c.city, c.countryCode);
    if (!map.has(key)) map.set(key, { key, kind: "city", title: c.city, subtitle: c.country });
  }
  return [...map.values()];
}

export async function resolveThread(key: string): Promise<ThreadInfo | null> {
  if (key.startsWith("place:")) {
    const place = await prisma.kosherPlace.findUnique({
      where: { slug: key.slice("place:".length) },
      select: { slug: true, name: true, city: true, published: true },
    });
    if (!place?.published) return null;
    return { key: placeThreadKey(place.slug), kind: "place", title: place.name, subtitle: place.city };
  }
  if (key.startsWith("city:")) {
    const cities = await listCityThreads();
    return cities.find((c) => c.key === key) ?? null;
  }
  return null;
}
