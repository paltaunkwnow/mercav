import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { excerpt, jsonLd } from "@/lib/seo/text";
import { canonicalFor } from "@/lib/seo/site";

async function load(id: string) {
  try {
    return await prisma.space.findFirst({
      where: { id, isActive: true },
      select: { id: true, title: true, description: true, city: true, country: true, pricePerMonth: true, currency: true, images: { select: { url: true }, take: 4 } },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const space = await load(params.id);
  if (!space) return { title: "Espacio publicitario", robots: { index: false } };
  const title = `${space.title} en ${space.city}`;
  const description = excerpt(space.description) || `Espacio publicitario en ${space.city}, ${space.country}. Reservá con calendario y pago seguro en Mercav.`;
  const images = space.images.map((i) => i.url);
  return {
    title,
    description,
    openGraph: { title, description, url: canonicalFor(`/anuncios/${space.id}`), images },
    twitter: { title, description, images },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const space = await load(params.id);
  const data = space && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: space.title,
    description: excerpt(space.description, 500),
    image: space.images.map((i) => i.url),
    category: "Espacio publicitario",
    url: canonicalFor(`/anuncios/${space.id}`),
    ...(space.pricePerMonth
      ? { offers: { "@type": "Offer", price: Number(space.pricePerMonth), priceCurrency: (space.currency || "USD").toUpperCase(), availability: "https://schema.org/InStock", url: canonicalFor(`/anuncios/${space.id}`) } }
      : {}),
  };
  return (
    <>
      {data ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /> : null}
      {children}
    </>
  );
}
// creado por pato dev y askforvini
