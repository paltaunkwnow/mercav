import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribile al equipo de Mercav: soporte, legal, privacidad, prensa y reportes de fraude.",
  openGraph: { title: "Contacto", description: "Escribile al equipo de Mercav: soporte, legal, privacidad, prensa y reportes de fraude.", url: "/contacto" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
