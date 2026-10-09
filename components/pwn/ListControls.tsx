"use client";

import { ChevronLeft, ChevronRight, Search } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { pwnFieldClass, pwnFieldLabelClass } from "@/components/pwn/format";
import { PwnSelect } from "@/components/pwn/PwnSelect";

export function ListControls({
  query,
  onQuery,
  queryLabel,
  filter,
  onFilter,
  filterLabel,
  filterOptions,
  sort,
  onSort,
  sortOptions,
  page,
  pages,
  total,
  onPage,
}: {
  query: string;
  onQuery: (value: string) => void;
  queryLabel: string;
  filter?: string;
  onFilter?: (value: string) => void;
  filterLabel?: string;
  filterOptions?: { value: string; label: string }[];
  sort: string;
  onSort: (value: string) => void;
  sortOptions: { value: string; label: string }[];
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mv-panel mb-5 space-y-4 p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <label htmlFor="pwn-list-query" className={pwnFieldLabelClass}>
            {queryLabel}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
            <input
              id="pwn-list-query"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              className={`${pwnFieldClass} pl-10`}
              type="search"
              autoComplete="off"
            />
          </div>
        </div>
        {filterOptions && onFilter ? (
          <div className="space-y-2">
            <label htmlFor="pwn-list-filter" className={pwnFieldLabelClass}>
              {filterLabel ?? "Filtro"}
            </label>
            <PwnSelect
              id="pwn-list-filter"
              value={filter ?? filterOptions[0]?.value ?? ""}
              onValueChange={onFilter}
              options={filterOptions}
              aria-label={filterLabel ?? "Filtro"}
            />
          </div>
        ) : null}
        <div className={`space-y-2 ${filterOptions && onFilter ? "" : "md:col-span-2"}`}>
          <label htmlFor="pwn-list-sort" className={pwnFieldLabelClass}>
            Orden
          </label>
          <PwnSelect id="pwn-list-sort" value={sort} onValueChange={onSort} options={sortOptions} aria-label="Orden" />
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="mv-data font-semibold text-[var(--text-primary)]">{total}</span> {total === 1 ? "registro" : "registros"}
        </p>
        <nav aria-label="Paginación" className="flex items-center justify-between gap-2 sm:justify-end">
          <button type="button" className={buttonClass("secondary", "sm", "min-h-11 px-3")} onClick={() => onPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Anterior
          </button>
          <span aria-live="polite" className="px-2 text-xs">
            Página <span className="mv-data text-[var(--text-primary)]">{page}</span> de <span className="mv-data">{pages}</span>
          </span>
          <button type="button" className={buttonClass("secondary", "sm", "min-h-11 px-3")} onClick={() => onPage(page + 1)} disabled={page >= pages}>
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      </div>
    </div>
  );
}

export function pageWindow<T>(items: T[], page: number, pageSize = 6) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  return { page: current, pages, total: items.length, slice: items.slice(start, start + pageSize) };
}
// creado por pato dev y askforvini
