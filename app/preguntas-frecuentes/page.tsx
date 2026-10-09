import { AppHeader } from "@/components/app-shell/AppPage";
import { ButtonLink, CTABand } from "@/components/site/primitives";
import { PRO_ANNUAL_USD, PRO_MONTHLY_USD } from "@/lib/billing/plans";
import { INVITE_DAYS } from "@/lib/business/invites";
import { FREE_LIMITS } from "@/lib/checkPlanLimit";
import { COMMISSIONS } from "@/lib/commissions";
import { LATAM_COUNTRIES } from "@/lib/geo/latam";
import { FaqClient, type FaqSection } from "./FaqClient";

/**
 * Las preguntas frecuentes de Mercav, en un solo lugar (/faq redirige acá). Cada respuesta dice solo lo que el producto
 * hace hoy, y los números salen del código: límites del plan, precios, comisiones y días de una invitación.
 */

const usd = (n: number) => new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const L = FREE_LIMITS;
const ADS = COMMISSIONS.ADS;

const SECTIONS: FaqSection[] = [
  {
    id: "cuenta-y-planes",
    title: "Cuenta y planes",
    items: [
      {
        q: "¿Crear la cuenta cuesta algo?",
        a: `No. La cuenta es gratis, con límites: ${L.workspaces} empresa con hasta ${L.employeesPerWorkspace} trabajadores activos y ${L.loyaltyProgramsPerWorkspace} programa de fidelización; en el Mercado, ${L.spaces} espacio, ${L.services} servicio, ${L.jobsPerMonth} vacante por mes y ${L.applicationsPerMonth} postulaciones por mes. Mercav Pro saca esos límites por ${usd(PRO_MONTHLY_USD)} USD por mes o ${usd(PRO_ANNUAL_USD)} USD por año.`,
      },
      { q: "¿Cómo paso a Mercav Pro?", a: "Desde Precios elegís pago mensual o anual y pagás con tarjeta. Si renovás antes de que venza, el período nuevo empieza cuando termina el actual." },
      { q: "¿Tengo que instalar algo?", a: "No. Mercav funciona en el navegador, desde el celular o la compu." },
      { q: "¿Cómo protejo mi cuenta?", a: "Activá la verificación en dos pasos (2FA) en Perfil, en Editar perfil, sección Seguridad." },
      {
        q: "Olvidé mi contraseña o perdí el acceso. ¿Qué hago?",
        a: "La recuperación se hace con soporte, para proteger tu cuenta. Escribí a soporte@mercav.lat con tu nombre de usuario, el correo de la cuenta y la fecha aproximada en que la creaste.",
      },
      { q: "¿Cómo elimino mi cuenta?", a: "Escribí a soporte@mercav.lat desde el correo de tu cuenta y te ayudamos a darla de baja." },
      { q: "¿Qué significa la insignia de verificado?", a: "La otorga el equipo de Mercav después de revisar la cuenta." },
    ],
  },
  {
    id: "business",
    title: "Mercav Business",
    items: [
      { q: "¿Qué es Mercav Business?", a: "La caja, las planillas de sueldo y la fidelización de tu negocio en un solo lugar. Tu equipo entra con su propia cuenta y cada uno ve lo que le toca según su rol." },
      {
        q: "¿En qué países funciona?",
        a: `Los feriados y las monedas son de los ${LATAM_COUNTRIES.length} países de Latinoamérica. La planilla automática sigue por ahora las reglas de Bolivia: sale como pre-planilla para que la revise tu contador antes de pagar o declarar. Los demás países llegan de a uno.`,
      },
      { q: "¿Cómo se protegen los datos de mi equipo?", a: "El carnet y la cuenta bancaria de cada trabajador se guardan cifrados, cada persona ve solo lo que le toca según su rol, y los cambios sensibles quedan registrados." },
      { q: "¿Cómo sumo a mi equipo?", a: `Desde tu empresa generás un link de invitación y se lo pasás. Vale ${INVITE_DAYS} días. Quien entra como trabajador ve su legajo y sus boletas, y puede vender en la caja.` },
      { q: "¿La caja funciona sin internet?", a: "Sí. Si se corta la conexión seguís vendiendo: las ventas quedan guardadas en el equipo y se suben solas cuando vuelve la señal." },
      { q: "¿Puedo tener más de una empresa?", a: `Con el plan Gratis, ${L.workspaces}. Con Mercav Pro, hasta 5 con la misma cuenta.` },
    ],
  },
  {
    id: "fidelizacion",
    title: "Fidelización",
    items: [
      { q: "¿Mis clientes tienen que bajar una app o tener cuenta?", a: "No. Escanean el QR del mostrador y la tarjeta queda en el navegador del celular. Si tienen cuenta de Mercav, guardan todas sus tarjetas en Mis tarjetas." },
      { q: "¿Qué es MercavClub?", a: "Es el código de cada cuenta de Mercav para las tarjetas de fidelización. El cliente lo dicta en la caja y el negocio lo encuentra o le crea la tarjeta." },
      { q: "¿Las tarjetas van a Apple Wallet o Google Wallet?", a: "Todavía no: están en camino. Hoy funcionan en el navegador, sin bajar nada." },
    ],
  },
  {
    id: "mercado",
    title: "Publicidad, Servicios y Empleos",
    items: [
      {
        q: "¿Cuánto cobra Mercav?",
        a: `En Servicios, el ${COMMISSIONS.SERVICES.PLATFORM_FEE_PERCENTAGE} % de cada pedido. En Publicidad, el ${ADS.PLATFORM_FEE_PERCENTAGE} % de cada reserva: ${ADS.ADVERTISER_FEE_PERCENTAGE} % lo paga el anunciante y ${ADS.PLATFORM_FEE_PERCENTAGE - ADS.ADVERTISER_FEE_PERCENTAGE} % el dueño del espacio, que no paga en el primer alquiler de cada espacio. Publicar una vacante o postularse no tiene comisión.`,
      },
      { q: "¿Cómo se paga?", a: "Con tarjeta de crédito o débito. El cobro lo procesa Stripe." },
      { q: "¿Qué pasa con mi pago cuando contrato un servicio?", a: "Queda retenido en Mercav hasta que aprobás la entrega. Si hay un problema, abrís una disputa desde el pedido y la resuelve el equipo de Mercav." },
      { q: "¿Cuántas publicaciones puedo tener?", a: `Con el plan Gratis, ${L.spaces} espacio, ${L.services} servicio y ${L.jobsPerMonth} vacante por mes. Con Mercav Pro, sin límite.` },
      { q: "¿Postularme a una vacante cuesta algo?", a: `No. Con el plan Gratis podés enviar hasta ${L.applicationsPerMonth} postulaciones por mes; la empresa te puede escribir desde tu postulación.` },
      { q: "¿Qué pasa si acuerdo el pago por fuera de Mercav?", a: "Va contra los Términos y puede terminar en la suspensión de la cuenta. Además perdés la protección del pago retenido y de las disputas." },
      { q: "¿Qué hago si veo una publicación sospechosa?", a: "Escribinos desde Soporte o, si tiene que ver con un pedido, abrí un reporte en Pedidos y ventas." },
    ],
  },
  {
    id: "pwn-y-kosher",
    title: "Mercav Pwn y Mercav Kosher",
    items: [
      {
        q: "¿Qué hace Mercav Pwn?",
        a: "Es ciberinteligencia defensiva: revisa fuentes públicas, como Have I Been Pwned, NVD y CISA KEV, para avisarte si los correos o el dominio de tu empresa aparecen en filtraciones, y te muestra las vulnerabilidades que conviene parchear. Cada hallazgo cita su fuente.",
      },
      {
        q: "¿Qué es Mercav Kosher?",
        a: "Un atlas de lugares kosher, sinagogas y kehilot de la región, con el estado de cada lugar y su fuente, los horarios de Shabat por ciudad y el calendario hebreo. Mercav no emite certificaciones: muestra quién certifica.",
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((s) => s.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="w-full pb-32 md:pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <AppHeader title="Preguntas frecuentes" lead="Cuenta y planes, Business, fidelización, el Mercado, Pwn y Kosher. Buscá por palabra o recorré las categorías." />
      <FaqClient sections={SECTIONS} />
      <CTABand
        title="¿Seguís con dudas?"
        lead="Contanos qué necesitás y una persona del equipo te responde por correo."
        action={
          <ButtonLink href="/soporte" size="lg" className="w-full sm:w-auto">
            Contactar soporte
          </ButtonLink>
        }
        note={
          <>
            También podés escribir desde{" "}
            <a href="/mensajes" className="mv-link font-medium">
              Mensajes
            </a>{" "}
            si ya tenés cuenta.
          </>
        }
      />
    </div>
  );
}
// creado por pato dev y askforvini
