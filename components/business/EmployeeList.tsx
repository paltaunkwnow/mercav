"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "@/components/icons";
import type { EmployeeView } from "@/lib/business/employees";
import { formatDate } from "@/lib/business/format";
import { serviceYears } from "@/lib/business/bolivia/seniority";
import { formatMoney } from "@/lib/geo/latam";
import { cn } from "@/lib/utils";

export function EmployeeList({ slug, employees, country, currency, today }: { slug: string; employees: EmployeeView[]; country: string; currency: string; today: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const counts = { ACTIVE: employees.filter((e) => e.status === "ACTIVE").length, INACTIVE: employees.filter((e) => e.status === "INACTIVE").length };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => e.status === status && (!q || `${e.firstName} ${e.lastName} ${e.position ?? ""}`.toLowerCase().includes(q)));
  }, [employees, query, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
          <label htmlFor="emp-search" className="sr-only">
            Buscar trabajador
          </label>
          <input id="emp-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o cargo" className="mv-input h-10 w-full pl-9 text-sm" />
        </div>
        <div role="tablist" aria-label="Estado" className="inline-flex w-fit rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-1">
          {(["ACTIVE", "INACTIVE"] as const).map((s) => (
            <button
              key={s}
              role="tab"
              type="button"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "mv-focus h-8 rounded-full px-4 text-[13px] font-semibold transition-colors",
                status === s ? "bg-gold text-[var(--mv-on-gold)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {s === "ACTIVE" ? "Activos" : "De baja"} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <ul className="mv-panel divide-y divide-[var(--mv-hairline)] p-1">
          {shown.map((e) => (
            <li key={e.id}>
              <Link href={`/business/${slug}/trabajadores/${e.id}`} className="mv-focus flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[var(--mv-panel-hover)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-sm font-semibold text-gold" aria-hidden>
                  {(e.firstName[0] ?? "") + (e.lastName[0] ?? "")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[var(--text-primary)]">
                    {e.lastName} {e.firstName}
                  </span>
                  <span className="block truncate text-xs text-[var(--text-secondary)]">
                    {[e.position, `Ingreso ${formatDate(e.hireDate)}`, `${serviceYears(e.hireDate, today)} años`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {e.sensitive ? (
                  <span className="hidden shrink-0 text-right text-sm font-semibold tabular-nums text-[var(--text-primary)] sm:block">{formatMoney(e.sensitive.baseSalary, country, currency)}</span>
                ) : null}
                {e.linked ? <span className="mv-chip hidden !py-0.5 !text-[11px] md:inline-flex">Con cuenta</span> : null}
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mv-panel p-5 text-sm text-[var(--text-secondary)]">{query ? "No hay coincidencias." : status === "ACTIVE" ? "Todavía no cargaste trabajadores." : "Nadie dado de baja."}</p>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
