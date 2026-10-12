"use client";

import { useId, useMemo, useState } from "react";
import { BadgeCheck, Ban, Scale, Search, X } from "@/components/icons";
import { FISH, FISH_SOURCES, FISH_STATUS, FISH_STATUS_ORDER, foldText, type Fish, type FishStatus } from "@/lib/kosher/fish";
import { fieldClass } from "@/components/kosher/ui";
import { cn } from "@/lib/utils";

const STATUS_ICON = { kosher: BadgeCheck, not_kosher: Ban, disputed: Scale } as const satisfies Record<FishStatus, unknown>;

const STATUS_CLASS: Record<FishStatus, string> = {
  kosher: "bg-[#2ee06f]/15 text-[#5ff09a] ring-[#2ee06f]/25 [.light_&]:bg-[#00773f]/10 [.light_&]:text-[#00773f] [.light_&]:ring-[#00773f]/25",
  not_kosher: "bg-red-500/10 text-red-500 ring-red-500/25 [.light_&]:text-red-700",
  disputed: "bg-amber-500/10 text-amber-500 ring-amber-500/30 [.light_&]:text-amber-700",
};

/** Ícono y palabra, nunca solo color (igual que StatusBadge). */
function FishStatusBadge({ status }: { status: FishStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset", STATUS_CLASS[status])}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {FISH_STATUS[status]}
    </span>
  );
}

/** Nombres (comunes y científicos) por un lado y todo el texto por otro, para ordenar primero lo que coincide por nombre. */
function indexEntry(f: Fish) {
  const names = foldText(`${f.name} ${(f.also ?? []).map((n) => `${n.name} ${n.where ?? ""}`).join(" ")} ${f.scientific.join(" ")}`);
  return { fish: f, names, text: `${names} ${foldText(f.note)}` };
}

function FishCard({ fish }: { fish: Fish }) {
  return (
    <li id={fish.id} className="mv-panel flex scroll-mt-28 flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="mv-h3 min-w-0">{fish.name}</h3>
        <FishStatusBadge status={fish.status} />
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {fish.scientific.map((s, i) => (
          <span key={s}>
            {i > 0 && " · "}
            <i lang="la">{s}</i>
          </span>
        ))}
      </p>
      {fish.also && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">
          <span className="text-[var(--text-secondary)]">También: </span>
          {fish.also.map((n, i) => (
            <span key={`${n.name}-${n.where ?? ""}`}>
              {i > 0 && ", "}
              {n.name}
              {n.where && <span className="text-[var(--text-secondary)]"> ({n.where})</span>}
            </span>
          ))}
        </p>
      )}
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{fish.note}</p>
      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        Fuentes:{" "}
        {fish.sources.map((key, i) => (
          <span key={key}>
            {i > 0 && " · "}
            <a href={`#fuente-${key}`} className="mv-link">
              {FISH_SOURCES[key].short}
            </a>
          </span>
        ))}
      </p>
    </li>
  );
}

/** Buscador de la guía de pescados: cualquier nombre o nombre científico, sin importar tildes, y filtro por estado. */
export function FishFinder() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FishStatus | "all">("all");
  const index = useMemo(() => FISH.map(indexEntry), []);
  const counts = useMemo(() => {
    const out = { all: FISH.length, kosher: 0, not_kosher: 0, disputed: 0 };
    for (const f of FISH) out[f.status] += 1;
    return out;
  }, []);

  const terms = foldText(query).split(/\s+/).filter(Boolean);
  const visible = index
    .filter(({ fish, text }) => (status === "all" || fish.status === status) && terms.every((t) => text.includes(t)))
    .map((entry) => ({ fish: entry.fish, rank: terms.every((t) => foldText(entry.fish.name).includes(t)) ? 0 : terms.every((t) => entry.names.includes(t)) ? 1 : 2 }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ fish }) => fish);

  const filters: { key: FishStatus | "all"; label: string }[] = [{ key: "all", label: "Todos" }, ...FISH_STATUS_ORDER.map((key) => ({ key, label: FISH_STATUS[key] }))];

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Buscá por cualquier nombre
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden />
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Merluza, corvina, abadejo, Merluccius…"
              autoComplete="off"
              spellCheck={false}
              className={cn(fieldClass, "w-full !pl-11 !pr-12 [&::-webkit-search-cancel-button]:appearance-none")}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mv-focus absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Borrar la búsqueda"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div role="group" aria-label="Filtrar por estado" className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {filters.map((f) => {
            const active = status === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "mv-focus inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                  active
                    ? "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/40"
                    : "border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-techelet/40 hover:text-[var(--text-primary)]",
                )}
              >
                {f.label}
                <span className="mv-data text-xs opacity-80">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-[var(--text-secondary)]" aria-live="polite">
          {visible.length === 1 ? "1 pescado" : `${visible.length} pescados`}
          {query.trim() ? ` para «${query.trim()}»` : ""}
        </p>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((f) => (
            <FishCard key={f.id} fish={f} />
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-[1.5rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-12 text-center">
          <p className="mv-h3">No lo tenemos en la guía</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Que no figure no quiere decir que sea kosher ni que no lo sea. Probá con otro nombre o con el científico, y si sigue sin aparecer, consultá a tu
            rabino o a la agencia de tu país.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
            className="mv-link mt-5 text-sm font-semibold"
          >
            Ver toda la guía
          </button>
        </div>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
