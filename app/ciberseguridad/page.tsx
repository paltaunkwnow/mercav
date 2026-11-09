import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { CartelSection } from "@/components/site/cartel/primitives";

const SERVICES = [
  { title: "Pentesting autorizado", body: "Evaluamos aplicaciones y activos definidos por la empresa para identificar riesgos y entregar hallazgos priorizados." },
  { title: "Auditorías de seguridad", body: "Revisamos controles, configuraciones y prácticas técnicas para proponer mejoras claras y accionables." },
  { title: "Respuesta a incidentes", body: "Acompañamos la evaluación, documentación y coordinación de la respuesta ante incidentes de seguridad." },
  { title: "Remediación y retest", body: "Ayudamos a ordenar las correcciones y verificamos los hallazgos acordados una vez implementadas." },
];

export default function CybersecurityPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <section className="relative border-b-2 border-[var(--c-line)] pt-[calc(var(--c-nav-h)+3rem)] pb-20 md:pb-28">
        <div className="c-container grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)] md:items-center md:gap-12">
          <div className="max-w-4xl">
            <p className="c-label text-[var(--c-green-text)]">Mercav · Servicios para empresas</p>
            <h1 className="c-display mt-4 text-[clamp(3rem,1.3rem+6vw,6.5rem)] leading-[0.95]">Seguridad técnica, con autorización y responsabilidad.</h1>
            <p className="c-lead mt-6 max-w-3xl">Pentesting ético, auditorías y respuesta a incidentes coordinados con tu empresa, con alcance acordado antes de iniciar.</p>
            <Link href="/ciberseguridad/contacto" className="c-btn mt-8">Consultar por un servicio <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div role="img" aria-label="Mervi y el gato tuxedo de Jaider realizan pruebas autorizadas y revisan alertas de seguridad juntos" className="cybersecurity-mascots-sprite mx-auto w-full max-w-[27rem] drop-shadow-[0_1rem_2rem_rgba(0,0,0,0.32)]" />
        </div>
      </section>
      <CartelSection labelledBy="cyber-services">
        <div className="c-container">
          <h2 id="cyber-services" className="c-h2">Servicios de ciberseguridad</h2>
          <ul className="mt-10 grid gap-0 border-t-2 border-[var(--c-line)] md:grid-cols-2 md:gap-x-10">
            {SERVICES.map((service) => <li key={service.title} className="border-b-2 border-[var(--c-line)] py-6"><h3 className="c-h3">{service.title}</h3><p className="c-body mt-2 max-w-xl">{service.body}</p></li>)}
          </ul>
        </div>
      </CartelSection>
      <CartelSection labelledBy="cyber-process" className="c-band c-ink-green">
        <div className="c-container grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div><h2 id="cyber-process" className="c-h2">Primero, claridad y confianza.</h2><p className="c-body mt-5 max-w-xl">Conversamos sobre la necesidad general, acordamos confidencialidad, definimos el alcance y las reglas de trabajo, y recién entonces planificamos el servicio.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{["Conversación inicial", "Acuerdo de confidencialidad", "Alcance y autorización", "Trabajo e informe", "Remediación y retest"].map((step, i) => <li key={step} className="border-b-2 border-[var(--c-line-strong)] py-3"><span className="c-label mr-3">0{i + 1}</span>{step}</li>)}</ol>
        </div>
      </CartelSection>
      <CartelSection labelledBy="cyber-privacy">
        <div className="c-container max-w-4xl"><p className="c-label">Confidencialidad</p><h2 id="cyber-privacy" className="c-h2 mt-3">Tu información se trata con cuidado desde el primer contacto.</h2><p className="c-body mt-5">El alcance, los datos, las evidencias y los contratos de cada servicio son privados y se manejan bajo contrato de confidencialidad, con acceso limitado al equipo asignado. El contacto inicial no solicita dominios, direcciones IP, credenciales, archivos ni detalles técnicos del incidente.</p><p className="c-body mt-5">Lideran esta línea Vinicius Salazar, Fundador y CEO, y Jaider Alejandro Pinto Ribera, CSO, Cofundador y Director de Seguridad.</p><Link href="/nosotros#jaider" className="c-link mt-5 inline-flex font-semibold">Conocer a Jaider y al equipo <ArrowRight className="ml-2 h-4 w-4" aria-hidden /></Link></div>
      </CartelSection>
    </div>
  );
}
