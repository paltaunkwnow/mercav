import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fuentes",
  description: "Las fuentes públicas que consulta Mercav Pwn y cómo se usa cada una.",
  openGraph: { title: "Fuentes", description: "Las fuentes públicas que consulta Mercav Pwn y cómo se usa cada una.", url: "/pwn/sources" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
