"use client";

import Link from "next/link";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { ArrowRight, Search, X } from "@/components/icons";
import { fieldClass } from "@/components/kosher/ui";
import { SIDUR, SIDUR_CATEGORIES, matchesSearch, sidurSearchText, type SidurCategoryId, type SidurEntry } from "@/lib/kosher/sidur";
import { cn } from "@/lib/utils";
import { BerajaText } from "./BerajaText";

type Filter = SidurCategoryId | "todas";

const INDEX = SIDUR.map((entry) => ({ entry, text: sidurSearchText(entry) }));

/** Buscador y filtro por momento del sidur. Busca sin tildes ni nikud, en hebreo, transliteración o español. */
export function SidurBrowser() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const deferred = useDeferredValue(query);
  const inputId = useId();

  const results = useMemo(
    () => INDEX.filter(({ entry, text }) => (filter === "todas" || entry.category === filter) && matchesSearch(text, deferred)).map((x) => x.entry),
    [deferred, filter],
  );

  const groups = SIDUR_CATEGORIES.map((c) => ({ ...c, items: results.filter((e) => e.category === c.id) })).filter((g) => g.items.length > 0);
  const options: { id: Filter; label: string }[] = [{ id: "todas", label: "Todas" }, ...SIDUR_CATEGORIES];

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="relative max-w-xl">
          <label htmlFor={inputId} className="sr-only">
            Buscar una bendición
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscá: pan, viaje, velas, Hamotzí…"
            autoComplete="off"
            spellCheck={false}
            className={cn(fieldClass, "w-full pl-11 pr-11 [&::-webkit-search-cancel-button]:appearance-none")}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar la búsqueda"
              className="mv-focus absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <div role="group" aria-label="Momento" className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <ul className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
            {options.map((o) => {
              const active = filter === o.id;
              return (
                <li key={o.id} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(o.id)}
                    className={cn(
                      "mv-focus inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                      active
                        ? "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/40"
                        : "border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-techelet/40 hover:text-[var(--text-primary)]",
                    )}
                  >
                    {o.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p aria-live="polite" className="text-sm text-[var(--text-secondary)]">
          {results.length === 1 ? "1 bendición" : `${results.length} bendiciones`}
          {deferred.trim() ? ` con «${deferred.trim()}»` : ""}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
          No encontramos nada con esa búsqueda. Probá con otra palabra, o elegí «Todas».
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-14">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`sidur-${g.id}`}>
              <h2 id={`sidur-${g.id}`} className="mv-h3">
                {g.label}
              </h2>
              <ul className="mt-5 grid items-start gap-4 lg:grid-cols-2">
                {g.items.map((entry) => (
                  <li key={entry.slug}>
                    <SidurCard entry={entry} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SidurCard({ entry }: { entry: SidurEntry }) {
  return (
    <article aria-labelledby={`b-${entry.slug}`} className="mv-panel p-5 md:p-6">
      <h3 id={`b-${entry.slug}`} className="mv-h3">
        <Link href={`/kosher/sidur/${entry.slug}`} className="mv-focus rounded hover:underline">
          {entry.name}
        </Link>
      </h3>
      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{entry.about}</p>
      <div className="mt-5">
        <BerajaText entry={entry} />
      </div>
      <p className="mt-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Cuándo se dice. </span>
        {entry.when}
      </p>
      {entry.partial && <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">{entry.partial}</p>}
      <Link
        href={`/kosher/sidur/${entry.slug}`}
        className="mv-focus -ml-2 mt-3 inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold text-techelet hover:underline"
        aria-label={`${entry.name}: costumbres, variantes y fuente`}
      >
        Costumbres y fuente <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </article>
  );
}
// creado por pato dev y askforvini
