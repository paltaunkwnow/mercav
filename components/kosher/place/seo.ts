// Título, descripción, preguntas frecuentes y datos estructurados de la ficha. Todo sale de los campos del lugar:
// nada se deduce ni se completa por fuera de la base.
import type { KosherPlaceType } from "@prisma/client";
import { formatKm } from "@/lib/kosher/geo";
import { DAY_KEYS, shabbatHours, type DayKey } from "@/lib/kosher/hours";
import { PLACE_TYPES, STATUS, STATUS_HINT, isFoodPlace, priceLabel } from "@/lib/kosher/labels";
import { KOSHER_URL, canonicalFor } from "@/lib/seo/site";
import { excerpt } from "@/lib/seo/text";
import type { PlaceDetail, PlaceView } from "@/components/kosher/place/types";
import { photoUrl, placePath } from "@/components/kosher/place/urls";

export const placeUrl = (slug: string) => canonicalFor(placePath(slug));

/** "12 de marzo de 2027". La fecha de vencimiento se guarda como día, en UTC. */
export const formatCertDate = (iso: string) => new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function placeTitle(place: PlaceView) {
  const kind = PLACE_TYPES[place.type].toLowerCase();
  const kosher = isFoodPlace(place.type) && place.status === "certified" ? " kosher" : "";
  return `${place.name}: ${kind}${kosher} en ${place.city}`;
}

export function placeDescription({ place }: PlaceDetail) {
  const parts = [`${PLACE_TYPES[place.type]} en ${place.address ? `${place.address}, ` : ""}${place.city}, ${place.country}.`];
  if (isFoodPlace(place.type)) {
    parts.push(place.status === "certified" && place.agencyName ? `Certificado por ${place.agencyName}.` : `Kashrut: ${STATUS[place.status].toLowerCase()}.`);
  }
  if (place.reviewCount > 0 && place.rating != null) {
    parts.push(`${place.rating.toFixed(1)} de 5 en ${place.reviewCount} ${place.reviewCount === 1 ? "valoración" : "valoraciones"}.`);
  }
  parts.push(place.hours ? "Horarios, cómo llegar y lugares cerca." : "Cómo llegar y lugares cerca.");
  return excerpt(parts.join(" "), 160);
}

export type PlaceFaqItem = { question: string; answer: string; link?: { href: string; label: string } };

/** "¿Es kosher?" responde con el mismo estado que muestra la insignia, y nada más. */
function kosherAnswer(place: PlaceView) {
  const sentences = [`En Mercav Kosher figura como «${STATUS[place.status]}»: ${lowerFirst(STATUS_HINT[place.status])}`];
  if (place.status === "certified") {
    if (place.agencyName) sentences.push(`Agencia: ${place.agencyName}.`);
    if (place.certExpiresAt) {
      const date = formatCertDate(place.certExpiresAt);
      sentences.push(
        new Date(place.certExpiresAt).getTime() < Date.now()
          ? `El certificado cargado venció el ${date}: confirmá con la agencia antes de ir.`
          : `El certificado cargado vence el ${date}.`,
      );
    }
  }
  sentences.push("Mercav Kosher no emite hechsher: muestra lo que está registrado en la ficha.");
  return sentences.join(" ");
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function placeFaq(detail: PlaceDetail): PlaceFaqItem[] {
  const { place, synagogueNearby } = detail;
  const items: PlaceFaqItem[] = [];

  if (isFoodPlace(place.type)) items.push({ question: `¿Es kosher ${place.name}?`, answer: kosherAnswer(place) });

  const shabbat = shabbatHours(place.hours);
  if (shabbat) {
    items.push({
      question: "¿Abre en Shabat?",
      answer:
        `Horario cargado del viernes: ${lowerFirst(shabbat.friday)}. Del sábado: ${lowerFirst(shabbat.saturday)}. ` +
        "Mercav Kosher no deduce si abre durante Shabat, porque la hora de entrada y de salida cambia en el año: confirmalo con el lugar antes de ir.",
    });
  }

  if (synagogueNearby) {
    items.push({
      question: "¿Hay una sinagoga cerca?",
      answer: `Sí: ${synagogueNearby.name} está a ${formatKm(synagogueNearby.distanceKm)} en línea recta, según la ficha publicada en Mercav Kosher.`,
      link: { href: placePath(synagogueNearby.slug), label: `Ver ${synagogueNearby.name}` },
    });
  }

  return items;
}

const SCHEMA_TYPE: Record<KosherPlaceType, string> = {
  restaurant: "Restaurant",
  bakery: "Bakery",
  butcher: "Store",
  grocery_branch: "GroceryStore",
  judaica: "Store",
  synagogue: "Synagogue",
  mikvah: "Place",
  school: "School",
  hotel: "Hotel",
  community: "CivicStructure",
  museum: "Museum",
};

/** Los tipos que son LocalBusiness en schema.org: los únicos que admiten priceRange. */
const LOCAL_BUSINESS = new Set(["Restaurant", "Bakery", "Store", "GroceryStore", "Hotel"]);

const SCHEMA_DAY: Record<DayKey, string> = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
};

