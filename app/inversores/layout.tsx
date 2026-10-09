import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inversores — Tesis de Crecimiento",
  description: "La tesis de Mercav para inversores: el problema, la plataforma, diversificación de ingresos y por qué ahora.",
  openGraph: {
    title: "Inversores — Tesis de Crecimiento | Mercav",
    description: "La tesis de Mercav para inversores: el problema, la plataforma, diversificación de ingresos y por qué ahora.",
    url: "/inversores",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Inversores en Mercav" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inversores — Tesis de Crecimiento | Mercav",
    description: "La tesis de Mercav para inversores: el problema, la plataforma, diversificación de ingresos y por qué ahora.",
    images: ["/twitter-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
