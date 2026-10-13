import { PLink } from "@/components/privacy/blocks";
import { DocPage, DocSection } from "@/components/privacy/Doc";
import { SUPPORT_EMAIL, privacyMetadata } from "@/components/privacy/site";
import { DELIVERY } from "@/lib/privacy/catalog";
import { SITE_URL } from "@/lib/seo/site";

const [weeksMin, weeksMax] = DELIVERY.weeks;

export const metadata = privacyMetadata({
  path: "/terminos",
  title: "Términos de compra",
  description: "Las condiciones de compra de Mercav Privacy, en corto: precios en USDT, pedidos por encargo, pagos, envíos y garantía.",
});

export default function PrivacyTermsPage() {
  return (
    <DocPage id="terminos-title" title="Términos." lead="Las condiciones de compra de Mercav Privacy, en corto.">
      <DocSection title="Quién vende">
        <p>
          Mercav Privacy es la tienda de Mercav en privacy.mercav.lat. Para todo lo que no esté acá, rigen los{" "}
          <a href={`${SITE_URL}/terminos`} className="c-link">
            Términos de Mercav
          </a>
          .
        </p>
      </DocSection>

      <DocSection title="Precios">
        <p>
          Los precios están en USDT y son precios desde. Los montos en bolivianos, SOL o XRP que ves en el sitio son aproximados: el monto final se calcula
          con la cotización del momento del pago y queda fijo ahí. Si encontrás el mismo producto más barato en Bolivia, te lo igualamos.
        </p>
      </DocSection>

      <DocSection title="Pedidos">
        <p>
          Todo se vende a pedido. El plazo es de {weeksMin} a {weeksMax} semanas y es estimado. Antes de pagar te confirmamos el total, con el envío y los
          costos de importación si los hay; el pedido se hace cuando pagás ese total.
        </p>
      </DocSection>

      <DocSection title="Pagos">
        <p>
          En SOL, XRP o con QR en bolivianos. La dirección y la red te las damos en cada pedido: un pago enviado a otra dirección o por otra red no lo
          podemos recuperar. El detalle está en{" "}
          <PLink to="/pagos" className="c-link">
            pagos
          </PLink>
          .
        </p>
      </DocSection>

      <DocSection title="Garantía">
        <p>
          Las billeteras se venden selladas y sin inicializar; una vez abiertas o inicializadas no tienen devolución. Cada equipo tiene la garantía de su
          fabricante. Todo está en{" "}
          <PLink to="/garantia" className="c-link">
            garantía
          </PLink>
          .
        </p>
      </DocSection>

      <DocSection title="Tus claves son tuyas">
        <p>
          Nunca te vamos a pedir tu frase semilla ni tus claves privadas. Guardarlas es tu responsabilidad: si las perdés, nadie puede recuperar tus fondos,
          tampoco nosotros.
        </p>
      </DocSection>

      <DocSection title="El sistema">
        <p>
          El sistema de los celulares y de la instalación está basado en GrapheneOS, software libre y de código abierto. No somos parte del proyecto
          GrapheneOS ni lo representamos: instalamos su versión oficial firmada, sin modificaciones. Lo que cobramos es el equipo, el trabajo, la
          configuración y la VPN.
        </p>
        <p>Ledger, Trezor, Tangem, Google, Pixel, Mullvad y Session son marcas de sus dueños.</p>
      </DocSection>

      <DocSection title="Contacto">
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="c-link">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </DocSection>
    </DocPage>
  );
}
// creado por pato dev y askforvini
