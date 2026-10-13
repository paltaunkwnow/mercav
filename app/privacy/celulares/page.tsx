import { CartelSection } from "@/components/site/cartel/primitives";
import { GrapheneNote, JsonLd, MoreLink, OrderCTA, PageIntro } from "@/components/privacy/blocks";
import { PhoneTable, ProductRows } from "@/components/privacy/CatalogBlocks";
import { QuoteNote } from "@/components/privacy/Price";
import { privacyMetadata, privacyUrl } from "@/components/privacy/site";
import { loadRates } from "@/components/privacy/rates-server";
import { CATEGORIES, DELIVERY, PHONE_BUNDLE, productsIn } from "@/lib/privacy/catalog";

const CATEGORY = CATEGORIES.celulares;

export const metadata = privacyMetadata({
  path: "/celulares",
  title: "Google Pixel con sistema reforzado basado en GrapheneOS",
  description: `${CATEGORY.lead} Del Pixel 6 al Pixel 10 Pro, con ${PHONE_BUNDLE.vpnMonths} meses de Mullvad VPN, perfiles aislados y PIN de borrado. A pedido, con envíos a toda Bolivia.`,
});

const [weeksMin, weeksMax] = DELIVERY.weeks;

export default async function PhonesPage() {
  const rates = await loadRates();
  const phones = productsIn("celulares");

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: CATEGORY.title,
    description: CATEGORY.lead,
    url: privacyUrl("/celulares"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: phones.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: privacyUrl(`/producto/${p.slug}`) })),
    },
  };

  return (
    <>
      <JsonLd data={data} />
      <PageIntro id="celulares-title" title={CATEGORY.title} lead={CATEGORY.lead}>
        <section aria-labelledby="celulares-trae" className="mt-12 grid gap-6 border-t-2 border-[var(--c-text)] pt-6 md:mt-16 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-16">
          <h2 id="celulares-trae" className="c-h3">
            Cada celular trae
          </h2>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {PHONE_BUNDLE.items.map((item) => (
              <li key={item} className="border-b-2 border-[var(--c-line)] py-3 text-[1rem] leading-relaxed text-[var(--c-soft)]">
                {item.startsWith("Mullvad") ? `${item.replace(/\.$/, "")}, por ${PHONE_BUNDLE.vpnMonths} meses.` : item}
              </li>
            ))}
          </ul>
        </section>
      </PageIntro>

      <section aria-labelledby="celulares-modelos" className="c-container pb-20 md:pb-28">
        <div className="mb-8 flex flex-col gap-3 md:mb-10">
          <h2 id="celulares-modelos" className="c-h2">
            Los modelos.
          </h2>
          <QuoteNote rates={rates} className="max-w-[44rem]" />
        </div>
        <ProductRows products={phones} rates={rates} />
      </section>

      <CartelSection labelledBy="celulares-comparar" className="!pt-0">
        <div className="c-container">
          <h2 id="celulares-comparar" className="c-h2 mb-4">
            Comparalos.
          </h2>
          <p className="c-body mb-10">
            MTE (Memory Tagging Extension) es una mitigación por hardware contra los errores de memoria, la base de muchos exploits; está desde el Pixel
            8. Las fechas son las que garantiza Google para las actualizaciones de seguridad.
          </p>
          <PhoneTable products={phones} captionId="celulares-comparar" />
          <GrapheneNote className="mt-10" />
        </div>
      </CartelSection>

      <section aria-labelledby="celulares-pixel" className="c-band">
        <div className="c-container grid gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-5">
            <h2 id="celulares-pixel" className="c-h2">
              Pedí el tuyo.
            </h2>
            <p className="max-w-[34rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              A pedido: llega en {weeksMin} a {weeksMax} semanas, listo para usar. {DELIVERY.coverage} ¿Ya tenés un Pixel 6 o posterior? Le instalamos el
              sistema.
            </p>
          </div>
          <div className="flex flex-col gap-5 lg:pb-2">
            <OrderCTA tone="ink" />
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <MoreLink to="/instalacion">Instalación en tu Pixel</MoreLink>
              <MoreLink to="/pagos">Cómo pagar</MoreLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
// creado por pato dev y askforvini
