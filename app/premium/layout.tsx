import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mercav Premium",
  description: "Planes pagos de Mercav con más herramientas, más publicaciones y prioridad en los módulos.",
  openGraph: { title: "Mercav Premium", description: "Planes pagos de Mercav con más herramientas, más publicaciones y prioridad en los módulos.", url: "/premium" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
