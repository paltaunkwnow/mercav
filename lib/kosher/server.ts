import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { KosherPlace, KosherProfile } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shabbatWindow } from "@/lib/kosher/geo";
import { isShabbatOrYomTov } from "@/lib/kosher/zmanim";

export type KosherViewer = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  profile: KosherProfile | null;
  shabbatLocked: boolean;
};

export async function getKosherViewer(): Promise<KosherViewer | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: unknown; roles?: unknown } | undefined;
  if (!sessionUser || typeof sessionUser.id !== "string") return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      isSanctioned: true,
      roles: { select: { role: true } },
      kosherProfile: true,
    },
  });
  if (!user || user.isSanctioned) return null;

  const isAdmin = user.roles.some((r) => r.role === "ADMIN");
  const profile = user.kosherProfile;
  const shabbatLocked =
    !!profile?.shabbatMode &&
    profile.lat != null &&
    profile.lng != null &&
    (profile.timezone
      ? isShabbatOrYomTov({ city: profile.city ?? "", countryCode: profile.countryCode ?? "", lat: profile.lat, lng: profile.lng, timezone: profile.timezone })
      : shabbatWindow(profile.lat, profile.lng).active);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    isAdmin,
    isModerator: isAdmin || profile?.role === "local_moderator" || profile?.role === "agency",
    profile,
    shabbatLocked,
  };
}

export function publicAuthorName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const initial = rest.at(-1)?.[0];
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}

export const kosherError = (status: number, error: string) =>
  NextResponse.json({ success: false, error }, { status, headers: { "Cache-Control": "no-store" } });

export const unauthorized = () => kosherError(401, "Iniciá sesión con tu cuenta Mercav para participar.");
export const shabbatLocked = () =>
  kosherError(423, "Tu modo Shabat está activo. Podés leer; escribir vuelve después de Havdalá.");

export const forbidden = (message = "No tenés permiso para esta acción.") => kosherError(403, message);

export async function managesPlace(userId: string, placeId: string) {
  const row = await prisma.kosherPlaceManager.findUnique({ where: { placeId_userId: { placeId, userId } }, select: { userId: true } });
  return !!row;
}

/** Returns a response when the viewer can't write, or null when they can. */
export function writeGuard(viewer: KosherViewer | null) {
  if (!viewer) return unauthorized();
  if (viewer.shabbatLocked) return shabbatLocked();
  return null;
}

export type PlaceDTO = ReturnType<typeof toPlaceDTO>;

export function toPlaceDTO(p: KosherPlace, extra?: { rating?: number | null; reviews?: number; managed?: boolean }) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameLocal: p.nameLocal,
    type: p.type,
    lat: p.lat,
    lng: p.lng,
    address: p.address,
    city: p.city,
    country: p.country,
    countryCode: p.countryCode,
    chainName: p.chainName,
    status: p.status,
    agencyName: p.agencyName,
    foodCategory: p.foodCategory,
    notes: p.notes,
    source: p.source,
    confirmedAt: p.confirmedAt?.toISOString() ?? null,
    phone: p.phone,
    website: p.website,
    sourceUrl: p.sourceUrl,
    verifiedAt: p.verifiedAt?.toISOString() ?? null,
    certificateUrl: p.certificateUrl,
    certExpiresAt: p.certExpiresAt?.toISOString() ?? null,
    managed: extra?.managed ?? false,
    nusach: p.nusach,
    denomination: p.denomination,
    orthodoxStream: p.orthodoxStream,
    prayerTimes: (p.prayerTimes as { shacharit?: string; mincha?: string; maariv?: string } | null) ?? null,
    glatt: p.glatt,
    beitYosef: p.beitYosef,
    chalavIsrael: p.chalavIsrael,
    patIsrael: p.patIsrael,
    rating: extra?.rating ?? null,
    reviewCount: extra?.reviews ?? 0,
  };
}

export async function listPublishedPlaces() {
  const [places, ratings, managed] = await Promise.all([
    prisma.kosherPlace.findMany({ where: { published: true }, orderBy: { name: "asc" } }),
    prisma.kosherReview.groupBy({ by: ["placeId"], _avg: { rating: true }, _count: { _all: true } }),
    prisma.kosherPlaceManager.findMany({ distinct: ["placeId"], select: { placeId: true } }),
  ]);
  const byPlace = new Map(ratings.map((r) => [r.placeId, r]));
  const managedIds = new Set(managed.map((m) => m.placeId));
  return places.map((p) => {
    const r = byPlace.get(p.id);
    return toPlaceDTO(p, { rating: r?._avg.rating ?? null, reviews: r?._count._all ?? 0, managed: managedIds.has(p.id) });
  });
}
