import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Map } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { PLACE_TYPES, STATUS, isFoodPlace } from "@/lib/kosher/labels";
import { PlacePanel } from "@/components/kosher/PlacePanel";
import { BackLink, secondaryButton } from "@/components/kosher/ui";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug } });
  if (!place?.published) return { title: "Lugar no encontrado" };
  return {
    title: place.name,
    description: `${PLACE_TYPES[place.type]} en ${place.city}, ${place.country}.${isFoodPlace(place.type) ? ` Estado: ${STATUS[place.status]}.` : ""}`,
  };
}

export default async function KosherPlacePage({ params }: { params: { slug: string } }) {
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug }, select: { slug: true, published: true } });
  if (!place?.published) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="[&>a]:mb-0">
          <BackLink href="/kosher/mapa">Mapa</BackLink>
        </div>
        <Link href={`/kosher/mapa?lugar=${place.slug}`} className={secondaryButton}>
          <Map className="h-4 w-4" aria-hidden /> Ver en el mapa
        </Link>
      </div>
      <div className="mv-panel overflow-hidden rounded-[2rem]">
        <PlacePanel slug={place.slug} standalone />
      </div>
    </div>
  );
}
