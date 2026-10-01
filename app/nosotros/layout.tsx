import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quién soy",
  description: "Vinicius, 19 años, fundador de Mercav en Santa Cruz de la Sierra. Sistemas, ciberseguridad defensiva y una plataforma que se pueda usar de verdad.",
  openGraph: { title: "Quién soy", description: "Vinicius, 19 años, fundador de Mercav en Santa Cruz de la Sierra. Sistemas, ciberseguridad defensiva y una plataforma que se pueda usar de verdad.", url: "/nosotros" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
