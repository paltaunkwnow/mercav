"use client";

import { useMemo, useState } from "react";
import { Search, DollarSign, Briefcase, TrendingUp, Megaphone, ShoppingCart } from "@/components/icons";
import { formatDate } from "@/lib/business/format";
import { formatMoney } from "@/lib/geo/latam";
import { cn } from "@/lib/utils";

type Expense = {
  id: string;
  date: Date;
  category: string;
  amount: number;
  description: string;
  receipt?: string | null;
};

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: typeof DollarSign }> = {
  SALARIOS: { label: "Salarios", color: "text-blue-500", icon: DollarSign },
  SERVICIOS: { label: "Servicios", color: "text-green-500", icon: Briefcase },
  MARKETING: { label: "Marketing", color: "text-purple-500", icon: TrendingUp },
  OPERACION: { label: "Operación", color: "text-orange-500", icon: Megaphone },
  OTROS: { label: "Otros", color: "text-gray-500", icon: ShoppingCart },
};

export function ExpenseList({
  slug,
  expenses,
  currency,
}: {
  slug: string;
  expenses: Expense[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(expenses.map((e) => e.category)));
  const categoryCounts = categories.reduce(
    (acc, cat) => {
      acc[cat] = expenses.filter((e) => e.category === cat).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (!q || e.description.toLowerCase().includes(q)) &&
        (!category || e.category === category)
    );
  }, [expenses, query, category]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
          <label htmlFor="expense-search" className="sr-only">
            Buscar gasto
          </label>
          <input
            id="expense-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por descripción"
            className="mv-input h-10 w-full pl-9 text-sm"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "mv-focus h-8 rounded-full px-3 text-[13px] font-semibold transition-colors",
              category === null
                ? "bg-gold text-[var(--mv-on-gold)]"
                : "bg-[var(--mv-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Todas ({expenses.length})
          </button>
          {categories.map((cat) => {
            const info = CATEGORY_LABELS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "mv-focus h-8 rounded-full px-3 text-[13px] font-semibold transition-colors",
                  category === cat
                    ? "bg-gold text-[var(--mv-on-gold)]"
                    : "bg-[var(--mv-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {info.label} ({categoryCounts[cat]})
              </button>
            );
          })}
        </div>
      )}

      {shown.length ? (
        <ul className="mv-panel divide-y divide-[var(--mv-hairline)] p-0">
          {shown.map((e) => {
            const catInfo = CATEGORY_LABELS[e.category];
            const Icon = catInfo.icon;
            return (
              <li key={e.id} className="p-4 hover:bg-[var(--mv-panel-hover)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--mv-panel)]", catInfo.color)}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="block text-[15px] font-semibold text-[var(--text-primary)]">
                        {e.description}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                        {formatDate(e.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="mv-chip !py-0.5 !text-[11px]">{catInfo.label}</span>
                      {e.receipt && (
                        <a
                          href={e.receipt}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-gold hover:underline"
                        >
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-right text-sm font-semibold tabular-nums text-[var(--text-primary)] shrink-0">
                    {formatMoney(e.amount, "BO", currency)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mv-panel p-5 text-sm text-[var(--text-secondary)]">
          {query || category ? "No hay coincidencias." : "Todavía no hay gastos en este período."}
        </p>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
