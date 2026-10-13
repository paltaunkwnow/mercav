import { OrderCTA, PLink } from "@/components/privacy/blocks";
import { DocPage, DocSection } from "@/components/privacy/Doc";
import { SUPPORT_EMAIL, hasRates, privacyMetadata, quoteLabel, type Rates } from "@/components/privacy/site";
import { loadRates } from "@/components/privacy/rates-server";
import { PAYMENT } from "@/lib/privacy/catalog";

export const metadata = privacyMetadata({
  path: "/pagos",
  title: "Pagos en SOL, XRP o QR en bolivianos",
  description:
    "Cómo pagar en Mercav Privacy: en SOL, en XRP o con QR en bolivianos coordinando por WhatsApp. El precio está en USDT y el monto se fija con la cotización del momento del pago.",
});

const two = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** La cotización que usan los precios de la tienda, en este momento. */
function RatesTable({ rates }: { rates: Rates }) {
  const rows = [
    { label: "1 USDT", value: rates.usdtBob ? `Bs ${two.format(rates.usdtBob)}` : null },
    { label: "1 SOL", value: rates.solUsd ? `${two.format(rates.solUsd)} USD` : null },
    { label: "1 XRP", value: rates.xrpUsd ? `${two.format(rates.xrpUsd)} USD` : null },
  ];
  const time = quoteLabel(rates);
  return (
    <figure className="flex flex-col gap-3">
      <dl className="border-t-2 border-[var(--c-line-strong)]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-6 border-b-2 border-[var(--c-line)] py-3">
            <dt className="c-label text-[1.15rem]">{r.label}</dt>
            <dd className="c-num text-[1.0625rem] font-semibold text-[var(--c-text)]">{r.value ?? "sin dato ahora"}</dd>
          </div>
        ))}
      </dl>
      <figcaption className="text-[0.9rem] leading-relaxed text-[var(--c-muted)]">
        {[time ? `Es la ${time}, hora de Bolivia` : null, rates.source ? `Fuente: ${rates.source}` : null].filter(Boolean).join(". ")}
        {time || rates.source ? "." : null} El USDT se toma 1 a 1 con el dólar.
      </figcaption>
    </figure>
  );
}

export default async function PaymentsPage() {
  const rates = await loadRates();
  const methods = [...PAYMENT.cryptos, ...(PAYMENT.qrByWhatsApp ? ["QR en bolivianos"] : [])];

  return (
    <DocPage
      id="pagos-title"
      title="Pagos."
      lead={`Pagás en ${methods.slice(0, -1).join(", ")} o ${methods[methods.length - 1]}. El precio de cada producto está en USDT; el monto que pagás se fija con la cotización del momento del pago.`}
    >
      <DocSection title="La cotización, ahora">
        {hasRates(rates) ? (
          <RatesTable rates={rates} />
        ) : (
          <p>La cotización no está disponible en este momento. Te la pasamos al confirmar el pedido, junto con el monto exacto.</p>
        )}
      </DocSection>

      <DocSection title="En SOL o XRP">
        <p>
          Te damos la dirección y la red <strong>en cada pedido</strong>, por el mismo canal en el que lo hiciste. No publicamos direcciones de pago en este
          sitio.
        </p>
        <p>
          El monto en SOL o XRP sale del precio en USDT con la cotización del momento en que pagás, y queda fijo ahí: si la cotización cambia después, no te
          pedimos diferencia ni te la devolvemos.
        </p>
        <ul>
          <li>Antes de enviar, compará la dirección completa, no solo el principio y el final.</li>
          <li>Si para XRP te damos un destination tag, incluilo en el envío.</li>
          <li>Para cobrarte nunca necesitamos tu frase semilla ni tus claves privadas.</li>
        </ul>
      </DocSection>

      {PAYMENT.qrByWhatsApp ? (
        <DocSection title="Con QR en bolivianos">
          <p>
            Lo coordinamos por WhatsApp: te mandamos un QR por el monto en bolivianos, calculado con la cotización del momento, y pagás desde la app de tu
            banco.
          </p>
          {PAYMENT.whatsapp ? null : (
            <p>
              Para empezar, escribinos a{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="c-link">
                {SUPPORT_EMAIL}
              </a>{" "}
              y seguimos por WhatsApp.
            </p>
          )}
        </DocSection>
      ) : null}

      <DocSection title="Cuándo pagás">
        <p>
          Cuando te confirmamos el total: el producto, el envío y, si corresponde, los costos de importación. Con eso aceptado, pagás y hacemos el pedido.
          Los plazos están en <PLink to="/envios" className="c-link">Envíos</PLink>.
        </p>
      </DocSection>

      <DocSection title="Pedir">
        <OrderCTA />
      </DocSection>
    </DocPage>
  );
}
// creado por pato dev y askforvini
