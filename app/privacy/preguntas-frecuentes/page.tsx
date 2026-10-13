import { FaqList, JsonLd, OrderCTA, PageIntro } from "@/components/privacy/blocks";
import { privacyMetadata } from "@/components/privacy/site";
import { DELIVERY, INSTALL_SERVICE, PAYMENT, PHONE_BUNDLE, productBySlug } from "@/lib/privacy/catalog";

export const metadata = privacyMetadata({
  path: "/preguntas-frecuentes",
  title: "Preguntas frecuentes",
  description:
    "Frase semilla, verificación del sistema con Auditor, PIN de borrado, Mullvad VPN, Session, soporte del Pixel 6, pagos y envíos: las preguntas de siempre sobre Mercav Privacy.",
});

const [weeksMin, weeksMax] = DELIVERY.weeks;
const pixel6 = productBySlug("pixel-6");

const GROUPS: { id: string; title: string; items: { q: string; a: string }[] }[] = [
  {
    id: "faq-seguridad",
    title: "Tus claves",
    items: [
      {
        q: "¿Ustedes ven mi frase semilla?",
        a: "No. Nunca. Las billeteras llegan selladas y sin inicializar: las claves las genera el propio dispositivo cuando lo configurás vos, y no salen de ahí. Nunca te vamos a pedir tu frase, ni para venderte, ni para cobrarte, ni para darte soporte. Si alguien te la pide en nombre de Mercav, es una estafa.",
      },
      {
        q: "¿Cómo sé que la billetera es original?",
        a: "Llega sellada de fábrica, nunca abierta ni inicializada. Al configurarla, la conectás a la app oficial de la marca (Ledger Wallet, Trezor Suite o Tangem), que comprueba que el equipo es auténtico. Bajá esa app solo desde el sitio de la marca.",
      },
      {
        q: "¿Qué pasa si pierdo la billetera?",
        a: "Con tu frase de recuperación restaurás tus fondos en otra billetera compatible. En Tangem, el respaldo es la segunda tarjeta del pack. Sin la frase o sin el respaldo, nadie puede recuperar los fondos: tampoco nosotros.",
      },
    ],
  },
  {
    id: "faq-sistema",
    title: "El sistema",
    items: [
      {
        q: "¿Qué es el sistema reforzado?",
        a: `Es GrapheneOS, un sistema basado en Android enfocado en privacidad y seguridad, instalado desde su versión oficial firmada y sin modificaciones. Sobre él configuramos dos perfiles, Mullvad VPN, Session y el PIN de borrado. No somos parte del proyecto GrapheneOS ni lo representamos.`,
      },
      {
        q: "¿Puedo verificar que el sistema es el oficial?",
        a: "Sí. GrapheneOS usa arranque verificado (verified boot) con su propia clave, y la app Auditor hace una atestación por hardware: el chip de seguridad del teléfono firma el estado del sistema y Auditor comprueba que es el oficial y que no fue alterado. La verificación la podés hacer vos.",
      },
      {
        q: "¿Por qué el Pixel 6 tiene soporte extendido?",
        a:
          pixel6?.warning ??
          "Porque Google ya no garantiza sus actualizaciones. GrapheneOS sigue parcheando el sistema con su soporte extendido, pero ya no el firmware de Google.",
      },
      {
        q: "¿Qué es el PIN de borrado?",
        a: "Es un PIN o contraseña de coacción (duress PIN). Lo configurás vos, distinto de tu PIN de siempre: si alguna vez lo ingresás en su lugar, el teléfono borra todo, incluidas las eSIM, de forma irreversible.",
      },
      {
        q: "¿Qué VPN incluye?",
        a: `Mullvad VPN: no guarda registros y la cuenta es un número, sin correo ni datos personales. Usa WireGuard y queda siempre activa, con el bloqueo de conexiones fuera de la VPN. Viene por ${PHONE_BUNDLE.vpnMonths} meses con cada celular y por ${INSTALL_SERVICE.vpnMonths} meses con la instalación.`,
      },
      {
        q: "¿Qué es Session?",
        a: "Una app de mensajería cifrada de extremo a extremo que no usa número de teléfono ni correo: tu cuenta es un ID que se genera en el teléfono. Los mensajes pasan por una red descentralizada con enrutamiento cebolla (onion routing), que ayuda a no exponer tu dirección IP.",
      },
      {
        q: "¿Puedo usar Google Play y mis apps?",
        a: "Sí, en el perfil con Google Play en sandbox: ahí Play corre como una app común, sin privilegios especiales del sistema. El otro perfil queda sin servicios de Google. Algunas apps que exigen la certificación de Google, como ciertas apps de bancos, pueden negarse a funcionar: si dependés de una en particular, consultanos antes de pedir.",
      },
      {
        q: "¿Por qué solo Google Pixel?",
        a: "Porque GrapheneOS solo da soporte a los Pixel: permiten volver a bloquear el bootloader con otro sistema y mantener el arranque verificado, tienen el chip de seguridad Titan M2 y reciben actualizaciones de firmware.",
      },
    ],
  },
  {
    id: "faq-pedidos",
    title: "Pedidos y pagos",
    items: [
      {
        q: "¿Cuánto tarda un pedido?",
        a: `Todo es a pedido: de ${weeksMin} a ${weeksMax} semanas. ${DELIVERY.coverage}`,
      },
      {
        q: "¿Cómo pago?",
        a: `En ${PAYMENT.cryptos.join(" o ")}${PAYMENT.qrByWhatsApp ? ", o con QR en bolivianos coordinando por WhatsApp" : ""}. La dirección y la red te las damos en cada pedido; en el sitio no publicamos direcciones de pago.`,
      },
      {
        q: "¿El precio puede cambiar?",
        a: "El precio está en USDT. El monto en bolivianos, SOL o XRP se calcula con la cotización del momento del pago y queda fijo ahí. Los montos que ves en el sitio son aproximados.",
      },
      {
        q: "¿Hay costos de aduana?",
        a: "Si hay costos de envío o de importación, te confirmamos el total antes de pagar. Lo que aceptás es lo que pagás.",
      },
      {
        q: "¿Y si lo encuentro más barato?",
        a: "Tenemos los precios más bajos de Bolivia: si lo encontrás más barato en el país, te lo igualamos. Escribinos con el producto y dónde lo viste.",
      },
      {
        q: "¿Hacen envíos fuera de Bolivia?",
        a: "Todavía no. Por ahora enviamos a toda Bolivia; los envíos internacionales los vamos a sumar pronto.",
      },
    ],
  },
];

export default function PrivacyFaqPage() {
  const all = GROUPS.flatMap((g) => g.items);
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: all.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <JsonLd data={data} />
      <PageIntro id="faq-title" title="Preguntas frecuentes." lead="Lo que más nos preguntan sobre las claves, el sistema, los pedidos y los pagos." />
      <div className="c-container flex flex-col gap-16 pb-20 md:gap-24 md:pb-28">
        {GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={g.id} className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <h2 id={g.id} className="c-h2">
              {g.title}
            </h2>
            <FaqList items={g.items} withSchema={false} />
          </section>
        ))}
        <section aria-labelledby="faq-otra" className="grid gap-6 border-t-2 border-[var(--c-line)] pt-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <h2 id="faq-otra" className="c-h3">
            ¿Otra pregunta?
          </h2>
          <OrderCTA ask />
        </section>
      </div>
    </>
  );
}
// creado por pato dev y askforvini
