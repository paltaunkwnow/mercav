import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inversores",
  description: "La tesis de Mercav para inversores: el problema, la plataforma y por qué ahora.",
  openGraph: { title: "Inversores", description: "La tesis de Mercav para inversores: el problema, la plataforma y por qué ahora.", url: "/inversores" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
