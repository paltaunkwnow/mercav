import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch de Inversión",
  description: "Mercav en una página: el problema, el producto, el modelo de negocio y el equipo fundador.",
  openGraph: {
    title: "Pitch de Inversión — Mercav",
    description: "Mercav en una página: el problema, el producto, el modelo de negocio y el equipo fundador.",
    url: "/pitch",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Mercav Pitch" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch de Inversión — Mercav",
    description: "Mercav en una página: el problema, el producto, el modelo de negocio y el equipo fundador.",
    images: ["/twitter-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
