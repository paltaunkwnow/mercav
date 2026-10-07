import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "El equipo de Mercav en Santa Cruz de la Sierra: Vinicius Salazar (CEO), Sebastian Rojas Cespedes (CTO) y Alejandro Ismael Mendoza Diaz (CTO).",
  openGraph: { title: "Quiénes somos", description: "El equipo de Mercav en Santa Cruz de la Sierra: Vinicius Salazar (CEO), Sebastian Rojas Cespedes (CTO) y Alejandro Ismael Mendoza Diaz (CTO).", url: "/nosotros" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
