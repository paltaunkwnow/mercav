import type { KosherEventKind, KosherPlaceType, KosherStatus, KosherStockCategory } from "@prisma/client";
import type { PlaceDTO } from "@/lib/kosher/server";
import type { WeeklyHours } from "@/lib/kosher/hours";
import type { KosherServiceKey } from "@/lib/kosher/labels";

/** Lo que la ficha agrega al DTO del mapa: horario, zona horaria, precio, servicios y foto de portada. */
export type PlaceView = PlaceDTO & {
  hours: WeeklyHours | null;
  timezone: string;
  priceLevel: number | null;
  services: KosherServiceKey[];
  coverPhotoId: string | null;
};

export type PlacePhoto = { id: string; caption: string | null; width: number; height: number };

export type NearbyPlace = {
  slug: string;
  name: string;
  type: KosherPlaceType;
  status: KosherStatus;
  verified: boolean;
  distanceKm: number;
};

export type PlaceStock = { id: string; category: KosherStockCategory; note: string; authorName: string; confirmations: number; confirmedAt: string; confirmedByMe: boolean };
export type PlaceReview = { id: string; rating: number; body: string | null; author: string; avatar: string | null; mine: boolean; updatedAt: string };
export type PlaceEvent = { id: string; kind: KosherEventKind; title: string; startsAt: string; official: boolean };

/** Respuesta de GET /api/kosher/places/[slug] y datos iniciales de la página del lugar. */
export type PlaceDetail = {
  place: PlaceView;
  /** La portada primero, después por posición. */
  photos: PlacePhoto[];
  /** Hasta 6 lugares publicados cerca, del más cercano al más lejano. */
  nearby: NearbyPlace[];
  /** La sinagoga publicada más cercana, si está a 2 km o menos. */
  synagogueNearby: NearbyPlace | null;
  stock: PlaceStock[];
  reviews: PlaceReview[];
  events: PlaceEvent[];
  managedByMe: boolean;
  savedByMe: boolean;
  /** Zona horaria del lugar (la misma que place.timezone). */
  timezone: string;
  /** Slug de la guía de su ciudad (/kosher/ciudad/[slug]), si la ciudad tiene comunidad. */
  citySlug: string | null;
  /** Cuándo se armó la respuesta: el "abierto ahora" del primer render usa esta hora y no la del navegador. */
  renderedAt: string;
};
// creado por pato dev y askforvini
