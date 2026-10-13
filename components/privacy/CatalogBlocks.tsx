import { AlertTriangle, ArrowRight } from "@/components/icons";
import { PLink } from "@/components/privacy/blocks";
import { DeviceArt } from "@/components/privacy/DeviceArt";
import { ApproxLine, PriceInline } from "@/components/privacy/Price";
import { usdt, type Rates } from "@/components/privacy/site";
import type { PrivacyProduct } from "@/lib/privacy/catalog";
import { cn } from "@/lib/utils";

/*
 * El catálogo en pantalla: la lista de precios con renglones de puntos (portada), los renglones de cada categoría y
 * la tabla para comparar celulares. Todo sale de lib/privacy/catalog.ts.
 */

/**
 * "Reacondicionado" va invertido para que no pase de largo; "Nuevo" va en la letra de las etiquetas, y solo donde
 * conviven equipos nuevos y reacondicionados.
 */
export function ConditionTag({ product, className }: { product: PrivacyProduct; className?: string }) {
  if (product.condition === "reacondicionado") {
    return <span className={cn("c-label c-strip inline-flex w-fit px-2 py-1 text-[0.95rem]", className)}>Reacondicionado</span>;
  }
  return <span className={cn("c-label inline-flex w-fit rounded-[2px] px-2 py-1 text-[0.95rem] shadow-[inset_0_0_0_2px_var(--c-line-strong)]", className)}>Nuevo</span>;
}

/** Aviso destacado de un producto (el soporte extendido del Pixel 6). */
export function ProductWarning({ text, className }: { text: string; className?: string }) {
  return (
    <div role="note" className={cn("flex gap-3 rounded-[2px] p-4 shadow-[inset_0_0_0_2px_var(--c-text)]", className)}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p className="text-[0.95rem] leading-relaxed text-[var(--c-text)]">{text}</p>
    </div>
  );
}

/** Lista de precios de la portada: nombre, renglón de puntos y precio. */
export function PriceBoard({ products, detail }: { products: PrivacyProduct[]; detail?: (p: PrivacyProduct) => string | null }) {
  return (
    <ul className="border-t-2 border-[var(--c-line-strong)]">
      {products.map((p) => {
        const note = detail?.(p) ?? null;
        return (
          <li key={p.slug} className="border-b-2 border-[var(--c-line)]">
            <PLink to={`/producto/${p.slug}`} className="group flex items-baseline gap-3 rounded-[2px] py-4">
              <span className="flex min-w-0 flex-col gap-1">
                <span className="c-h3 !text-[clamp(1.35rem,1.1rem+0.8vw,1.75rem)] underline-offset-[0.2em] group-hover:underline group-hover:decoration-2">{p.name}</span>
                {note ? <span className="text-[0.9rem] leading-snug text-[var(--c-muted)]">{note}</span> : null}
              </span>
              <span aria-hidden className="hidden min-w-8 flex-1 -translate-y-[0.3em] border-b-2 border-dotted border-[var(--c-line-strong)] sm:block" />
              <PriceInline priceUsdt={p.priceUsdt} className="ml-auto shrink-0 text-[1.0625rem]" />
            </PLink>
          </li>
        );
      })}
    </ul>
  );
}

