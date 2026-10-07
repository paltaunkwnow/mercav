import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch",
  description: "Mercav en una página: el problema, el producto, el modelo de negocio y el equipo fundador.",
  openGraph: { title: "Pitch", description: "Mercav en una página: el problema, el producto, el modelo de negocio y el equipo fundador.", url: "/pitch" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
