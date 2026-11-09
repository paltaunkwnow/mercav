import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes somos — Equipo y Cofundadores",
  description: "Conocé al equipo de Mercav: Vinicius Salazar, Jaider Alejandro Pinto Ribera, CSO y Director de Seguridad, y el equipo que construye la plataforma.",
  openGraph: {
    title: "Quiénes somos — Equipo y Cofundadores",
    description: "Conocé al equipo de Mercav: Vinicius Salazar, Jaider Alejandro Pinto Ribera, CSO y Director de Seguridad, y el equipo que construye la plataforma.",
    url: "/nosotros",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Equipo y Cofundadores de Mercav" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiénes somos — Equipo y Cofundadores",
    description: "Conocé al equipo de Mercav: Vinicius Salazar, Jaider Alejandro Pinto Ribera, CSO y Director de Seguridad, y el equipo que construye la plataforma.",
    images: ["/twitter-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
