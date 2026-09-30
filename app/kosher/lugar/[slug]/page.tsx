import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Map } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PLACE_TYPES, STATUS, isFoodPlace } from "@/lib/kosher/labels";
import { PlacePanel } from "@/components/kosher/PlacePanel";

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
      <div className="mb-4 flex items-center justify-between">
        <Link href="/kosher" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Kosher
        </Link>
        <Link href={`/kosher/mapa?lugar=${place.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-[var(--text-primary)] hover:border-gold/50">
          <Map className="h-4 w-4" aria-hidden /> Ver en el mapa
        </Link>
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-bg-secondary">
        <PlacePanel slug={place.slug} standalone />
      </div>
    </div>
  );
}
