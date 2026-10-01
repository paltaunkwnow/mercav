import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Creá tu cuenta gratis de Mercav y usá todos los módulos con el mismo perfil.",
  openGraph: { title: "Crear cuenta", description: "Creá tu cuenta gratis de Mercav y usá todos los módulos con el mismo perfil.", url: "/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
