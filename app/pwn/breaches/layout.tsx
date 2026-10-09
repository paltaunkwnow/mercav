import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Filtraciones de datos",
  description: "Catálogo de filtraciones de datos públicas con fecha, alcance y fuente verificada.",
  openGraph: { title: "Filtraciones de datos", description: "Catálogo de filtraciones de datos públicas con fecha, alcance y fuente verificada.", url: "/pwn/breaches" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
