import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Entrá a tu cuenta de Mercav.",
  openGraph: { title: "Iniciar sesión", description: "Entrá a tu cuenta de Mercav.", url: "/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
