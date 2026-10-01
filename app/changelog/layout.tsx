import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Novedades",
  description: "Las últimas mejoras, funciones nuevas y correcciones de Mercav.",
  openGraph: { title: "Novedades", description: "Las últimas mejoras, funciones nuevas y correcciones de Mercav.", url: "/changelog" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
