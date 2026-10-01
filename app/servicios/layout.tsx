import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talento digital con pago por hitos",
  description: "Contratá diseñadores, desarrolladores y especialistas en marketing con paquetes de precio claro. El pago se libera hito por hito, cuando el trabajo se entrega.",
  openGraph: { title: "Talento digital con pago por hitos", description: "Contratá diseñadores, desarrolladores y especialistas en marketing con paquetes de precio claro. El pago se libera hito por hito, cuando el trabajo se entrega.", url: "/servicios" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
