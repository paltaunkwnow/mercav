import type { Metadata } from "next";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { FlipHint } from "@/components/site/cartel/FlipHint";
import { CartelSection } from "@/components/site/cartel/primitives";
import { FeatureGrid, MoreProducts, PricingBand, ProductFAQ, ProductHero } from "@/components/site/product/ProductBlocks";
import { BUSINESS_TYPES, defaultDesign } from "@/lib/business/loyalty/templates";
import { FREE_LIMITS } from "@/lib/checkPlanLimit";

export const metadata: Metadata = {
  title: "Tarjetas de fidelización para tu negocio: sellos y puntos",
  description: `Tarjetas de sellos o puntos con la marca de tu negocio. Tus clientes se suman con un QR en el mostrador, sin bajar nada. Listas para ${BUSINESS_TYPES.length} rubros, con premios, niveles y campañas.`,
};

const cafe = BUSINESS_TYPES.find((t) => t.key === "CAFE") ?? BUSINESS_TYPES[0];
const CAFE_DESIGN = defaultDesign(cafe, "Café La Esquina");

const STEPS = [
  { title: "Se suma con un QR", body: "El cliente escanea el cartel del mostrador y su tarjeta queda en el navegador. No baja nada ni necesita cuenta de Mercav." },
  { title: "Suma en cada compra", body: "Vos o tu equipo le dan el sello o los puntos desde Sellar, en el celular. También hay un modo mostrador para que lo haga el cliente." },
  { title: "Canjea su premio", body: "Cuando junta lo que pide un premio, lo canjea en el mostrador y se descuenta de su tarjeta." },
];

export default function FidelizacionPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <ProductHero
        id="fidelizacion-title"
        title={
          <>
            Tarjetas de fidelización <span className="c-text-yellow">con tu marca.</span>
          </>
        }
        lead={`Sellos o puntos para que tus clientes vuelvan. Se suman con un QR en el mostrador, sin bajar nada. Listas para ${BUSINESS_TYPES.length} rubros.`}
        demo={
          <div className="flex flex-col items-center gap-3">
            <div className="w-[17rem] rotate-[-4deg] sm:w-[19rem] motion-reduce:rotate-0">
              <LoyaltyCard design={CAFE_DESIGN} type="STAMPS" stampsGoal={10} rewardName={cafe.rewardName} balance={7} customerName="Lucía" side="flip" size="sm" className="w-full" />
            </div>
            <FlipHint />
          </div>
        }
      />

      <CartelSection labelledBy="fidelizacion-pasos" className="!pt-8 md:!pt-12">
        <div className="c-container">
          <h2 id="fidelizacion-pasos" className="c-h2">
            Así funciona.
          </h2>
          <ol className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 border-t-2 border-[var(--c-line)] pt-6">
                <span className="c-display c-num text-[3.5rem] leading-[0.8] text-[var(--c-yellow-text)]" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="c-h3">
                  <span className="sr-only">Paso {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="c-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </CartelSection>

      <FeatureGrid
        id="fidelizacion-funciones"
        title="Más que una tarjeta de sellos."
        items={[
          { title: "Sellos o puntos", body: "Elegí cómo suma cada cliente: un sello por compra o puntos según lo que gasta." },
          { title: "Premios y niveles", body: "Definí los premios y los niveles, con bonos por cumpleaños y por traer a un amigo." },
          { title: "Campañas", body: "Avisos y promociones para los clientes de tu tarjeta." },
          { title: "Cartel con QR y modo mostrador", body: "Imprimí el cartel con el QR para el mostrador y dejá que el cliente se sume y sume solo." },
          { title: "MercavClub", body: "Con su código de MercavClub, el cliente aparece en cualquier caja y guarda todas sus tarjetas en un solo lugar." },
          { title: "Apple Wallet y Google Wallet", body: "En camino. Hoy la tarjeta funciona en el navegador, sin bajar nada." },
        ]}
      />

      <CartelSection labelledBy="fidelizacion-rubros" className="!pt-4">
        <div className="c-container">
          <h2 id="fidelizacion-rubros" className="c-h2">
            {BUSINESS_TYPES.length} rubros listos.
          </h2>
          <p className="c-body mt-4 max-w-[34rem]">Cada uno arranca con su premio, su diseño y sus beneficios. Después lo cambiás como quieras.</p>
          <ul className="mt-10 flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((t) => (
              <li key={t.key} className="c-label rounded-full px-4 py-2 text-[1.05rem] shadow-[inset_0_0_0_2px_var(--c-line-strong)]">
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </CartelSection>

      <PricingBand free={`En el plan Gratis tenés ${FREE_LIMITS.loyaltyProgramsPerWorkspace} programa de fidelización por empresa, con clientes sin límite.`} />
      <ProductFAQ
        items={[
          { q: "¿Mis clientes tienen que bajar una app?", a: "No. Escanean el QR del mostrador y la tarjeta queda en el navegador del celular." },
          { q: "¿Necesitan una cuenta de Mercav?", a: "No. Si la tienen, guardan todas sus tarjetas en Mis tarjetas y las encontrás con su código de MercavClub." },
          { q: "¿Sirve para mi rubro?", a: `Hay ${BUSINESS_TYPES.length} rubros listos, de cafeterías y panaderías a gimnasios, farmacias y comercios kosher, y uno libre para el resto.` },
          { q: "¿Las tarjetas van a Apple Wallet o Google Wallet?", a: "Todavía no: están en camino. Hoy funcionan en el navegador, sin bajar nada." },
        ]}
      />
      <MoreProducts current="/fidelizacion" />
    </div>
  );
}
// creado por pato dev y askforvini
