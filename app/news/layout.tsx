import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News — Proyectos y noticias de Mercav",
  description: "Noticias del equipo Mercav. SweetBerry obtuvo el primer lugar en Cursor AI Security Hackathon con un laboratorio de deception adaptativa y análisis SOC asistido por IA.",
  openGraph: { title: "News — Mercav", description: "Proyectos, hitos y noticias del equipo Mercav.", url: "/news", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