/** Un renglón de categoría: dibujo, datos y precio. Todo el renglón lleva a la ficha. */
function ProductRow({ product, rates, heading, showNew }: { product: PrivacyProduct; rates: Rates; heading: "h2" | "h3"; showNew: boolean }) {
  const H = heading;
  const p = product;
  return (
    <li className="relative grid gap-x-8 gap-y-5 border-b-2 border-[var(--c-line)] py-8 sm:grid-cols-[6.5rem_minmax(0,1fr)] md:py-10 lg:grid-cols-[8rem_minmax(0,1fr)_minmax(0,17rem)]">
      <DeviceArt product={p} className="h-16 w-16 sm:h-28 sm:w-[6.5rem] lg:h-32 lg:w-32" />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <H className="c-h3">
            <PLink to={`/producto/${p.slug}`} className="rounded-[2px] underline-offset-[0.2em] after:absolute after:inset-0 hover:underline hover:decoration-2">
              {p.name}
            </PLink>
          </H>
          {showNew || p.condition !== "nuevo" ? <ConditionTag product={p} /> : null}
        </div>
        <p className="c-body text-[var(--c-text)]">{p.tagline}</p>
        <dl className="grid gap-1 text-[0.95rem] leading-relaxed text-[var(--c-soft)]">
          <div>
            <dt className="sr-only">Datos</dt>
            <dd>{[p.storage, ...p.specs].filter(Boolean).join(" · ")}</dd>
          </div>
          {p.colors?.length ? (
            <div className="flex flex-wrap gap-x-1.5">
              <dt>{p.colors.length === 1 ? "Color:" : "Colores:"}</dt>
              <dd>{p.colors.join(", ")}</dd>
            </div>
          ) : null}
          {p.securityUpdatesUntil ? (
            <div className="flex flex-wrap gap-x-1.5">
              <dt>Actualizaciones de seguridad de Google hasta</dt>
              <dd className="font-semibold text-[var(--c-text)]">{p.securityUpdatesUntil}</dd>
            </div>
          ) : null}
          {p.conditionNote ? (
            <div>
              <dt className="sr-only">Estado</dt>
              <dd>{p.conditionNote}</dd>
            </div>
          ) : null}
        </dl>
        {p.warning ? <ProductWarning text={p.warning} className="relative z-[1] mt-1 max-w-[40rem]" /> : null}
      </div>
      <div className="flex flex-col gap-2 sm:col-start-2 lg:col-start-3 lg:items-end lg:text-right">
        <PriceInline priceUsdt={p.priceUsdt} className="text-[1.375rem]" />
        <ApproxLine priceUsdt={p.priceUsdt} rates={rates} />
        <span aria-hidden className="c-label mt-2 inline-flex items-center gap-1.5 text-[1.05rem]">
          Ver la ficha
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </li>
  );
}

export function ProductRows({ products, rates, heading = "h3", className }: { products: PrivacyProduct[]; rates: Rates; heading?: "h2" | "h3"; className?: string }) {
  const mixed = new Set(products.map((p) => p.condition)).size > 1;
  return (
    <ul className={cn("border-t-2 border-[var(--c-line-strong)]", className)}>
      {products.map((p) => (
        <ProductRow key={p.slug} product={p} rates={rates} heading={heading} showNew={mixed} />
      ))}
    </ul>
  );
}

const chipOf = (p: PrivacyProduct) => p.specs.find((s) => s.startsWith("Tensor")) ?? "—";
const hasMte = (p: PrivacyProduct) => p.specs.some((s) => s.includes("MTE"));

/** Los celulares lado a lado: chip, MTE, almacenamiento, hasta cuándo los actualiza Google y precio. */
export function PhoneTable({ products, captionId }: { products: PrivacyProduct[]; captionId: string }) {
  return (
    <table className="c-table" aria-labelledby={captionId}>
      <thead>
        <tr>
          <th scope="col">Modelo</th>
          <th scope="col">Chip</th>
          <th scope="col">MTE</th>
          <th scope="col">Almacenamiento</th>
          <th scope="col">Actualizaciones de Google hasta</th>
          <th scope="col" className="lg:text-right">
            Desde
          </th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.slug}>
            <td>
              <PLink to={`/producto/${p.slug}`} className="c-link">
                {p.name}
              </PLink>
              {p.condition === "reacondicionado" ? <span className="block text-[0.9rem] font-normal text-[var(--c-soft)]">Reacondicionado</span> : null}
            </td>
            <td data-label="Chip">{chipOf(p)}</td>
            <td data-label="MTE">{hasMte(p) ? "Sí" : "No"}</td>
            <td data-label="Almacenamiento">{p.storage ?? "—"}</td>
            <td data-label="Actualizaciones de Google hasta">
              {p.securityUpdatesUntil ?? "—"}
              {p.warning ? <span className="block text-[0.9rem] text-[var(--c-soft)]">Después, soporte extendido de GrapheneOS</span> : null}
            </td>
            <td data-label="Desde" className="whitespace-nowrap lg:text-right">
              {usdt(p.priceUsdt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
// creado por pato dev y askforvini
