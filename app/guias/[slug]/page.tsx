import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { FeriadosGuide } from "../content/Feriados";
import { FidelizacionGuide } from "../content/Fidelizacion";
import { FiltracionesGuide } from "../content/Filtraciones";
import { PlanillaGuide } from "../content/Planilla";
import { GuideShell } from "../GuideShell";
import { GUIDES, guideBySlug } from "../guides";

export const dynamicParams = false;

const CONTENT: Record<string, ComponentType> = {
  "planilla-de-sueldos-bolivia": PlanillaGuide,
  "tarjeta-de-fidelizacion": FidelizacionGuide,
  "fines-de-semana-largos": FeriadosGuide,
  "filtraciones-de-datos": FiltracionesGuide,
};

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = guideBySlug(params.slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    openGraph: { type: "article", title: guide.title, description: guide.description, modifiedTime: guide.updated },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = guideBySlug(params.slug);
  const Content = guide ? CONTENT[guide.slug] : null;
  if (!guide || !Content) notFound();
  return (
    <GuideShell guide={guide}>
      <Content />
    </GuideShell>
  );
}
// creado por pato dev y askforvini
