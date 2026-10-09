import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Todo en Mercav es gratis hasta un límite. Mercav Pro lo quita por 9,99 USD por mes, o 95,88 USD por año.",
  openGraph: { title: "Planes y precios", description: "Todo en Mercav es gratis hasta un límite. Mercav Pro lo quita por 9,99 USD por mes, o 95,88 USD por año.", url: "/precios" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
