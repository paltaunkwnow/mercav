import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "@/components/icons";
import { CartelSection } from "@/components/site/cartel/primitives";
import { GrapheneNote, JsonLd, MoreLink, OrderCTA, PLink } from "@/components/privacy/blocks";
import { ConditionTag, PriceBoard, ProductWarning } from "@/components/privacy/CatalogBlocks";
import { DeviceArt } from "@/components/privacy/DeviceArt";
import { PriceBlock } from "@/components/privacy/Price";
import { PRIVACY_NAME, privacyMetadata, privacyUrl } from "@/components/privacy/site";
import { loadRates } from "@/components/privacy/rates-server";
import { CATEGORIES, DELIVERY, HARDENED_OS_FEATURES, PAYMENT, PHONE_BUNDLE, PRODUCTS, productBySlug, productsIn, type PrivacyProduct } from "@/lib/privacy/catalog";
import { SITE_URL } from "@/lib/seo/site";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

const describe = (p: PrivacyProduct) =>
  p.category === "celulares"
    ? `${p.name} con sistema reforzado basado en GrapheneOS, Mullvad VPN por ${PHONE_BUNDLE.vpnMonths} meses y Session. ${p.tagline}${
        p.securityUpdatesUntil ? ` Actualizaciones de seguridad de Google hasta ${p.securityUpdatesUntil}.` : ""
      }`
    : `${p.name}, sellada de fábrica, nunca abierta ni inicializada. ${p.tagline} La frase de recuperación la generás vos.`;

export function generateMetadata({ params }: Props): Metadata {
  const p = productBySlug(params.slug);
  if (!p) return {};
  const title = p.category === "celulares" ? `${p.name} con sistema reforzado` : `${p.name}, billetera fría sellada`;
  return privacyMetadata({ path: `/producto/${p.slug}`, title, description: describe(p) });
}

const [weeksMin, weeksMax] = DELIVERY.weeks;

/** Un renglón de la ficha: rótulo y valor. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b-2 border-[var(--c-line)] py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
      <dt className="c-label text-[1.05rem] text-[var(--c-soft)]">{label}</dt>
      <dd className="text-[1rem] leading-relaxed text-[var(--c-text)]">{children}</dd>
    </div>
  );
}

/** La sección de una ficha: titular a la izquierda, contenido a la derecha. */
function Part({ id, title, children, className }: { id: string; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <CartelSection labelledBy={id} className={className}>
      <div className="c-container grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
        <h2 id={id} className="c-h2 max-w-[12ch]">
          {title}
        </h2>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>
    </CartelSection>
  );
}

function WalletParts({ p }: { p: PrivacyProduct }) {
  const tangem = p.brand === "Tangem";
  const shamir = p.specs.some((s) => s.includes("SLIP-39"));
  const host = p.verifyWith ? new URL(p.verifyWith.url).hostname.replace(/^www\./, "") : null;
  return (
    <>
      <section aria-labelledby="ficha-sellada" className="c-band">
        <div className="c-container grid gap-6 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <h2 id="ficha-sellada" className="c-h2">
            Sellada de fábrica.
          </h2>
          <p className="max-w-[32rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)] lg:pb-2">
            Nunca abierta ni inicializada: llega en su caja original, como sale del fabricante. Si la caja llega abierta o dañada, no la configures y escribinos.
          </p>
        </div>
      </section>

      {p.verifyWith ? (
        <Part id="ficha-verificar" title="Verificá que es original.">
          <p className="c-lead">
            {p.verifyWith.app === p.brand ? (
              <>Instalá la app oficial de {p.brand}</>
            ) : (
              <>
                Instalá <strong className="font-semibold text-[var(--c-text)]">{p.verifyWith.app}</strong>, la app oficial de {p.brand},
              </>
            )}{" "}
            y conectá la billetera: la app comprueba que el equipo es auténtico antes de que guardes nada en él.
          </p>
          <a
            href={p.verifyWith.url}
            target="_blank"
            rel="noopener noreferrer"
            className="c-link inline-flex w-fit items-center gap-2 text-[1.0625rem] font-semibold text-[var(--c-text)]"
          >
            {p.verifyWith.app} en {host}
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
          <p className="c-body">Bajala solo desde el sitio de la marca. Si una app o una persona te ofrece “verificarla” por vos, desconfiá.</p>
        </Part>
      ) : null}

      <Part id="ficha-frase" title="La frase la generás vos." className="!pt-0">
        {tangem ? (
          <p className="c-lead">
            Con Tangem, las claves se generan dentro del chip de la tarjeta y no salen de ahí. El respaldo es la segunda tarjeta del pack: guardala en otro
            lugar.
          </p>
        ) : (
          <p className="c-lead">
            Al configurarla, la billetera genera tus claves y te muestra la frase de recuperación (BIP39). Anotala a mano y guardala fuera de internet: sin
            fotos, sin nube.
          </p>
        )}
        {shamir ? <p className="c-body">Si preferís, usá el respaldo Shamir (SLIP-39): la frase se reparte en varias partes y hacen falta algunas para recuperarla.</p> : null}
        <p className="text-[1.25rem] font-semibold leading-snug text-[var(--c-text)]">Nunca te vamos a pedir tu frase semilla. Nadie de Mercav la va a ver.</p>
      </Part>
    </>
  );
}

