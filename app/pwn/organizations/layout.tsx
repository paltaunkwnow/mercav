import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organizaciones afectadas",
  description: "Organizaciones que aparecen en filtraciones y señales públicas, con gobierno primero.",
  openGraph: { title: "Organizaciones afectadas", description: "Organizaciones que aparecen en filtraciones y señales públicas, con gobierno primero.", url: "/pwn/organizations" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
