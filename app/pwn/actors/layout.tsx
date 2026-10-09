import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autores de amenazas",
  description: "Grupos y autores mencionados en señales públicas de filtraciones y ataques.",
  openGraph: { title: "Autores de amenazas", description: "Grupos y autores mencionados en señales públicas de filtraciones y ataques.", url: "/pwn/actors" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
