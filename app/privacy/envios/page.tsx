import { PLink } from "@/components/privacy/blocks";
import { DocPage, DocSection } from "@/components/privacy/Doc";
import { privacyMetadata } from "@/components/privacy/site";
import { DELIVERY } from "@/lib/privacy/catalog";

const [weeksMin, weeksMax] = DELIVERY.weeks;

export const metadata = privacyMetadata({
  path: "/envios",
  title: "Envíos a toda Bolivia",
  description: `Todo en Mercav Privacy es a pedido: llega en ${weeksMin} a ${weeksMax} semanas, a cualquier ciudad de Bolivia. El total, con envío e importación, te lo confirmamos antes de pagar.`,
});

export default function ShippingPage() {
  return (
    <DocPage id="envios-title" title="Envíos." lead={`Todo es a pedido: de ${weeksMin} a ${weeksMax} semanas. ${DELIVERY.coverage}`}>
      <DocSection title="A pedido">
        <p>
          No tenemos stock guardado: cada equipo se pide para vos. Por eso los plazos van de {weeksMin} a {weeksMax} semanas, según el producto y el
          origen.
        </p>
      </DocSection>

      <DocSection title="Adónde">
        <p>
          A cualquier ciudad de Bolivia. Los envíos internacionales todavía no están disponibles; los vamos a sumar pronto.
        </p>
      </DocSection>

      <DocSection title="Aduana y costos">
        <p>
          Los equipos se importan para cada pedido. Si hay costos de envío o de importación, <strong>te confirmamos el total antes de pagar</strong>: lo que
          aceptás es lo que pagás.
        </p>
      </DocSection>

      <DocSection title="Al recibirlo">
        <p>
          Las billeteras llegan selladas de fábrica. Si la caja llega abierta o dañada, no la configures y escribinos: está en la{" "}
          <PLink to="/garantia" className="c-link">
            garantía
          </PLink>
          .
        </p>
        <p>Los celulares llegan con el sistema instalado y listos para que pongas tu PIN.</p>
      </DocSection>

      <DocSection title="Tus datos">
        <p>
          Para el envío solo te pedimos tu nombre, un contacto y la ciudad. Lo explicamos en{" "}
          <PLink to="/privacidad" className="c-link">
            privacidad
          </PLink>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}
// creado por pato dev y askforvini
