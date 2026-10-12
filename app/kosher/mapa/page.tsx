// creado por pato dev y askforvini
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { listExplorePlaces } from "@/lib/kosher/explore";
import { getKosherViewer } from "@/lib/kosher/server";
import { MapExperience } from "@/components/kosher/MapExperience";

export const metadata: Metadata = { title: "Mapa" };

export default async function KosherMapPage() {
  const [places, communities, viewer] = await Promise.all([
    listExplorePlaces(),
    prisma.kosherCommunity.findMany({ select: { slug: true, name: true, city: true, lat: true, lng: true, population: true } }),
    getKosherViewer(),
  ]);
  return (
    <Suspense>
      <MapExperience places={places} communities={communities} preference={viewer?.profile?.kashrutPreference ?? null} />
    </Suspense>
  );
}
