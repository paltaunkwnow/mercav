import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos y condiciones de uso de Mercav.",
  openGraph: { title: "Términos y condiciones", description: "Términos y condiciones de uso de Mercav.", url: "/terminos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
