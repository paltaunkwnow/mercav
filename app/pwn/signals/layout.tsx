import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Señales de filtraciones",
  description: "Titulares y señales públicas sobre filtraciones y ataques, correlacionados con brechas conocidas.",
  openGraph: { title: "Señales de filtraciones", description: "Titulares y señales públicas sobre filtraciones y ataques, correlacionados con brechas conocidas.", url: "/pwn/signals" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
