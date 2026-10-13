// BORRADOR PARA REVISAR: las condiciones de esta página (plazos, cambios, devoluciones) las tiene que confirmar Mercav
// antes de publicarla como definitiva. En pantalla no se marca como borrador.
import { PLink } from "@/components/privacy/blocks";
import { DocPage, DocSection } from "@/components/privacy/Doc";
import { SUPPORT_EMAIL, privacyMetadata } from "@/components/privacy/site";
import { productsIn } from "@/lib/privacy/catalog";

export const metadata = privacyMetadata({
  path: "/garantia",
  title: "Garantía",
  description:
    "Garantía de Mercav Privacy: billeteras selladas de fábrica, la garantía del fabricante de cada equipo y qué pasa si algo llega con un defecto.",
});

export default function WarrantyPage() {
  const renewed = productsIn("celulares").filter((p) => p.condition === "reacondicionado");

  return (
    <DocPage id="garantia-title" title="Garantía." lead="Lo que te llega, cómo te llega y qué hacemos si algo no está bien.">
      <DocSection title="Billeteras selladas">
        <p>
          Las billeteras frías llegan en su caja original, <strong>nunca abiertas ni inicializadas</strong>. La frase de recuperación la generás vos al
          configurarla, y comprobás que el equipo es original con la app oficial de la marca.
        </p>
        <p>Si la caja llega abierta o dañada, no la configures: escribinos antes de usarla.</p>
      </DocSection>

      <DocSection title="Celulares">
        <p>
          Los celulares los preparamos nosotros: los sacamos de la caja para instalar el sistema desde su versión oficial firmada y configurarlo, y te llegan
          listos para que pongas tu PIN.
        </p>
        {renewed.length ? (
          <p>
            {renewed.map((p) => p.name).join(", ")} {renewed.length === 1 ? "no es nuevo" : "no son nuevos"}, y así lo marca su ficha
            {renewed[0].conditionNote ? `: «${renewed[0].conditionNote.replace(/\.$/, "")}».` : "."}
          </p>
        ) : null}
      </DocSection>

      <DocSection title="Garantía del fabricante">
        <p>
          Cada equipo tiene la garantía de su fabricante, en las condiciones de cada marca. Si necesitás usarla, escribinos y vemos juntos cómo hacerlo.
        </p>
      </DocSection>

      <DocSection title="Si llega con un defecto">
        <p>
          Si el equipo llega dañado o no funciona, escribinos apenas lo recibas a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="c-link">
            {SUPPORT_EMAIL}
          </a>
          , con fotos de la caja y del equipo. Lo revisamos y te lo cambiamos o te devolvemos lo que pagaste.
        </p>
      </DocSection>

      <DocSection title="Billeteras abiertas o inicializadas">
        <p>
          Una billetera que ya se abrió o se inicializó <strong>no tiene devolución</strong>: no podríamos garantizarle a otra persona que está intacta. Si
          tiene una falla, corre la garantía del fabricante.
        </p>
      </DocSection>

      <DocSection title="Dudas">
        <p>
          Las preguntas de siempre están en{" "}
          <PLink to="/preguntas-frecuentes" className="c-link">
            preguntas frecuentes
          </PLink>
          , y las condiciones de compra en{" "}
          <PLink to="/terminos" className="c-link">
            términos
          </PLink>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}
// creado por pato dev y askforvini
