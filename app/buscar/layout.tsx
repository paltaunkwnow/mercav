import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Buscá espacios, servicios, vacantes y personas en Mercav.",
  openGraph: { title: "Buscar", description: "Buscá espacios, servicios, vacantes y personas en Mercav.", url: "/buscar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
