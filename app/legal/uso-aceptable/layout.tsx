import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uso aceptable",
  description: "Qué se puede y qué no se puede hacer en Mercav.",
  openGraph: { title: "Uso aceptable", description: "Qué se puede y qué no se puede hacer en Mercav.", url: "/legal/uso-aceptable" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
