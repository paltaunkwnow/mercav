import type { CSSProperties } from "react";
import { ArrowRight } from "@/components/icons";
import { CartelSection, FitLines, Starburst } from "@/components/site/cartel/primitives";
import { FaqList, GrapheneNote, JsonLd, MoreLink, OrderCTA, PLink } from "@/components/privacy/blocks";
import { PriceBoard } from "@/components/privacy/CatalogBlocks";
import { DeviceSilhouette } from "@/components/privacy/DeviceArt";
import { ApproxLine } from "@/components/privacy/Price";
import { SupportHorizon } from "@/components/privacy/SupportHorizon";
import { PrivacyMerviGuide } from "@/components/privacy/PrivacyMerviGuide";
import { PRIVACY_NAME, privacyMetadata, privacyUrl, quoteLabel, usdt, usdtAmount, type Rates } from "@/components/privacy/site";
import { loadRates } from "@/components/privacy/rates-server";
import { CATEGORIES, DELIVERY, INSTALL_SERVICE, PAYMENT, PHONE_BUNDLE, productsIn } from "@/lib/privacy/catalog";
import { SITE_URL } from "@/lib/seo/site";

export const metadata = privacyMetadata({
  path: "/",
  title: "Mercav Privacy — billeteras frías y celulares con sistema reforzado",
  description:
    "Un nivel más de privacidad: billeteras frías Ledger, Trezor y Tangem selladas de fábrica, y Google Pixel con un sistema reforzado basado en GrapheneOS. Precios más bajos de Bolivia, a pedido, con envíos a todo el país.",
});

const [weeksMin, weeksMax] = DELIVERY.weeks;

