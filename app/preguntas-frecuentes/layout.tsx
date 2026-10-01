import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas rápidas sobre cómo usar Mercav.",
  openGraph: { title: "Preguntas frecuentes", description: "Respuestas rápidas sobre cómo usar Mercav.", url: "/preguntas-frecuentes" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
