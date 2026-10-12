import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight, Map } from "@/components/icons";
import { getKosherViewer } from "@/lib/kosher/server";
import { jsonLd } from "@/lib/seo/text";
import { PlacePanel } from "@/components/kosher/PlacePanel";
import { PlaceFaq } from "@/components/kosher/place/PlaceFaq";
import { loadPlaceDetail } from "@/components/kosher/place/detail";
import { placeDescription, placeFaq, placeJsonLd, placeTitle, placeUrl } from "@/components/kosher/place/seo";
import { cityPath, photoUrl } from "@/components/kosher/place/urls";
import { secondaryButton } from "@/components/kosher/ui";

/** Una sola carga por request: la comparten generateMetadata y la página. */
const getPlacePage = cache(async (slug: string) => {
  const viewer = await getKosherViewer();
  return { viewer, detail: await loadPlaceDetail(slug, viewer) };
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { detail } = await getPlacePage(params.slug);
  if (!detail) return { title: "Lugar no encontrado", robots: { index: false, follow: false } };

  const title = placeTitle(detail.place);
  const description = placeDescription(detail);
  const url = placeUrl(detail.place.slug);
  const cover = detail.photos[0];
  const images = cover ? [{ url: photoUrl(cover.id), width: cover.width, height: cover.height, alt: cover.caption ?? detail.place.name }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "es_419", siteName: "Mercav Kosher", url, title, description, ...(images ? { images } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(images ? { images: images.map((i) => i.url) } : {}) },
  };
}

export default async function KosherPlacePage({ params }: { params: { slug: string } }) {
  const { detail } = await getPlacePage(params.slug);
  if (!detail) notFound();
  const { place } = detail;
  const faq = placeFaq(detail);

  return (
    <div className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(placeJsonLd(detail, faq)) }} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Ruta de navegación" className="min-w-0">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[var(--text-secondary)]">
            <li>
              <Link href="/kosher" className="mv-focus rounded-md hover:text-[var(--text-primary)]">
                Mercav Kosher
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </li>
            <li>
              <Link href={cityPath(place.city)} className="mv-focus rounded-md hover:text-[var(--text-primary)]">
                {place.city}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </li>
            <li aria-current="page" className="min-w-0 truncate font-medium text-[var(--text-primary)]">
              {place.name}
            </li>
          </ol>
        </nav>
        <Link href={`/kosher/mapa?lugar=${place.slug}`} className={secondaryButton}>
          <Map className="h-4 w-4" aria-hidden /> Ver en el mapa
        </Link>
      </div>
      <div className="mv-panel overflow-hidden rounded-[2rem]">
        <PlacePanel slug={place.slug} initial={detail} standalone />
      </div>
      <PlaceFaq items={faq} />
    </div>
  );
}
// creado por pato dev y askforvini
