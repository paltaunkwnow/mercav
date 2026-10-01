import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HerramientasClient from "../HerramientasClient";
import { TOOL_ROUTES, documentTitleFor, routeBySlug } from "../toolRoutes";

type Props = { params: { herramienta: string } };

export function generateStaticParams() {
  return TOOL_ROUTES.map((route) => ({ herramienta: route.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const route = routeBySlug(params.herramienta);
  if (!route) return { title: { absolute: "Herramienta no encontrada · Mercav Tools" } };
  const title = documentTitleFor(route);
  return {
    // absolute: the root layout's "%s | Mercav" template would repeat the brand.
    title: { absolute: title },
    description: route.description,
    alternates: { canonical: `/herramientas/${route.slug}` },
    openGraph: { title, description: route.description, url: `/herramientas/${route.slug}`, siteName: "Mercav" },
  };
}

/** Same catalog, with this tool's panel open. The client reads the slug from the URL. */
export default function HerramientaPage({ params }: Props) {
  if (!routeBySlug(params.herramienta)) notFound();
  return <HerramientasClient />;
}
// creado por pato dev y askforvini
