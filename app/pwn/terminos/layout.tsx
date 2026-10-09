import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Términos de uso de Mercav Pwn, el módulo de ciberinteligencia defensiva.",
  openGraph: { title: "Términos de uso", description: "Términos de uso de Mercav Pwn, el módulo de ciberinteligencia defensiva.", url: "/pwn/terminos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
