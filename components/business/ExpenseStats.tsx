"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/lib/geo/latam";

const CATEGORY_COLORS: Record<string, string> = {
  SALARIOS: "#3B82F6",     // blue-500
  SERVICIOS: "#10B981",    // green-500
  MARKETING: "#A855F7",    // purple-500
  OPERACION: "#F97316",    // orange-500
  OTROS: "#6B7280",        // gray-500
};

const CATEGORY_LABELS: Record<string, string> = {
  SALARIOS: "Salarios",
  SERVICIOS: "Servicios",
  MARKETING: "Marketing",
  OPERACION: "Operación",
  OTROS: "Otros",
};

export function ExpenseStats({
  total,
  byCategory,
  currency,
  country = "BO",
}: {
  total: number;
  byCategory: Record<string, number>;
  currency: string;
  country?: string;
}) {
  const data = Object.entries(byCategory).map(([category, amount]) => ({
    name: CATEGORY_LABELS[category],
    value: amount,
    category,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="mv-panel p-5">
        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-2">
          Total del mes
        </h3>
        <p className="text-3xl font-bold text-gold">
          {formatMoney(total, country, currency)}
        </p>
      </div>

      {data.length > 0 ? (
        <div className="mv-panel p-5 flex flex-col">
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Por categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || "#6B7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any): string => value ? formatMoney(value, "BO", currency) : ""}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                  />
                  <span className="text-[var(--text-secondary)]">{cat.name}</span>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatMoney(cat.value, "BO", currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mv-panel p-5 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Sin gastos en este período
          </p>
        </div>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
