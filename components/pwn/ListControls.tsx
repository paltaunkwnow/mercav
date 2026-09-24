"use client";

import { focusRing, pwnFieldClass, pwnFieldLabelClass, pwnPanelClass } from "@/components/pwn/format";

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
    <div className={`mb-5 space-y-4 ${pwnPanelClass}`}>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2 md:col-span-1">
          <label htmlFor="pwn-list-query" className={pwnFieldLabelClass}>
            {queryLabel}
          </label>
          <input id="pwn-list-query" value={query} onChange={(event) => onQuery(event.target.value)} className={pwnFieldClass} type="search" />
        </div>
        {filterOptions && onFilter ? (
          <div className="space-y-2">
            <label htmlFor="pwn-list-filter" className={pwnFieldLabelClass}>
              {filterLabel ?? "Filtro"}
            </label>
            <select id="pwn-list-filter" value={filter} onChange={(event) => onFilter(event.target.value)} className={pwnFieldClass}>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-2">
          <label htmlFor="pwn-list-sort" className={pwnFieldLabelClass}>
            Orden
          </label>
          <select id="pwn-list-sort" value={sort} onChange={(event) => onSort(event.target.value)} className={pwnFieldClass}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
        <p>
          {total} {total === 1 ? "registro" : "registros"}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className={`h-9 rounded-lg border border-white/10 px-3 text-white disabled:opacity-40 ${focusRing}`} onClick={() => onPage(page - 1)} disabled={page <= 1}>
            Anterior
          </button>
          <span aria-live="polite">
            Página {page} de {pages}
          </span>
          <button type="button" className={`h-9 rounded-lg border border-white/10 px-3 text-white disabled:opacity-40 ${focusRing}`} onClick={() => onPage(page + 1)} disabled={page >= pages}>
            Siguiente
          </button>
        </div>
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
