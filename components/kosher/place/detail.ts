// Solo servidor: arma la ficha completa de un lugar para la página y para GET /api/kosher/places/[slug].
import type { KosherPlace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { managesPlace, publicAuthorName, toPlaceDTO, type KosherViewer } from "@/lib/kosher/server";
import { haversineKm } from "@/lib/kosher/geo";
import { parseHours, placeTimezone } from "@/lib/kosher/hours";
import { isKosherService, matchesKashrutPreference } from "@/lib/kosher/labels";
import type { NearbyPlace, PlaceDetail, PlaceView } from "@/components/kosher/place/types";

const NEARBY_RADIUS_KM = 15;
const NEARBY_LIMIT = 6;
const SYNAGOGUE_NEAR_KM = 2;
const PHOTO_LIMIT = 24;

const loadPlace = (slug: string) =>
  prisma.kosherPlace.findUnique({
    where: { slug },
    include: {
      stock: { orderBy: { confirmedAt: "desc" }, take: 20 },
      reviews: {
        orderBy: { updatedAt: "desc" },
        take: 30,
        include: { user: { select: { name: true, avatar: true } } },
      },
      events: {
        where: { state: "approved", startsAt: { gte: new Date(Date.now() - 3_600_000) } },
        orderBy: { startsAt: "asc" },
        take: 4,
        select: { id: true, title: true, kind: true, startsAt: true, official: true },
      },
      // Nunca los bytes: la imagen se sirve aparte en /api/kosher/photos/[id].
      photos: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: PHOTO_LIMIT,
        select: { id: true, caption: true, width: true, height: true },
      },
      _count: { select: { managers: true } },
    },
  });

/** Una zona IANA que el motor de fechas acepte; si no, la del país. */
function safeTimezone(place: Pick<KosherPlace, "timezone" | "countryCode">, communityTz: string | null | undefined) {
  for (const tz of [place.timezone, communityTz]) {
    if (!tz) continue;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return placeTimezone({ timezone: tz, countryCode: place.countryCode });
    } catch {
      /* zona inválida en la base: se prueba la siguiente */
    }
  }
  return placeTimezone({ timezone: null, countryCode: place.countryCode });
}

/** Lugares publicados en un cuadrado alrededor del punto; la distancia real se calcula después. */
async function placesAround(lat: number, lng: number) {
  const dLat = NEARBY_RADIUS_KM / 111;
  const dLng = NEARBY_RADIUS_KM / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.05));
  return prisma.kosherPlace.findMany({
    where: {
      published: true,
      status: { not: "closed" },
      lat: { gte: lat - dLat, lte: lat + dLat },
      lng: { gte: lng - dLng, lte: lng + dLng },
    },
    select: { id: true, slug: true, name: true, type: true, status: true, verifiedAt: true, lat: true, lng: true },
    take: 3000,
  });
}

async function nearbyFor(place: Pick<KosherPlace, "id" | "lat" | "lng" | "type">, viewer: KosherViewer | null) {
  const rows = await placesAround(place.lat, place.lng);
  const preference = viewer?.profile?.kashrutPreference ?? null;
  const sorted = rows
    .filter((p) => p.id !== place.id)
    .map(
      (p): NearbyPlace => ({
        slug: p.slug,
        name: p.name,
        type: p.type,
        status: p.status,
        verified: !!p.verifiedAt,
        distanceKm: haversineKm(place, p),
      }),
    )
    .filter((p) => p.distanceKm <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearby = sorted.filter((p) => matchesKashrutPreference(p.type, p.status, preference)).slice(0, NEARBY_LIMIT);
  const synagogue = place.type === "synagogue" ? null : sorted.find((p) => p.type === "synagogue" && p.distanceKm <= SYNAGOGUE_NEAR_KM) ?? null;
  return { nearby, synagogue };
}

/** La ficha publicada, o null. `viewer` decide lo personal: guardado, confirmaciones de stock, si la administra. */
export async function loadPlaceDetail(slug: string, viewer: KosherViewer | null): Promise<PlaceDetail | null> {
  const place = await loadPlace(slug);
  if (!place || !place.published) return null;

  const [confirmed, community, iManage, saved, ratings, around] = await Promise.all([
    viewer && place.stock.length
      ? prisma.kosherStockConfirmation.findMany({
          where: { userId: viewer.id, reportId: { in: place.stock.map((s) => s.id) } },
          select: { reportId: true },
        })
      : Promise.resolve([] as { reportId: string }[]),
    prisma.kosherCommunity.findFirst({ where: { city: place.city, countryCode: place.countryCode }, select: { timezone: true } }),
    viewer ? managesPlace(viewer.id, place.id) : Promise.resolve(false),
    viewer
      ? prisma.kosherFavorite.findUnique({ where: { userId_placeId: { userId: viewer.id, placeId: place.id } }, select: { placeId: true } })
      : Promise.resolve(null),
    // Promedio sobre todas las valoraciones, no solo las 30 que se listan.
    prisma.kosherReview.aggregate({ where: { placeId: place.id }, _avg: { rating: true }, _count: { _all: true } }),
    nearbyFor(place, viewer),
  ]);

  const confirmedIds = new Set(confirmed.map((c) => c.reportId));
  const timezone = safeTimezone(place, community?.timezone);
  const view: PlaceView = {
    ...toPlaceDTO(place, { rating: ratings._avg.rating ?? null, reviews: ratings._count._all, managed: place._count.managers > 0 }),
    hours: parseHours(place.hours),
    timezone,
    priceLevel: place.priceLevel && place.priceLevel >= 1 && place.priceLevel <= 4 ? place.priceLevel : null,
    services: place.services.filter(isKosherService),
    coverPhotoId: place.coverPhotoId,
  };
  // Portada primero; el resto mantiene el orden de posición.
  const photos = [...place.photos].sort((a, b) => Number(b.id === place.coverPhotoId) - Number(a.id === place.coverPhotoId));

  return {
    place: view,
    photos,
    nearby: around.nearby,
    synagogueNearby: around.synagogue,
    managedByMe: iManage,
    savedByMe: !!saved,
    timezone,
    renderedAt: new Date().toISOString(),
    events: place.events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() })),
    stock: place.stock.map((s) => ({
      id: s.id,
      category: s.category,
      note: s.note,
      authorName: s.authorName,
      confirmations: s.confirmations,
      confirmedAt: s.confirmedAt.toISOString(),
      confirmedByMe: confirmedIds.has(s.id),
    })),
    reviews: place.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      author: publicAuthorName(r.user.name),
      avatar: r.user.avatar,
      mine: r.userId === viewer?.id,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}
// creado por pato dev y askforvini
