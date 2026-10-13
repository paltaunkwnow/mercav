import type { CSSProperties } from "react";
import { PLink } from "@/components/privacy/blocks";
import { PriceInline } from "@/components/privacy/Price";
import type { PrivacyProduct } from "@/lib/privacy/catalog";

/*
 * Hasta cuándo Google actualiza cada celular, contado desde hoy: una barra por modelo, del día de hoy al fin del mes
 * que dice el catálogo. Una sola serie, en la tinta del cartel; la fecha va escrita en la punta de cada barra.
 */

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "agosto de 2032" → fin de agosto de 2032 (UTC). null si el texto no se entiende. */
function endOf(text: string) {
  const m = text.trim().toLowerCase().match(/^([a-záéíóú]+) de (\d{4})$/);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  if (!m || month < 0) return null;
  return { at: Date.UTC(Number(m[2]), month + 1, 1) - 1, short: `${SHORT[month]} ${m[2]}` };
}

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

export function SupportHorizon({ products, labelledBy, now = new Date() }: { products: PrivacyProduct[]; labelledBy: string; now?: Date }) {
  const rows = products
    .flatMap((p) => {
      const end = p.securityUpdatesUntil ? endOf(p.securityUpdatesUntil) : null;
      return end ? [{ p, ...end }] : [];
    })
    .sort((a, b) => b.at - a.at || b.p.priceUsdt - a.p.priceUsdt);
  if (!rows.length) return null;

  const start = now.getTime();
  // El eje llega un año y pico después del último fin de soporte: deja lugar para la fecha en la punta.
  const lastYear = new Date(rows[0].at).getUTCFullYear();
  const end = Date.UTC(lastYear + 2, 0, 1);
  const span = end - start;
  const pos = (t: number) => Math.min(1, Math.max(0, (t - start) / span));
  const ticks: number[] = [];
  for (let y = new Date(start).getUTCFullYear() + 1; y <= lastYear + 1; y++) {
    // Un año pegado al borde no se puede rotular sin salirse del eje.
    const at = pos(Date.UTC(y, 0, 1));
    if (at > 0.05 && at < 0.95) ticks.push(y);
  }

  return (
    <figure aria-labelledby={labelledBy} className="w-full">
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div aria-hidden className="hidden md:block" />
        <div aria-hidden className="relative h-7 text-[0.85rem] text-[var(--c-muted)]">
          {ticks.map((y) => (
            <span key={y} className="c-num absolute bottom-1 -translate-x-1/2 whitespace-nowrap" style={{ left: `${pos(Date.UTC(y, 0, 1)) * 100}%` }}>
              {y}
            </span>
          ))}
        </div>
      </div>
      <ul className="border-t-2 border-[var(--c-line-strong)]">
        {rows.map(({ p, at, short }) => {
          const years = Math.max(0, (at - start) / YEAR_MS);
          const width = pos(at) * 100;
          return (
            <li key={p.slug} className="border-b-2 border-[var(--c-line)]">
              <PLink
                to={`/producto/${p.slug}`}
                className="group grid grid-cols-1 items-center gap-x-8 gap-y-2 rounded-[2px] py-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
              >
                <span className="flex items-baseline justify-between gap-3 md:flex-col md:items-start md:gap-0.5">
                  <span className="text-[1.0625rem] font-semibold leading-snug underline-offset-[0.2em] group-hover:underline group-hover:decoration-2">
                    {p.name.replace(/^Google /, "")}
                    {p.condition === "reacondicionado" ? <span className="font-normal text-[var(--c-soft)]"> · reacondicionado</span> : null}
                  </span>
                  <PriceInline priceUsdt={p.priceUsdt} className="text-[0.95rem]" />
                </span>
                <span className="relative block h-6" style={{ "--w": `${width}%` } as CSSProperties}>
                  {ticks.map((y) => (
                    <span key={y} aria-hidden className="absolute inset-y-0 w-px bg-[var(--c-line)]" style={{ left: `${pos(Date.UTC(y, 0, 1)) * 100}%` }} />
                  ))}
                  <span aria-hidden className="absolute left-0 top-1/2 h-3.5 min-w-1 -translate-y-1/2 rounded-r-[4px] bg-[var(--c-text)]" style={{ width: "var(--w)" }} />
                  <span
                    aria-hidden
                    className="c-num absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-2 text-[0.9rem] font-semibold"
                    style={{ left: "var(--w)" }}
                  >
                    {short}
                  </span>
                  <span className="sr-only">
                    Actualizaciones de Google hasta {p.securityUpdatesUntil}
                    {years >= 1 ? `, unos ${Math.floor(years)} años desde hoy` : ""}.
                  </span>
                </span>
              </PLink>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
// creado por pato dev y askforvini
