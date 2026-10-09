import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informes",
  description: "Informes de exposición y ciberinteligencia defensiva de Mercav Pwn.",
  openGraph: { title: "Informes", description: "Informes de exposición y ciberinteligencia defensiva de Mercav Pwn.", url: "/pwn/reports" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
