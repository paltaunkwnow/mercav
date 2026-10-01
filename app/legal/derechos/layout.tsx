import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Derechos de privacidad",
  description: "Cómo ejercer tus derechos de acceso, rectificación y eliminación de datos en Mercav.",
  openGraph: { title: "Derechos de privacidad", description: "Cómo ejercer tus derechos de acceso, rectificación y eliminación de datos en Mercav.", url: "/legal/derechos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
