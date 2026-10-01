import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Aviso legal e información del titular de Mercav.",
  openGraph: { title: "Aviso legal", description: "Aviso legal e información del titular de Mercav.", url: "/aviso-legal" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
