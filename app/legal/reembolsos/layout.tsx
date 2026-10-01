import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagos y reembolsos",
  description: "Cómo funcionan los pagos, cancelaciones y reembolsos en Mercav.",
  openGraph: { title: "Pagos y reembolsos", description: "Cómo funcionan los pagos, cancelaciones y reembolsos en Mercav.", url: "/legal/reembolsos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
