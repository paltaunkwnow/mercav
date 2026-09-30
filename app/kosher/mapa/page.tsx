import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { listPublishedPlaces } from "@/lib/kosher/server";
import { MapExperience } from "@/components/kosher/MapExperience";

export const metadata: Metadata = { title: "Mapa" };

export default async function KosherMapPage() {
  const [places, communities] = await Promise.all([
    listPublishedPlaces(),
    prisma.kosherCommunity.findMany({ select: { slug: true, name: true, city: true, lat: true, lng: true, population: true } }),
  ]);
  return (
    <Suspense>
      <MapExperience places={places} communities={communities} />
    </Suspense>
  );
}
