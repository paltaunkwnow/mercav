import { CartelSection } from "@/components/site/cartel/primitives";
import { JsonLd, MoreLink, OrderCTA, PageIntro } from "@/components/privacy/blocks";
import { ProductWarning } from "@/components/privacy/CatalogBlocks";
import { DeviceSilhouette } from "@/components/privacy/DeviceArt";
import { PriceBlock } from "@/components/privacy/Price";
import { PRIVACY_NAME, loadRates, privacyMetadata, privacyUrl } from "@/components/privacy/site";
import { CATEGORIES, HARDENED_OS_FEATURES, INSTALL_SERVICE, PHONE_BUNDLE, productBySlug } from "@/lib/privacy/catalog";
import { SITE_URL } from "@/lib/seo/site";

const CATEGORY = CATEGORIES.instalacion;
const NAME = "Instalación del sistema reforzado en tu Pixel";

export const metadata = privacyMetadata({
  path: "/instalacion",
  title: "Instalación del sistema reforzado en tu Pixel",
  description: `${CATEGORY.lead} Basado en GrapheneOS, desde la versión oficial firmada: ${INSTALL_SERVICE.vpnMonths} meses de Mullvad VPN, Session, dos perfiles y PIN de borrado. Pixel 6 y posteriores.`,
});

const STEPS = [
  {
    title: "Respaldo",
    body: "Antes de empezar, respaldás lo que quieras conservar: para instalar el sistema hay que desbloquear el bootloader, y eso borra el teléfono por completo.",
  },
  {
    title: "Instalación oficial",
    body: "Instalamos GrapheneOS desde su versión oficial firmada, sin modificaciones, y volvemos a bloquear el bootloader para que el arranque verificado quede activo.",
  },
  {
    title: "Atestación con Auditor",
    body: "Comprobamos con la app Auditor, por hardware, que el sistema es el oficial y no fue alterado. Después podés repetir la verificación vos.",
  },
  {
    title: "Tu PIN, tuyo",
    body: "El PIN, el PIN de borrado y tus cuentas los configurás vos. Nosotros no los conocemos ni los necesitamos.",
  },
];

/** Lo que incluye: lo mismo que trae un celular, con la VPN de la instalación. */
const INCLUDES = PHONE_BUNDLE.items.map((item) => (item.startsWith("Mullvad") ? `${item.replace(/\.$/, "")}, por ${INSTALL_SERVICE.vpnMonths} meses.` : item));

export default async function InstallPage() {
  const rates = await loadRates();
  const pixel6 = productBySlug("pixel-6");

  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: NAME,
    serviceType: "Instalación de sistema operativo",
    description: CATEGORY.lead,
    url: privacyUrl("/instalacion"),
    areaServed: { "@type": "Country", name: "Bolivia" },
    provider: { "@type": "Organization", name: PRIVACY_NAME, parentOrganization: { "@id": `${SITE_URL}/#organization` } },
    // Sin precio estructurado: está en USDT, que no es una moneda ISO 4217.
  };

  return (
    <>
      <JsonLd data={data} />
      <PageIntro id="instalacion-title" title="Instalación en tu Pixel" lead={`${CATEGORY.lead} Para quien ya tiene el teléfono y quiere el mismo sistema que traen los nuestros.`}>
        <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-8">
            <PriceBlock priceUsdt={INSTALL_SERVICE.priceUsdt} rates={rates} />
            <OrderCTA product={{ name: NAME }} />
          </div>
          <div className="flex items-end gap-6 border-b-2 border-[var(--c-text)] sm:gap-10">
            <DeviceSilhouette kind="phone" className="w-24 sm:w-32" />
            <p className="pb-4 text-[0.95rem] leading-relaxed text-[var(--c-soft)]">
              Compatible con el Pixel 6 y posteriores. Decinos el modelo exacto antes de pedir y te confirmamos que se puede.
            </p>
          </div>
        </div>
      </PageIntro>

      <CartelSection labelledBy="instalacion-incluye" className="!pt-8 md:!pt-12">
        <div className="c-container grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
          <h2 id="instalacion-incluye" className="c-h2">
            Qué incluye.
          </h2>
          <ul className="border-t-2 border-[var(--c-line-strong)]">
            {INCLUDES.map((item) => (
              <li key={item} className="border-b-2 border-[var(--c-line)] py-4 text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>

      <section aria-labelledby="instalacion-proceso" className="c-inverse">
        <div className="c-container py-20 md:py-28">
          <h2 id="instalacion-proceso" className="c-h2 max-w-[14ch]">
            Cómo es.
          </h2>
          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3 border-t-2 border-[var(--c-text)] pt-5">
                <span className="flex items-baseline gap-3">
                  <span aria-hidden className="c-display c-num text-[2.5rem] leading-none text-[var(--c-muted)]">
                    {i + 1}
                  </span>
                  <h3 className="c-h3">{s.title}</h3>
                </span>
                <p className="c-body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CartelSection labelledBy="instalacion-compatibles">
        <div className="c-container grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
          <h2 id="instalacion-compatibles" className="c-h2">
            Equipos compatibles.
          </h2>
          <div className="flex flex-col gap-6">
            <p className="c-lead">
              Pixel 6 y posteriores. Cuanto más nuevo, más tiempo de actualizaciones de Google y más protecciones por hardware: MTE está desde el Pixel 8.
            </p>
            {pixel6?.warning ? <ProductWarning text={`Si tu equipo es un Pixel 6: ${pixel6.warning}`} className="max-w-[44rem]" /> : null}
            <MoreLink to="/celulares">Ver hasta cuándo se actualiza cada modelo</MoreLink>
          </div>
        </div>
      </CartelSection>

      <section aria-labelledby="instalacion-libre" className="c-band">
        <div className="c-container grid gap-6 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <h2 id="instalacion-libre" className="c-h2">
            GrapheneOS es libre.
          </h2>
          <div className="flex flex-col gap-4 lg:pb-2">
            <p className="max-w-[32rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              Es software libre y de código abierto, y no cobramos por él. Lo que pagás es el trabajo, la configuración y los {INSTALL_SERVICE.vpnMonths} meses
              de VPN.
            </p>
            <p className="max-w-[32rem] text-[0.95rem] leading-relaxed text-[var(--c-soft)]">
              No somos parte del proyecto GrapheneOS ni lo representamos: instalamos su versión oficial firmada, sin modificaciones.
            </p>
          </div>
        </div>
      </section>

      <CartelSection labelledBy="instalacion-sistema">
        <div className="c-container">
          <h2 id="instalacion-sistema" className="c-h2 max-w-[16ch]">
            Lo que cambia en tu teléfono.
          </h2>
          <ul className="mt-12 grid border-t-2 border-[var(--c-line-strong)] md:mt-16 md:grid-cols-2 md:gap-x-14">
            {HARDENED_OS_FEATURES.map((f) => (
              <li key={f.title} className="border-b-2 border-[var(--c-line)] py-6 md:py-8">
                <h3 className="c-h3">{f.title}</h3>
                <p className="c-body mt-2 max-w-[34rem]">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>
    </>
  );
}
// creado por pato dev y askforvini
