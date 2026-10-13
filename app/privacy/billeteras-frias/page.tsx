import { CartelSection } from "@/components/site/cartel/primitives";
import { JsonLd, MoreLink, OrderCTA, PageIntro } from "@/components/privacy/blocks";
import { ProductRows } from "@/components/privacy/CatalogBlocks";
import { QuoteNote } from "@/components/privacy/Price";
import { privacyMetadata, privacyUrl } from "@/components/privacy/site";
import { loadRates } from "@/components/privacy/rates-server";
import { CATEGORIES, DELIVERY, productsIn } from "@/lib/privacy/catalog";

const CATEGORY = CATEGORIES["billeteras-frias"];

export const metadata = privacyMetadata({
  path: "/billeteras-frias",
  title: "Billeteras frías Ledger, Trezor y Tangem",
  description: `${CATEGORY.lead} Ledger, Trezor y Tangem a pedido, con envíos a toda Bolivia. Pagás en SOL, XRP o con QR en bolivianos.`,
});

const PROMISES = [
  { title: "Sellada de fábrica", body: "Llega en su caja original, nunca abierta ni inicializada." },
  { title: "La frase la generás vos", body: "La frase de recuperación sale del dispositivo, no de nosotros. Nunca te la vamos a pedir." },
  { title: "Verificás que es original", body: "Con la app oficial de la marca comprobás la autenticidad del equipo." },
];

const [weeksMin, weeksMax] = DELIVERY.weeks;

export default async function ColdWalletsPage() {
  const rates = await loadRates();
  const wallets = productsIn("billeteras-frias");
  const brands = Array.from(new Set(wallets.map((p) => p.brand)));

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: CATEGORY.title,
    description: CATEGORY.lead,
    url: privacyUrl("/billeteras-frias"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: wallets.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: privacyUrl(`/producto/${p.slug}`) })),
    },
  };

  return (
    <>
      <JsonLd data={data} />
      <PageIntro id="billeteras-title" title={CATEGORY.title} lead={CATEGORY.lead}>
        <ul className="mt-12 grid border-t-2 border-[var(--c-text)] md:mt-16 md:grid-cols-3 md:gap-x-10">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex flex-col gap-1.5 border-b-2 border-[var(--c-line)] py-5 md:border-b-0">
              <span className="c-label text-[1.25rem]">{p.title}</span>
              <span className="text-[0.95rem] leading-relaxed text-[var(--c-soft)]">{p.body}</span>
            </li>
          ))}
        </ul>
      </PageIntro>

      <div className="c-container flex flex-col gap-20 pb-20 md:gap-28 md:pb-28">
        <QuoteNote rates={rates} className="-mt-4 max-w-[44rem]" />
        {brands.map((brand) => (
          <section key={brand} aria-labelledby={`marca-${brand.toLowerCase()}`}>
            <h2 id={`marca-${brand.toLowerCase()}`} className="c-h2 mb-8 md:mb-10">
              {brand}
            </h2>
            <ProductRows products={wallets.filter((p) => p.brand === brand)} rates={rates} />
          </section>
        ))}
      </div>

      <CartelSection labelledBy="billeteras-pedido" className="c-band">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-5">
            <h2 id="billeteras-pedido" className="c-h2">
              Pedí la tuya.
            </h2>
            <p className="max-w-[34rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              A pedido: llega en {weeksMin} a {weeksMax} semanas. {DELIVERY.coverage} Si la encontrás más barata en el país, te la igualamos.
            </p>
          </div>
          <div className="flex flex-col gap-5 lg:pb-2">
            <OrderCTA tone="ink" />
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <MoreLink to="/pagos">Cómo pagar</MoreLink>
              <MoreLink to="/garantia">Garantía</MoreLink>
            </div>
          </div>
        </div>
      </CartelSection>
    </>
  );
}
// creado por pato dev y askforvini
