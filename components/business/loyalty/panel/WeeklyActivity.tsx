import type { WeeklyPoint } from "@/lib/business/loyalty/stats-core";

/** Barras de actividad por semana (sin librerías) y una tabla para lectores de pantalla. */
export function WeeklyActivity({ weekly }: { weekly: WeeklyPoint[] }) {
  const max = Math.max(1, ...weekly.map((w) => Math.max(w.visits, w.redeems)));
  const total = weekly.reduce((n, w) => n + w.visits, 0);
  const pct = (v: number) => `${Math.round((v / max) * 100)}%`;

  return (
    <figure className="flex flex-col gap-4">
      <div aria-hidden className="flex h-48 items-stretch gap-1.5 sm:gap-2.5">
        {weekly.map((w, i) => (
          <div key={w.from} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">{w.visits || ""}</span>
            <div className="flex w-full flex-1 items-end justify-center gap-[3px]">
              <span
                className={i === weekly.length - 1 ? "w-full max-w-[1.4rem] rounded-t-md bg-gold" : "w-full max-w-[1.4rem] rounded-t-md bg-gold/60"}
                style={{ height: pct(w.visits), minHeight: w.visits ? 3 : 0 }}
              />
              <span className="w-full max-w-[0.55rem] rounded-t-md bg-[var(--text-tertiary)] opacity-60" style={{ height: pct(w.redeems), minHeight: w.redeems ? 3 : 0 }} />
            </div>
            <span className="w-full truncate text-center text-[10px] text-[var(--text-tertiary)]">{w.label}</span>
          </div>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-gold" />
          Visitas con suma
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[var(--text-tertiary)] opacity-60" />
          Canjes
        </span>
        <span className="ml-auto text-[var(--text-tertiary)]">{total ? `${total} visitas en 8 semanas` : "Sin movimiento todavía"}</span>
      </figcaption>
      <table className="sr-only">
        <caption>Actividad por semana, últimas 8 semanas</caption>
        <thead>
          <tr>
            <th scope="col">Semana desde</th>
            <th scope="col">Visitas con suma</th>
            <th scope="col">Canjes</th>
          </tr>
        </thead>
        <tbody>
          {weekly.map((w) => (
            <tr key={w.from}>
              <th scope="row">{w.label}</th>
              <td>{w.visits}</td>
              <td>{w.redeems}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
// creado por pato dev y askforvini
