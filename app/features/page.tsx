import Link from "next/link";
import {
  Package,
  Users,
  FileSpreadsheet,
  Megaphone,
  Briefcase,
  Zap,
  BarChart3,
  ShieldCheck,
  Heart,
  ArrowLeft,
  ArrowRight,
} from "@/components/icons";
import { Mervi } from "@/components/mervi/Mervi";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection } from "@/components/site/cartel/primitives";

/**
 * Página: Todos los módulos de Mercav (catálogo visual simple)
 */

const MODULES = [
  { icon: Package, title: "Inventario", desc: "Control de stock en tiempo real" },
  { icon: Users, title: "Trabajadores", desc: "Tu equipo organizado" },
  { icon: FileSpreadsheet, title: "Nómina", desc: "Planillas automáticas" },
  { icon: Heart, title: "Fidelización", desc: "Programa de clientes leales. Cards, puntos, recompensas." },
  { icon: Megaphone, title: "Publicidad", desc: "Alquila vallas, pantallas y vidrieras por fechas." },
  { icon: Briefcase, title: "Servicios", desc: "Vende talento digital. Paquetes, proyectos, reseñas." },
  { icon: Zap, title: "Empleos", desc: "Publica vacantes. Postulaciones, seguimiento, contrata." },
  { icon: BarChart3, title: "Herramientas", desc: "ROI, contratos, SEO, paletas, prompts, calculadoras." },
  { icon: ShieldCheck, title: "Ciberseguridad", desc: "Monitorea breaches. Alertas, reportes, score de seguridad." },
];

export default function FeaturesPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      {/* Header */}
      <section className="relative pt-[calc(var(--c-nav-h)+3rem)] pb-16">
        <div className="c-container">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--c-yellow)] hover:text-[var(--c-yellow-text)] transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" aria-hidden />
            Volver
          </Link>

          <h1 className="c-display text-[clamp(2.8rem,1rem+8vw,7rem)] leading-[0.88] [text-wrap:balance] mb-6">
            Todo lo que es<span className="c-yellow"> Mercav.</span>
          </h1>
          <p className="c-lead max-w-2xl text-lg text-[var(--c-soft)]">
            Una sola cuenta para todo tu negocio en Latinoamérica.
          </p>
        </div>
      </section>

      {/* Grid de módulos - simple y limpio */}
      <section className="py-20">
        <div className="c-container">
          <div className="grid gap-6 md:grid-cols-3">
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={i}
                  className="group rounded-[1.5rem] border border-[var(--c-line)] bg-[var(--c-ground)] p-6 transition-all duration-300 hover:border-[var(--c-yellow)] hover:bg-[var(--c-raised)]"
                >
                  <div className="mb-4 inline-block rounded-[1rem] bg-[var(--c-raised)] border border-[var(--c-line)] p-3 group-hover:border-[var(--c-yellow)] transition-colors">
                    <Icon className="h-5 w-5 text-[var(--c-yellow)] mv-icon" aria-hidden />
                  </div>

                  <h3 className="c-display text-[1.3rem] mb-2">{mod.title}</h3>
                  <p className="text-sm text-[var(--c-soft)]">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Una sola cuenta */}
      <CartelSection className="!pb-20">
        <div className="c-container">
          <h2 className="c-h2 text-center mb-12">
            Una sola cuenta<span className="c-yellow">.</span>
          </h2>
          <p className="text-lg text-[var(--c-soft)] text-center max-w-2xl mx-auto">
            Todos los módulos funcionan juntos. Tu historial, tus datos, tu negocio. En un solo lugar.
          </p>
        </div>
      </CartelSection>

      {/* Cobertura regional - simple */}
      <section className="py-20">
        <div className="c-container text-center">
          <h2 className="c-h2 mb-8">
            Disponible en<span className="c-yellow"> toda Latinoamérica.</span>
          </h2>

          <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
            {[
              "Bolivia",
              "Argentina",
              "Brasil",
              "Chile",
              "Colombia",
              "México",
              "Perú",
              "Uruguay",
              "Costa Rica (próximamente)",
            ].map((country, i) => (
              <div
                key={i}
                className="rounded-[1rem] border border-[var(--c-line)] bg-[var(--c-ground)] p-4 hover:border-[var(--c-yellow)] transition-colors"
              >
                <p className="text-sm font-semibold text-[var(--c-text)]">{country}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <div className="c-container">
          <div className="relative overflow-hidden rounded-[2rem] bg-[var(--c-ground)] px-8 py-16 md:px-16 text-center border border-[var(--c-line)] group hover:border-[var(--c-yellow)] transition-all duration-500">
            {/* Subtle liquid glass effect on hover */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,175,55,0.04)] via-transparent to-[rgba(255,255,255,0.01)]" />
            </div>

            {/* Ambient glow - very subtle */}
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-[var(--c-yellow)] blur-[180px] opacity-2 -translate-y-1/2 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="c-display text-[2.2rem] mb-6">
                Comienza ahora<span className="c-yellow">.</span>
              </h2>
              <AuthCTA className="items-center sm:justify-center" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
