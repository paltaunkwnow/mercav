import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunidad",
  description: "Publicaciones, novedades y conversación de la comunidad de Mercav.",
  openGraph: { title: "Comunidad", description: "Publicaciones, novedades y conversación de la comunidad de Mercav.", url: "/feed" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
