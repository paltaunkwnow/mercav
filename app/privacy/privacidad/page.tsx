import { DocPage, DocSection } from "@/components/privacy/Doc";
import { SUPPORT_EMAIL, privacyMetadata } from "@/components/privacy/site";
import { PAYMENT } from "@/lib/privacy/catalog";
import { SITE_URL } from "@/lib/seo/site";

export const metadata = privacyMetadata({
  path: "/privacidad",
  title: "Privacidad",
  description:
    "Qué datos pide Mercav Privacy y para qué: tu nombre, un contacto y tu ciudad, solo para entregar el pedido. Este sitio no usa rastreadores ni analítica.",
});

export default function PrivacyPolicyPage() {
  return (
    <DocPage id="privacidad-title" title="Privacidad." lead="Pedimos lo mínimo para entregarte el pedido, y nada más.">
      <DocSection title="Qué datos pedimos">
        <p>
          <strong>Tu nombre, un contacto</strong> (WhatsApp o correo) <strong>y tu ciudad</strong>. Los usamos solo para coordinar y entregar tu pedido. No
          te pedimos que crees una cuenta.
        </p>
      </DocSection>

      <DocSection title="Lo que no pedimos">
        <p>
          Nunca te vamos a pedir tu frase semilla, tus claves privadas, tu PIN ni el PIN de borrado.
        </p>
      </DocSection>

      <DocSection title="Este sitio">
        <p>
          privacy.mercav.lat <strong>no usa rastreadores, analítica, píxeles de publicidad ni cookies de seguimiento</strong>, y no carga letras, imágenes ni
          scripts de otros sitios. Si elegís el modo claro u oscuro, esa preferencia queda guardada en tu navegador y no sale de tu equipo.
        </p>
      </DocSection>

      <DocSection title="Pagos">
        <p>
          Los pagos en SOL y XRP quedan registrados en su cadena de bloques, que es pública: cualquiera puede ver la transacción, aunque no sepa quién la
          hizo. Eso no depende de nosotros.
        </p>
        {PAYMENT.qrByWhatsApp ? (
          <p>
            Si coordinás por WhatsApp, esa conversación también pasa por WhatsApp y su política de privacidad. Si preferís, escribinos por correo a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="c-link">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        ) : null}
      </DocSection>

      <DocSection title="Cuánto los guardamos">
        <p>
          Lo necesario para el pedido y su garantía, y lo que exija la ley. Podés pedirnos que los borremos o ver qué tenemos de vos escribiendo a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="c-link">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </DocSection>

      <DocSection title="Lo demás">
        <p>
          Para lo que no esté acá rige la{" "}
          <a href={`${SITE_URL}/privacidad`} className="c-link">
            política de privacidad de Mercav
          </a>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}
// creado por pato dev y askforvini
