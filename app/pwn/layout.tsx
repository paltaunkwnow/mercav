import type { Metadata } from "next";
import { Suspense } from "react";
import { PwnShell } from "@/components/pwn/PwnShell";
import { APP_URL, PWN_URL } from "@/lib/seo/site";
import { LoadingState } from "@/components/pwn/EmptyState";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    absolute: "Mercav Pwn — ciberinteligencia defensiva para empresas y gobierno",
    template: "%s · Mercav Pwn",
  },
  description:
    "Consultá si un correo o un dominio aparece en filtraciones, seguí vulnerabilidades (NVD, CISA KEV) y recibí alertas con la fuente a la vista. Ciberinteligencia defensiva de Mercav.",
  keywords: ["filtraciones de datos", "brechas de seguridad", "Have I Been Pwned", "CVE", "CISA KEV", "exposición de correos", "ciberinteligencia", "ciberseguridad defensiva"],
  openGraph: { type: "website", locale: "es_419", siteName: "Mercav Pwn", url: PWN_URL, title: "Mercav Pwn — sabé dónde quedó expuesta tu empresa" },
  twitter: { card: "summary_large_image", title: "Mercav Pwn — sabé dónde quedó expuesta tu empresa" },
};

export default function PwnLayout({ children }: { children: React.ReactNode }) {
  return (
    <PwnShell>
      <Suspense fallback={<LoadingState label="Cargando…" />}>{children}</Suspense>
    </PwnShell>
  );
}
// creado por pato dev y askforvini
