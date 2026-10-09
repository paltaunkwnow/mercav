import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes somos — Equipo y Cofundadores",
  description: "El equipo de Mercav en Santa Cruz de la Sierra y Costa Rica: Vinicius Salazar (CEO), Sebastian Rojas Cespedes (Cofundador), Alejandro Ismael Mendoza Diaz (CTO) y Marco Sánchez.",
  openGraph: {
    title: "Quiénes somos — Equipo y Cofundadores",
    description: "El equipo de Mercav en Santa Cruz de la Sierra y Costa Rica: Vinicius Salazar (CEO), Sebastian Rojas Cespedes (Cofundador), Alejandro Ismael Mendoza Diaz (CTO) y Marco Sánchez.",
    url: "/nosotros",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Equipo y Cofundadores de Mercav" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiénes somos — Equipo y Cofundadores",
    description: "El equipo de Mercav en Santa Cruz de la Sierra y Costa Rica: Vinicius Salazar (CEO), Sebastian Rojas Cespedes (Cofundador), Alejandro Ismael Mendoza Diaz (CTO) y Marco Sánchez.",
    images: ["/twitter-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
