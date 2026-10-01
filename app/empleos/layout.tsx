import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Empleos y vacantes en Latinoamérica",
  description: "Encontrá trabajo o publicá vacantes y gestioná postulaciones desde tu panel de Mercav.",
  openGraph: { title: "Empleos y vacantes en Latinoamérica", description: "Encontrá trabajo o publicá vacantes y gestioná postulaciones desde tu panel de Mercav.", url: "/empleos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
