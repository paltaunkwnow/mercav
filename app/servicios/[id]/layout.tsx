import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { excerpt, jsonLd } from "@/lib/seo/text";
import { canonicalFor } from "@/lib/seo/site";

async function load(id: string) {
  try {
    return await prisma.service.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        images: { select: { url: true }, take: 4 },
        provider: { select: { name: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const service = await load(params.id);
  if (!service) return { title: "Servicio", robots: { index: false } };
  const title = service.provider?.name ? `${service.title} · ${service.provider.name}` : service.title;
  const description = excerpt(service.description) || "Servicio digital con pago por hitos en Mercav.";
  const images = service.images.map((i) => i.url);
  return {
    title,
    description,
    openGraph: { title, description, url: canonicalFor(`/servicios/${service.id}`), images },
    twitter: { title, description, images },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const service = await load(params.id);
  const data = service && {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: excerpt(service.description, 500),
    image: service.images.map((i) => i.url),
    url: canonicalFor(`/servicios/${service.id}`),
    ...(service.provider?.name ? { provider: { "@type": "Person", name: service.provider.name } } : {}),
  };
  return (
    <>
      {data ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /> : null}
      {children}
    </>
  );
}
// creado por pato dev y askforvini
