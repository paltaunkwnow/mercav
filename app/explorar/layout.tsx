import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar",
  description: "Explorá espacios publicitarios, servicios y vacantes publicados en Mercav.",
  openGraph: { title: "Explorar", description: "Explorá espacios publicitarios, servicios y vacantes publicados en Mercav.", url: "/explorar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
