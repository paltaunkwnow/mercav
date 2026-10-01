import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas sobre cuentas, pagos, publicaciones, Mercav Pwn, Mercav Kosher y seguridad.",
  openGraph: { title: "Preguntas frecuentes", description: "Respuestas sobre cuentas, pagos, publicaciones, Mercav Pwn, Mercav Kosher y seguridad.", url: "/faq" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
