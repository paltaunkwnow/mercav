import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Mercav trata y protege tus datos personales.",
  openGraph: { title: "Política de privacidad", description: "Cómo Mercav trata y protege tus datos personales.", url: "/privacidad" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
