import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Compará los planes Free, Professional, Empresa y Elite de Mercav y elegí el que necesita tu negocio.",
  openGraph: { title: "Planes y precios", description: "Compará los planes Free, Professional, Empresa y Elite de Mercav y elegí el que necesita tu negocio.", url: "/precios" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