/** Los tres tipos de equipo, parados sobre la misma regla, con lo que los protege. */
function HeroVisual() {
  const items = [
    { kind: "card" as const, name: "Tangem", detail: "Tarjetas NFC, sin batería", art: "w-full max-w-[13rem]" },
    { kind: "slate" as const, name: "Trezor y Ledger", detail: "Chip Secure Element", art: "w-[72%] max-w-[8.5rem]" },
    { kind: "phone" as const, name: "Google Pixel", detail: "Titan M2 y arranque verificado", art: "w-[78%] max-w-[11rem]" },
  ];
  return (
    <figure className="w-full">
      <div className="grid grid-cols-[1.3fr_0.9fr_1fr] items-end gap-4 border-b-2 border-[var(--c-text)] sm:gap-8">
        {items.map((it) => (
          <div key={it.kind} className="flex justify-center">
            <DeviceSilhouette kind={it.kind} className={it.art} />
          </div>
        ))}
      </div>
      <figcaption className="grid grid-cols-[1.3fr_0.9fr_1fr] gap-4 pt-3 sm:gap-8">
        {items.map((it) => (
          <span key={it.kind} className="flex flex-col gap-1">
            <span className="c-label text-[1rem] sm:text-[1.1rem]">{it.name}</span>
            <span className="text-[0.85rem] leading-snug text-[var(--c-soft)] sm:text-[0.9rem]">{it.detail}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** Cinta con las promesas de la tienda, corriendo. Las mismas promesas están escritas más abajo. */
function PromiseTape() {
  const items = [
    "Nunca te pedimos tu frase semilla",
    "Billeteras selladas de fábrica",
    "Sistema oficial firmado",
    "Verificalo vos",
    "Precios más bajos de Bolivia",
    "Envíos a toda Bolivia",
  ];
  const tape = (k: number) => (
    <ul key={k} className="flex shrink-0 items-center">
      {items.concat(items).map((t, i) => (
        <li key={`${t}-${i}`} className="c-display flex items-center gap-5 pr-5 text-[clamp(1.3rem,1rem+1.3vw,2.1rem)]">
          {t}
          <Starburst className="h-[0.5em] w-[0.5em]" />
        </li>
      ))}
    </ul>
  );
  return (
    <div aria-hidden className="relative flex h-[6rem] items-center overflow-hidden md:h-[7.5rem]">
      <div className="c-band c-marquee c-tape -mx-[5%] w-[110%] -rotate-[2deg] py-2.5" style={{ "--marquee-s": "56s" } as CSSProperties}>
        <div className="c-marquee-track">{[0, 1].map((k) => tape(k))}</div>
      </div>
    </div>
  );
}

const STEPS = [
  { title: "Elegís", body: "Billetera, celular o la instalación en tu Pixel. Todo se pide por encargo." },
  { title: "Pedís", body: "Por WhatsApp o por correo. Te confirmamos el total, con el envío, antes de pagar." },
  { title: "Pagás", body: "En SOL o XRP, o con QR en bolivianos. El monto se fija con la cotización del momento del pago." },
  { title: "Te llega", body: `En ${weeksMin} a ${weeksMax} semanas, a cualquier ciudad de Bolivia.` },
];

const PROMISES = [
  {
    title: "Nunca te vamos a pedir tu frase semilla.",
    body: "Ni por WhatsApp, ni por correo, ni en persona. Las claves las genera el propio dispositivo cuando lo configurás vos. Si alguien te pide tu frase en nuestro nombre, es una estafa.",
  },
  {
    title: "Billeteras selladas de fábrica.",
    body: "Llegan en su caja original, nunca abiertas ni inicializadas. La frase de recuperación la generás vos.",
  },
  {
    title: "El sistema oficial, firmado.",
    body: "Instalamos GrapheneOS desde su versión oficial firmada, sin modificaciones. Sobre esa base configuramos los perfiles, la VPN y la mensajería.",
  },
  {
    title: "Verificalo vos.",
    body: "Con la app Auditor comprobás por hardware que el sistema es el oficial y no fue alterado. Con Ledger Wallet, Trezor Suite o Tangem, que tu billetera es original.",
  },
];

const HOME_FAQ = [
  {
    q: "¿Ustedes ven mi frase semilla?",
    a: "No. Nunca. La billetera llega sellada y sin inicializar: las claves las genera el dispositivo cuando lo configurás vos, y no salen de ahí. Nunca te la vamos a pedir.",
  },
  {
    q: "¿Puedo verificar que el sistema es el oficial?",
    a: "Sí. Con la app Auditor hacés una atestación por hardware: el chip de seguridad del teléfono firma el estado del sistema y Auditor comprueba que es el oficial y que no fue alterado.",
  },
  {
    q: "¿Cuánto tarda un pedido?",
    a: `Todo es a pedido: de ${weeksMin} a ${weeksMax} semanas. ${DELIVERY.coverage}`,
  },
];

/** La cotización del momento, en una línea: 1 USDT, 1 SOL y 1 XRP. */
function RatesLine({ rates }: { rates: Rates }) {
  const bob = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parts: string[] = [];
  if (rates.usdtBob) parts.push(`1 USDT ≈ Bs ${bob.format(rates.usdtBob)}`);
  if (rates.solUsd) parts.push(`1 SOL ≈ ${bob.format(rates.solUsd)} USD`);
  if (rates.xrpUsd) parts.push(`1 XRP ≈ ${bob.format(rates.xrpUsd)} USD`);
  if (!parts.length) return null;
  const time = quoteLabel(rates);
  return (
    <p className="c-num text-[0.95rem] text-[var(--c-soft)]">
      {parts.join(" · ")}
      {time ? <span className="text-[var(--c-muted)]"> · {time}</span> : null}
    </p>
  );
}

export default async function PrivacyHome() {
  const rates = await loadRates();
  const wallets = productsIn("billeteras-frias");
  const phones = productsIn("celulares");
  const minWallet = Math.min(...wallets.map((p) => p.priceUsdt));
  const minPhone = Math.min(...phones.map((p) => p.priceUsdt));

  const data = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${privacyUrl("/")}#tienda`,
    name: PRIVACY_NAME,
    url: privacyUrl("/"),
    description: "Billeteras frías selladas de fábrica y celulares Google Pixel con un sistema reforzado basado en GrapheneOS.",
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "Bolivia" },
    paymentAccepted: "SOL, XRP, QR en bolivianos",
    email: "soporte@mercav.lat",
  };

  return (
    <>
      <JsonLd data={data} />

      <section aria-labelledby="privacy-title">
        <div className="c-container grid gap-14 pb-12 pt-10 md:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end lg:gap-16 lg:pb-16">
          <div>
            <FitLines
              id="privacy-title"
              lines={[
                { text: "Un nivel más", fit: 19.944 },
                // El renglón invertido lleva aire a los costados: su letra se achica lo mismo que ocupa ese aire.
                { text: "de privacidad.", fit: 17.06, className: "c-strip mt-[0.04em] px-[4cqi] py-[0.07em]" },
              ]}
              className="max-w-[40rem]"
            />
            <p className="c-lead mt-8">
              Billeteras frías selladas de fábrica y Google Pixel con un sistema reforzado basado en GrapheneOS. Para quien quiere sus claves fuera de
              internet y un teléfono con menos superficie de ataque.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PLink to="/billeteras-frias" className="c-btn">
                Billeteras frías
                <ArrowRight className="h-5 w-5" aria-hidden />
              </PLink>
              <PLink to="/celulares" className="c-btn c-btn-ghost">
                Celulares
              </PLink>
            </div>
            <div className="mt-5"><PrivacyMerviGuide /></div>
          </div>
          {/* slot: FloatingWallet (la pieza visual del hero: reemplazar HeroVisual por el componente interactivo) */}
          <HeroVisual />
        </div>
      </section>

      <PromiseTape />

      <CartelSection labelledBy="home-billeteras">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 id="home-billeteras" className="c-h2">
              Billeteras frías.
            </h2>
            <p className="c-lead">{CATEGORIES["billeteras-frias"].lead}</p>
            <p className="c-body">
              Ledger, Trezor y Tangem, desde {usdt(minWallet)}. La frase de recuperación la generás vos, y comprobás que el equipo es original con la app
              oficial de cada marca.
            </p>
            <MoreLink to="/billeteras-frias">Ver las billeteras</MoreLink>
          </div>
          <div className="flex flex-col gap-4">
            <PriceBoard products={wallets} detail={(p) => p.tagline} />
            <p className="text-[0.95rem] text-[var(--c-muted)]">Precios en USDT. El equivalente en bolivianos, SOL y XRP está en cada ficha.</p>
          </div>
        </div>
      </CartelSection>

      <CartelSection labelledBy="home-celulares" className="!pt-0">
        <div className="c-container">
          <div className="grid gap-6 border-t-2 border-[var(--c-line)] pt-16 md:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <h2 id="home-celulares" className="c-h2">
              Celulares con sistema reforzado.
            </h2>
            <div className="flex flex-col gap-5">
              <p className="c-lead">{CATEGORIES.celulares.lead}</p>
              <p className="c-body">
                Desde {usdt(minPhone)}, con {PHONE_BUNDLE.vpnMonths} meses de Mullvad VPN, dos perfiles y PIN de borrado. Lo que más pesa al elegir es hasta
                cuándo Google lo actualiza:
              </p>
            </div>
          </div>
          <h3 id="home-horizonte" className="c-label mt-12 text-[1.15rem] md:mt-16">
            Actualizaciones de seguridad de Google, contadas desde hoy
          </h3>
          <div className="mt-4">
            <SupportHorizon products={phones} labelledBy="home-horizonte" />
          </div>
          <MoreLink to="/celulares" className="mt-8">
            Ver los celulares y qué trae cada uno
          </MoreLink>
        </div>
      </CartelSection>

      <section aria-labelledby="home-instalacion" className="c-band">
        <div className="c-container grid gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 id="home-instalacion" className="c-h2 !leading-[0.98]">
              ¿Ya tenés un Pixel?
            </h2>
            <p className="max-w-[34rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
              {CATEGORIES.instalacion.lead} Pixel 6 o posterior: el mismo sistema, los mismos perfiles, Session, el PIN de borrado y {INSTALL_SERVICE.vpnMonths}{" "}
              meses de Mullvad VPN.
            </p>
          </div>
          <div className="flex flex-col gap-5 lg:pb-2">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="c-display c-num text-[clamp(3.25rem,2.4rem+3.4vw,5.5rem)] leading-[0.9]">{usdtAmount(INSTALL_SERVICE.priceUsdt)}</span>
              <span className="c-label text-[1.5rem]">USDT</span>
            </p>
            <ApproxLine priceUsdt={INSTALL_SERVICE.priceUsdt} rates={rates} withTime />
            <PLink to="/instalacion" className="c-btn c-btn-ink w-fit">
              Cómo es la instalación
              <ArrowRight className="h-5 w-5" aria-hidden />
            </PLink>
          </div>
        </div>
      </section>

      <CartelSection labelledBy="home-precio">
        <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <FitLines
            as="h2"
            id="home-precio"
            lines={[
              { text: "Precios más bajos", fit: 13.879 },
              { text: "de Bolivia.", fit: 25.089, className: "c-hollow" },
            ]}
            className="max-w-[44rem]"
          />
          <div className="flex flex-col gap-5 lg:pb-3">
            <p className="text-[clamp(1.375rem,1.1rem+1vw,1.875rem)] font-semibold leading-snug text-[var(--c-text)] [text-wrap:balance]">
              Si lo encontrás más barato en el país, te lo igualamos.
            </p>
            <p className="c-body">Escribinos con el producto y dónde lo viste.</p>
          </div>
        </div>
      </CartelSection>

      <CartelSection labelledBy="home-compra" className="!pt-0">
        <div className="c-container">
          <div className="grid gap-6 border-t-2 border-[var(--c-line)] pt-16 md:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <h2 id="home-compra" className="c-h2">
              Todo a pedido.
            </h2>
            <p className="c-lead">
              De {weeksMin} a {weeksMax} semanas. {DELIVERY.coverage}
            </p>
          </div>
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
          <div className="mt-12 flex flex-col gap-3 md:mt-16">
            <p className="text-[1.0625rem] leading-relaxed text-[var(--c-text)]">
              Pagás en {PAYMENT.cryptos.join(" o ")}
              {PAYMENT.qrByWhatsApp ? ", o con QR en bolivianos coordinando por WhatsApp" : ""}.
            </p>
            <RatesLine rates={rates} />
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
              <MoreLink to="/pagos">Cómo pagar</MoreLink>
              <MoreLink to="/envios">Envíos y aduana</MoreLink>
            </div>
          </div>
        </div>
      </CartelSection>

      <section aria-labelledby="home-confianza" className="c-inverse">
        <div className="c-container py-20 md:py-28">
          <h2 id="home-confianza" className="c-h2 max-w-[14ch]">
            Lo que no negociamos.
          </h2>
          <ul className="mt-12 border-t-2 border-[var(--c-text)] md:mt-16">
            {PROMISES.map((p) => (
              <li key={p.title} className="grid gap-3 border-b-2 border-[var(--c-line)] py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14 md:py-9">
                <h3 className="c-h3">{p.title}</h3>
                <p className="c-body md:pt-1">{p.body}</p>
              </li>
            ))}
          </ul>
          <GrapheneNote className="mt-8" />
        </div>
      </section>

      <CartelSection labelledBy="home-dudas">
        <div className="c-container grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="flex flex-col gap-8">
            <h2 id="home-dudas" className="c-h2">
              ¿Dudas?
            </h2>
            <OrderCTA ask />
          </div>
          <div className="flex flex-col gap-6">
            <FaqList items={HOME_FAQ} withSchema={false} />
            <MoreLink to="/preguntas-frecuentes">Todas las preguntas</MoreLink>
          </div>
        </div>
      </CartelSection>
    </>
  );
}
// creado por pato dev y askforvini