/**
 * Un OpeningHoursSpecification por cada turno distinto, con todos los días que lo comparten. Un turno que pasa la
 * medianoche queda como Google lo documenta: closes antes que opens ("20:00" a "01:00"). "24:00" se escribe "23:59".
 */
function openingHoursSpecification(place: PlaceView) {
  if (!place.hours) return undefined;
  const byPeriod = new Map<string, { opens: string; closes: string; days: string[] }>();
  for (const day of DAY_KEYS) {
    for (const period of place.hours[day] ?? []) {
      const opens = period.open;
      const closes = period.close === "24:00" ? "23:59" : period.close;
      const key = `${opens}-${closes}`;
      const entry = byPeriod.get(key) ?? { opens, closes, days: [] };
      entry.days.push(`https://schema.org/${SCHEMA_DAY[day]}`);
      byPeriod.set(key, entry);
    }
  }
  return [...byPeriod.values()].map((p) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: p.days.length === 1 ? p.days[0] : p.days,
    opens: p.opens,
    closes: p.closes,
  }));
}

export function placeJsonLd(detail: PlaceDetail, faq: PlaceFaqItem[]) {
  const { place, photos } = detail;
  const url = placeUrl(place.slug);
  const type = SCHEMA_TYPE[place.type];
  const price = LOCAL_BUSINESS.has(type) ? priceLabel(place.priceLevel) : null;
  const hours = openingHoursSpecification(place);

  const entity: Record<string, unknown> = {
    "@type": type,
    "@id": `${url}#lugar`,
    name: place.name,
    ...(place.nameLocal ? { alternateName: place.nameLocal } : {}),
    description: placeDescription(detail),
    url: place.website || url,
    mainEntityOfPage: url,
    address: {
      "@type": "PostalAddress",
      ...(place.address ? { streetAddress: place.address } : {}),
      addressLocality: place.city,
      addressCountry: place.countryCode,
    },
    geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng },
    ...(place.phone ? { telephone: place.phone } : {}),
    ...(photos.length ? { image: photos.slice(0, 6).map((p) => `${KOSHER_URL}${photoUrl(p.id)}`) } : {}),
    ...(price ? { priceRange: price } : {}),
    ...(hours?.length ? { openingHoursSpecification: hours } : {}),
    ...(place.reviewCount > 0 && place.rating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(place.rating.toFixed(1)),
            reviewCount: place.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: canonicalFor("/kosher") },
      {
        "@type": "ListItem",
        position: 2,
        name: place.city,
        item: detail.citySlug ? canonicalFor(`/kosher/ciudad/${detail.citySlug}`) : `${canonicalFor("/kosher/mapa")}?q=${encodeURIComponent(place.city)}`,
      },
      { "@type": "ListItem", position: 3, name: place.name, item: url },
    ],
  };

  const graph: Record<string, unknown>[] = [entity, breadcrumb];
  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#preguntas`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
// creado por pato dev y askforvini
