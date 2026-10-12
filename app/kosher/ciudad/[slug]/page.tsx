import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPinned, MessagesSquare, Plus } from "@/components/icons";
import { getCityGuide, type CityGuidePlace } from "@/lib/kosher/cities";
import { cityThreadKey } from "@/lib/kosher/geo";
import { openLabel, openState, todayKey } from "@/lib/kosher/hours";
import { SCOPES, STATUS_ORDER, isFoodPlace, type ScopeKey } from "@/lib/kosher/labels";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";
import { BackLink, EmptyState, PageIntro, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { CityPlaceCard, CityShabbat, CityStats } from "@/components/kosher/city/CityGuide";

type Props = { params: { slug: string } };

/** Comer y comprar, de más a menos confianza en el kashrut; el resto, por nombre (ya viene ordenado). */
function sortForScope(scope: ScopeKey, places: CityGuidePlace[]) {
  if (scope !== "eat" && scope !== "shop") return places;
  const rank = (p: CityGuidePlace) => (isFoodPlace(p.type) ? STATUS_ORDER.indexOf(p.status) : STATUS_ORDER.length);
  return [...places].sort((a, b) => rank(a) - rank(b));
}

function groupsOf(places: CityGuidePlace[]) {
  return (Object.keys(SCOPES) as ScopeKey[])
    .map((key) => ({
      key,
      label: SCOPES[key].label,
      places: sortForScope(
        key,
        places.filter((p) => (SCOPES[key].types as readonly string[]).includes(p.type)),
      ),
    }))
    .filter((g) => g.places.length > 0);
}

function describe(city: string, country: string, places: CityGuidePlace[]) {
  if (!places.length) return `Guía de Mercav Kosher para ${city}, ${country}. Todavía no hay lugares publicados.`;
  const food = places.filter((p) => isFoodPlace(p.type));
  const certified = food.filter((p) => p.status === "certified").length;
  const foodText = food.length ? ` ${food.length} para comer o comprar (${certified} con certificación registrada),` : "";
  return `${places.length} lugares kosher y de la comunidad en ${city}, ${country}:${foodText} con su estado de kashrut, horarios y el Shabat de la semana.`;
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const guide = await getCityGuide(params.slug);
  if (!guide) return { title: "Ciudad no encontrada" };
  const { city, places } = guide;
  const title = `Kosher en ${city.city}`;
  const description = describe(city.city, city.country, places);
  const previous = await parent;
  return {
    title,
    description,
    // Una ciudad sin lugares publicados se muestra, pero no se indexa: no tiene nada que buscar todavía.
    ...(places.length ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      locale: "es_419",
      siteName: "Mercav Kosher",
      url: canonicalFor(`/kosher/ciudad/${city.slug}`),
      title: `${title} · Mercav Kosher`,
      description,
      images: previous.openGraph?.images,
    },
    twitter: { card: "summary_large_image", title: `${title} · Mercav Kosher`, description, images: previous.twitter?.images },
  };
}

export default async function KosherCityPage({ params }: Props) {
  const guide = await getCityGuide(params.slug);
  if (!guide) notFound();
  const { city, places } = guide;
  const now = new Date();
  const shabbat = nextShabbat(city);
  const groups = groupsOf(places);
  const mapHref = `/kosher/mapa?ciudad=${city.slug}`;
  const url = canonicalFor(`/kosher/ciudad/${city.slug}`);

  const open = (p: CityGuidePlace) => (p.hours ? openLabel(openState(p.hours, p.timezone, now), todayKey(p.timezone, now)) : null);

  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: canonicalFor("/kosher") },
          { "@type": "ListItem", position: 2, name: "Kehilot", item: canonicalFor("/kosher/comunidades") },
          { "@type": "ListItem", position: 3, name: `Kosher en ${city.city}`, item: url },
        ],
      },
      ...(places.length
        ? [
            {
              "@type": "ItemList",
              name: `Lugares kosher y de la comunidad en ${city.city}`,
              url,
              numberOfItems: places.length,
              itemListElement: groups
                .flatMap((g) => g.places)
                .map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: canonicalFor(`/kosher/lugar/${p.slug}`) })),
            },
          ]
        : []),
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <BackLink href="/kosher/comunidades">Kehilot</BackLink>
      <PageIntro
        title={`Kosher en ${city.city}`}
        actions={
          <>
            <Link href={mapHref} className={primaryButton}>
              <MapPinned className="h-4 w-4" aria-hidden /> Ver en el mapa
            </Link>
            <Link href={`/kosher/chat?sala=${encodeURIComponent(cityThreadKey(city.city, city.countryCode))}`} className={secondaryButton}>
              <MessagesSquare className="h-4 w-4" aria-hidden /> Sala de {city.city}
            </Link>
          </>
        }
      >
        <p>
          {city.city}, {city.country}.{" "}
          {places.length
            ? `${places.length} ${places.length === 1 ? "lugar publicado" : "lugares publicados"} para comer, comprar, rezar y encontrarse con la kehilá, cada uno con la fuente de su estado.`
            : "Todavía no hay lugares publicados en esta ciudad."}
        </p>
      </PageIntro>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {places.length > 0 ? (
          <CityStats places={places} />
        ) : (
          <EmptyState title={`Todavía no hay lugares en ${city.city}`}>
            Si conocés un restaurante, una sinagoga o un comercio con productos kosher en {city.city}, sugerilo: queda pendiente hasta que lo revise un
            moderador de la kehilá.
            <span className="mt-5 flex justify-center">
              <Link href="/kosher/sugerir" className={secondaryButton}>
                <Plus className="h-4 w-4" aria-hidden /> Sugerir un lugar
              </Link>
            </span>
          </EmptyState>
        )}
        <CityShabbat shabbat={shabbat} city={city.city} timezone={city.timezone} calendarHref={`/kosher/calendario?ciudad=${city.slug}`} />
      </div>

      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`k-city-${g.key}`} className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id={`k-city-${g.key}`} className="mv-h2">
              {g.label}
            </h2>
            <p className="text-[0.9rem] text-[var(--text-secondary)]">
              {g.places.length} {g.places.length === 1 ? "lugar" : "lugares"}
              {g.key === "eat" || g.key === "shop" ? " · por nivel de kashrut" : ""}
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {g.places.map((p) => (
              <li key={p.slug}>
                <CityPlaceCard place={p} open={open(p)} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {places.length > 0 && (
        <p className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          Mercav Kosher no emite hechsher ni psak: muestra quién certifica y desde cuándo, y qué informó la comunidad. ¿Falta un lugar en {city.city}?{" "}
          <Link href="/kosher/sugerir" className="mv-focus rounded-md font-semibold text-[var(--k-accent)]">
            Sugerilo
          </Link>{" "}
          o{" "}
          <Link href={mapHref} className="mv-focus rounded-md font-semibold text-[var(--k-accent)]">
            miralo en el mapa
          </Link>
          .
        </p>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
