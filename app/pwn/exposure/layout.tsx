import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultar exposición de un correo o dominio",
  description: "Revisá si un correo o un dominio aparece en filtraciones públicas conocidas, con la fuente de cada hallazgo.",
  openGraph: { title: "Consultar exposición de un correo o dominio", description: "Revisá si un correo o un dominio aparece en filtraciones públicas conocidas, con la fuente de cada hallazgo.", url: "/pwn/exposure" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
