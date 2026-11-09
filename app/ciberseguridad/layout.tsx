import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ciberseguridad para empresas",
  description: "Pentesting ético autorizado, auditorías de seguridad y respuesta a incidentes para empresas, con alcance acordado y confidencialidad contractual.",
  openGraph: { title: "Ciberseguridad para empresas — Mercav", description: "Auditorías, pentesting autorizado y respuesta a incidentes bajo contrato de confidencialidad.", url: "/ciberseguridad", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