function PhoneParts({ p }: { p: PrivacyProduct }) {
  return (
    <>
      <Part id="ficha-trae" title="Qué trae.">
        <ul className="border-t-2 border-[var(--c-line-strong)]">
          {PHONE_BUNDLE.items.map((item) => (
            <li key={item} className="border-b-2 border-[var(--c-line)] py-4 text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">
              {item.startsWith("Mullvad") ? `${item.replace(/\.$/, "")}, por ${PHONE_BUNDLE.vpnMonths} meses.` : item}
            </li>
          ))}
        </ul>
        <GrapheneNote />
      </Part>

      {p.securityUpdatesUntil ? (
        <section aria-labelledby="ficha-parches" className="c-band">
          <div className="c-container grid gap-6 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
            <h2 id="ficha-parches" className="c-h2">
              <span className="block text-[0.5em] leading-tight">Actualizaciones de seguridad de Google hasta</span>
              {p.securityUpdatesUntil}.
            </h2>
            <p className="max-w-[32rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)] lg:pb-2">
              {p.warning ??
                "Es la fecha que garantiza Google para los parches del firmware y del sistema. GrapheneOS publica sus actualizaciones sobre esa base, y se instalan solas."}
            </p>
          </div>
        </section>
      ) : null}

      <CartelSection labelledBy="ficha-sistema">
        <div className="c-container">
          <h2 id="ficha-sistema" className="c-h2 max-w-[16ch]">
            El sistema, por dentro.
          </h2>
          {/* slot: InteractivePhone (el teléfono interactivo va acá, entre el titular y la lista de funciones) */}
          <ul className="mt-12 grid border-t-2 border-[var(--c-line-strong)] md:mt-16 md:grid-cols-2 md:gap-x-14">
            {HARDENED_OS_FEATURES.map((f) => (
              <li key={f.title} className="border-b-2 border-[var(--c-line)] py-6 md:py-8">
                <h3 className="c-h3">{f.title}</h3>
                <p className="c-body mt-2 max-w-[34rem]">{f.body}</p>
              </li>
            ))}
          </ul>
          <GrapheneNote className="mt-10" />
        </div>
      </CartelSection>
    </>
  );
}

