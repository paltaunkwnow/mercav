import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { CartelSection } from "@/components/site/cartel/primitives";
import { CybersecurityContactForm } from "@/components/cybersecurity/CybersecurityContactForm";

export const metadata: Metadata = {
  title: "Consulta de ciberseguridad para empresas",
  description: "Contactá al equipo de Mercav por pentesting autorizado, auditorías de seguridad y respuesta a incidentes.",
  robots: { index: false, follow: false },
};

export default function CybersecurityContactPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <section className="border-b-2 border-[var(--c-line)] pt-[calc(var(--c-nav-h)+3rem)] pb-12 md:pb-16">
        <div className="c-container">
          <Link href="/ciberseguridad" className="c-link inline-flex min-h-11 items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" aria-hidden /> Volver a ciberseguridad</Link>
          <p className="c-label mt-8 text-[var(--c-green-text)]">Mercav · Consultas para empresas</p>
          <h1 className="c-display mt-4 max-w-4xl text-[clamp(3rem,1.3rem+6vw,6rem)] leading-[0.95]">Hablemos de la seguridad de tu empresa.</h1>
          <p className="c-lead mt-6 max-w-3xl">Contanos qué servicio necesitás y coordinaremos una primera conversación. No hace falta compartir información técnica para iniciar.</p>
        </div>
      </section>
      <CartelSection labelledBy="cyber-contact-title">
        <div className="c-container grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.7fr)] lg:gap-20">
          <div>
            <h2 id="cyber-contact-title" className="c-h2">Enviar una consulta</h2>
            <p className="c-body mt-4 mb-8">Este formulario es solo para coordinar servicios profesionales autorizados. La información del proyecto, las evidencias y los contratos se tratarán bajo confidencialidad acordada.</p>
            <CybersecurityContactForm />
          </div>
          <aside className="h-fit border-t-2 border-[var(--c-line)] pt-6 lg:border-l-2 lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="c-label text-[var(--c-green-text)]">Servicios</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--c-soft)]">
              <li>Pentesting ético con autorización y alcance definido.</li>
              <li>Auditorías técnicas de seguridad.</li>
              <li>Respuesta y acompañamiento ante incidentes.</li>
              <li>Remediación y verificación de hallazgos.</li>
            </ul>
            <p className="c-body mt-8">Lideran esta línea Vinicius Salazar y Jaider Alejandro Pinto Ribera, CSO, Cofundador y Director de Seguridad.</p>
            <Link href="/nosotros#jaider" className="c-link mt-4 inline-flex min-h-11 items-center font-semibold">Conocer al equipo <ArrowLeft className="ml-2 h-4 w-4 rotate-180" aria-hidden /></Link>
          </aside>
        </div>
      </CartelSection>
    </div>
  );
}
