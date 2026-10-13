import { approxAmounts, hasRates, quoteLabel, usdtAmount, type Rates } from "@/components/privacy/site";
import { cn } from "@/lib/utils";

/*
 * Precio en USDT (el del catálogo, "desde") y su equivalente aproximado en bolivianos, SOL y XRP. Sin cotización,
 * los montos aproximados no salen y queda solo el precio en USDT.
 */

/** "desde 189,99 USDT", en una línea. */
export function PriceInline({ priceUsdt, className }: { priceUsdt: number; className?: string }) {
  return (
    <span className={cn("c-num whitespace-nowrap", className)}>
      <span className="text-[0.85em] font-normal text-[var(--c-muted)]">desde </span>
      <span className="font-semibold text-[var(--c-text)]">{usdtAmount(priceUsdt)}</span>
      <span className="text-[0.85em] font-normal text-[var(--c-soft)]"> USDT</span>
    </span>
  );
}

/** "≈ Bs 1.322 · ≈ 1,12 SOL · ≈ 78 XRP", con la hora de la cotización si se pide. */
export function ApproxLine({ priceUsdt, rates, withTime, className }: { priceUsdt: number; rates: Rates; withTime?: boolean; className?: string }) {
  const parts = approxAmounts(priceUsdt, rates);
  if (!parts.length) return null;
  const time = withTime ? quoteLabel(rates) : null;
  return (
    <p className={cn("c-num text-[0.95rem] leading-snug text-[var(--c-soft)]", className)}>
      {parts.map((p, i) => (
        <span key={p} className="whitespace-nowrap">
          {i > 0 ? <span aria-hidden className="text-[var(--c-muted)]"> · </span> : null}
          {p}
        </span>
      ))}
      {time ? <span className="text-[var(--c-muted)]"> · {time}</span> : null}
    </p>
  );
}

/** El precio grande de una ficha. */
export function PriceBlock({ priceUsdt, rates, className }: { priceUsdt: number; rates: Rates; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="c-label text-[1.15rem] text-[var(--c-soft)]">Desde</span>
        <span className="c-display c-num text-[clamp(3rem,2.2rem+3vw,4.75rem)] leading-[0.9]">{usdtAmount(priceUsdt)}</span>
        <span className="c-label text-[1.5rem]">USDT</span>
      </p>
      {hasRates(rates) ? (
        <ApproxLine priceUsdt={priceUsdt} rates={rates} withTime />
      ) : (
        <p className="text-[0.95rem] leading-snug text-[var(--c-soft)]">El equivalente en bolivianos, SOL o XRP te lo pasamos al pedir, con la cotización del momento.</p>
      )}
    </div>
  );
}

/** Nota de la cotización para una lista de precios: una sola vez, arriba de la lista. */
export function QuoteNote({ rates, className }: { rates: Rates; className?: string }) {
  const time = quoteLabel(rates);
  return (
    <p className={cn("text-[0.95rem] leading-relaxed text-[var(--c-muted)]", className)}>
      {hasRates(rates)
        ? `Precios en USDT. Los montos en bolivianos, SOL y XRP son aproximados${time ? `, con la ${time}` : ""}; el monto final se fija al pagar.`
        : "Precios en USDT. El equivalente en bolivianos, SOL o XRP se calcula con la cotización del momento y se fija al pagar."}
    </p>
  );
}
// creado por pato dev y askforvini
