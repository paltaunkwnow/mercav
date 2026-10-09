import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vulnerabilidades (CVE)",
  description: "Buscá CVE y vulnerabilidades explotadas activamente según NVD y el catálogo KEV de CISA.",
  openGraph: { title: "Vulnerabilidades (CVE)", description: "Buscá CVE y vulnerabilidades explotadas activamente según NVD y el catálogo KEV de CISA.", url: "/pwn/vulnerabilities" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
// creado por pato dev y askforvini
