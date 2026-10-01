"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Activity, BadgeCheck, Briefcase, CreditCard, DollarSign, LifeBuoy, MapPin, Receipt, Users, Zap } from "lucide-react";
import { PullChart } from "@/components/motion/PullChart";
import { AdminPanel, EmptyState, Metric, fmt } from "./ui";

interface FinancialMetricsProps {
  revenueData: { month: string; amount: number }[];
  growthData: { month: string; users: number }[];
  planDistribution: { name: string; value: number; color: string }[];
  recentTransactions: { id: string; amount: number; createdAt: Date; metadata: any }[];
  summary: {
    totalRevenue: number;
    mrr: number;
    arpu: number;
    conversionRate: number;
  };
  operationalStats: {
    totalUsers: number;
    verifiedUsers: number;
    activeServices: number;
    activeSpaces: number;
    openTickets?: number;
  };
}

/** Month-over-month change computed from the real series; null when there is no base to compare. */
function monthDelta(series: number[]) {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (!prev) return null;
  const pct = ((last - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs. mes anterior`;
}

export function FinancialMetrics({ revenueData, growthData, planDistribution, recentTransactions, summary, operationalStats }: FinancialMetricsProps) {
  const router = useRouter();
  const money = (value: number) => `$${value.toLocaleString("es-BO")}`;
  const usd = (value: number, digits = 0) =>
    `$${value.toLocaleString("es-BO", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  const planTotal = planDistribution.reduce((sum, p) => sum + p.value, 0);
  const revenueDelta = monthDelta(revenueData.map((r) => r.amount));
  const signupDelta = monthDelta(growthData.map((g) => g.users));

  return (
    <div className="flex flex-col gap-8">
      {/* Operation */}
      <section aria-labelledby="ops-title" className="flex flex-col gap-3">
        <h2 id="ops-title" className="text-sm font-semibold text-[var(--text-secondary)]">Operación</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Metric label="Usuarios" value={fmt.number(operationalStats.totalUsers)} icon={Users} hint={signupDelta ? `Altas: ${signupDelta}` : undefined} />
          <Metric
            label="Verificados"
            value={fmt.number(operationalStats.verifiedUsers)}
            icon={BadgeCheck}
            hint={`${summary.conversionRate.toFixed(1)}% del total`}
          />
          <Metric label="Servicios" value={fmt.number(operationalStats.activeServices)} icon={Briefcase} />
          <Metric label="Espacios" value={fmt.number(operationalStats.activeSpaces)} icon={MapPin} />
          {typeof operationalStats.openTickets === "number" ? (
            <Metric
              label="Tickets abiertos"
              value={fmt.number(operationalStats.openTickets)}
              icon={LifeBuoy}
              tone={operationalStats.openTickets > 0 ? "danger" : "neutral"}
            />
          ) : null}
        </dl>
      </section>

      {/* Revenue */}
      <section aria-labelledby="rev-title" className="flex flex-col gap-3">
        <h2 id="rev-title" className="text-sm font-semibold text-[var(--text-secondary)]">Ingresos · últimos 6 meses</h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Cobrado" value={usd(summary.totalRevenue, 2)} icon={DollarSign} tone="gold" hint={revenueDelta ?? "Transacciones pagadas"} />
          <Metric label="MRR estimado" value={usd(summary.mrr, 2)} icon={Zap} hint="Suscripciones activas × precio de lista" />
          <Metric label="Ingreso por usuario" value={usd(summary.arpu, 2)} icon={CreditCard} hint="Cobrado ÷ usuarios totales" />
          <Metric label="Tasa de verificación" value={`${summary.conversionRate.toFixed(1)}%`} icon={Activity} hint="Verificados ÷ usuarios totales" />
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PullChart
          title="Ingresos de la página"
          caption="Arrastrá la curva para ver cada mes. Hacia abajo, actualiza."
          points={revenueData.map((point) => ({ label: point.month, value: point.amount }))}
          formatValue={money}
          onRefresh={() => router.refresh()}
        />
        <PullChart
          title="Usuarios"
          caption="Registros nuevos por mes"
          points={growthData.map((point) => ({ label: point.month, value: point.users }))}
          accent="#60A5FA"
          formatValue={(value) => value.toLocaleString("es-BO")}
          onRefresh={() => router.refresh()}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Plan mix */}
        <AdminPanel id="plans" className="lg:col-span-2" title="Planes de las altas recientes" description="Cuentas creadas en los últimos 6 meses.">
          {planTotal === 0 ? (
            <EmptyState title="Sin altas en el período" />
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
              <div className="relative h-44 w-44 shrink-0" aria-hidden>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={56} outerRadius={78} paddingAngle={3} dataKey="value" stroke="none">
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg-secondary)",
                        border: "1px solid var(--mv-hairline-strong)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="mv-data text-xl text-[var(--text-primary)]">{fmt.number(planTotal)}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">altas</span>
                </div>
              </div>
              <dl className="flex w-full flex-col gap-2">
                {planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                      {plan.name}
                    </dt>
                    <dd className="mv-data text-[var(--text-primary)]">
                      {fmt.number(plan.value)}
                      <span className="ml-2 text-xs text-[var(--text-tertiary)]">{((plan.value / planTotal) * 100).toFixed(0)}%</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </AdminPanel>

        {/* Recent transactions */}
        <AdminPanel
          id="recent-tx"
          className="lg:col-span-3"
          title="Cobros recientes"
          description="Últimas transacciones pagadas."
          bodyClassName="p-0"
          actions={
            <Link href="/admin/dashboard?tab=finance" className="mv-link text-sm">
              Ver finanzas
            </Link>
          }
        >
          {recentTransactions.length === 0 ? (
            <div className="p-5"><EmptyState icon={Receipt} title="No hay cobros en el período" /></div>
          ) : (
            <ul>
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-4 border-b border-[var(--mv-hairline)] px-5 py-3 last:border-b-0 md:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{tx.metadata?.description || "Pago de sistema"}</p>
                    <p className="mv-data truncate text-xs text-[var(--text-tertiary)]">
                      {tx.id?.slice(0, 12) || "N/A"} · <span suppressHydrationWarning>{fmt.date(tx.createdAt)}</span>
                    </p>
                  </div>
                  <p className="mv-data shrink-0 text-sm font-medium text-green-400">+{usd(Number(tx.amount), 2)}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