export default async function ProductPage({ params }: Props) {
  const p = productBySlug(params.slug);
  if (!p) notFound();
  const rates = await loadRates();
  const phone = p.category === "celulares";
  const category = CATEGORIES[p.category];
  const url = privacyUrl(`/producto/${p.slug}`);
  const others = productsIn(p.category).filter((o) => o.slug !== p.slug);
  const condition = p.condition === "reacondicionado" ? "https://schema.org/RefurbishedCondition" : "https://schema.org/NewCondition";

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#producto`,
      name: p.name,
      description: describe(p),
      brand: { "@type": "Brand", name: p.brand },
      sku: p.slug,
      url,
      itemCondition: condition,
      ...(p.colors?.length ? { color: p.colors.join(", ") } : {}),
      // Sin offers.price ni priceCurrency: el precio está en USDT, que no es una moneda ISO 4217, y schema.org (y los
      // buscadores) esperan un código ISO. Publicar un monto en USD o BOB sería inventarlo, porque se fija al pagar.
      offers: {
        "@type": "Offer",
        url,
        availability: "https://schema.org/PreOrder",
        itemCondition: condition,
        areaServed: { "@type": "Country", name: "Bolivia" },
        seller: { "@type": "Organization", name: PRIVACY_NAME, parentOrganization: { "@id": `${SITE_URL}/#organization` } },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: PRIVACY_NAME, item: privacyUrl("/") },
        { "@type": "ListItem", position: 2, name: category.title, item: privacyUrl(`/${p.category}`) },
        { "@type": "ListItem", position: 3, name: p.name, item: url },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={data} />

      {/* En el teléfono el dibujo va entre el titular y el precio; en la compu, a la derecha y pegado al bajar. */}
      <section
        aria-labelledby="ficha-title"
        className="c-container grid gap-10 pb-16 pt-10 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-7 lg:pb-24"
      >
        <div className="flex min-w-0 flex-col gap-7 lg:col-start-1 lg:row-start-1">
          <PLink
            to={`/${p.category}`}
            className="inline-flex w-fit items-center gap-2 rounded-[2px] text-[0.95rem] font-semibold text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {category.title}
          </PLink>
          <div className="flex flex-col gap-5">
            <h1 id="ficha-title" className="c-display text-[clamp(3rem,1.8rem+5vw,6rem)] [text-wrap:balance]">
              {p.name}
            </h1>
            <p className="c-lead">{p.tagline}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <ConditionTag product={p} />
              {p.conditionNote ? <span className="text-[0.95rem] text-[var(--c-soft)]">{p.conditionNote}</span> : null}
              {!phone ? <span className="text-[0.95rem] text-[var(--c-soft)]">Sellada de fábrica · nunca abierta ni inicializada</span> : null}
            </div>
          </div>
        </div>

        <figure className="c-inverse flex h-fit flex-col gap-5 p-6 sm:p-10 lg:sticky lg:top-[calc(var(--c-nav-h)+1.5rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <DeviceArt product={p} className="mx-auto h-44 w-full max-w-[22rem] sm:h-72 lg:h-[26rem]" />
          <figcaption className="border-t-2 border-[var(--c-text)] pt-3 text-[0.9rem] leading-snug text-[var(--c-soft)]">
            {p.name}. Ilustración genérica, no a escala: no es una foto del equipo.
          </figcaption>
        </figure>

        <div className="flex min-w-0 flex-col gap-7 lg:col-start-1 lg:row-start-2">
          {p.warning ? <ProductWarning text={p.warning} className="max-w-[40rem]" /> : null}
          <PriceBlock priceUsdt={p.priceUsdt} rates={rates} />
          <dl className="border-t-2 border-[var(--c-line-strong)]">
            {p.storage ? <Row label="Almacenamiento">{p.storage}</Row> : null}
            {p.colors?.length ? <Row label={p.colors.length === 1 ? "Color" : "Colores"}>{p.colors.join(" · ")}</Row> : null}
            <Row label="Características">
              <ul className="flex flex-col gap-1">
                {p.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Row>
            {p.securityUpdatesUntil ? <Row label="Parches de Google">Hasta {p.securityUpdatesUntil}</Row> : null}
            <Row label="Entrega">
              A pedido: {weeksMin} a {weeksMax} semanas. {DELIVERY.coverage}
            </Row>
            <Row label="Pago">
              {PAYMENT.cryptos.join(" o ")}
              {PAYMENT.qrByWhatsApp ? ", o QR en bolivianos por WhatsApp" : ""}. El monto se fija al pagar.
            </Row>
          </dl>
          <OrderCTA product={p} />
        </div>
      </section>

      {phone ? <PhoneParts p={p} /> : <WalletParts p={p} />}

      {others.length ? (
        <CartelSection labelledBy="ficha-otros">
          <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
            <div className="flex flex-col gap-6">
              <h2 id="ficha-otros" className="c-h2">
                {phone ? "Otros celulares." : "Otras billeteras."}
              </h2>
              <MoreLink to={`/${p.category}`}>{phone ? "Compararlos todos" : "Ver todas, con su detalle"}</MoreLink>
            </div>
            <PriceBoard products={others} detail={(o) => (o.securityUpdatesUntil ? `Parches de Google hasta ${o.securityUpdatesUntil}` : o.tagline)} />
          </div>
        </CartelSection>
      ) : null}
    </>
  );
}
// creado por pato dev y askforvini
