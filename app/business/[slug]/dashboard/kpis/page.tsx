"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Percent, Activity } from "@/components/icons";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs } from "@/components/business/ui";
import { formatMoney } from "@/lib/geo/latam";

interface KPIData {
  success: boolean;
  data: {
    currentMonth: {
      totalSales: number;
      averageMargin: number;
      uniqueCustomers: number;
      growthPercent: number;
    };
    salesLast30Days: Array<{ date: string; sales: number }>;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
}

const PERIODS = [
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
];

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  hint?: React.ReactNode;
  tone?: "gold" | "danger" | "neutral";
}

function StatTile({ label, value, icon: Icon, hint, tone = "neutral" }: StatTileProps) {
  const toneStyles = {
    gold: "bg-gold/10 text-gold",
    danger: "bg-red-500/10 text-red-500",
    neutral: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="mv-panel flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-[var(--text-tertiary)]">{label}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <span className="font-display text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
      {hint ? <span className="text-xs text-[var(--text-secondary)]">{hint}</span> : null}
    </div>
  );
}

export default function KPIDashboard({ params }: { params: { slug: string } }) {
  const [period, setPeriod] = useState("month");
  const [kpiData, setKpiData] = useState<KPIData["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get workspace currency from localStorage or default
  const [currency, setCurrency] = useState("BOB");
  const [country, setCountry] = useState("BO");

  useEffect(() => {
    // Try to get from localStorage or use default
    const stored = typeof window !== "undefined" ? localStorage.getItem("workspace-currency") : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrency(parsed.currency || "BOB");
      setCountry(parsed.country || "BO");
    }
  }, []);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setError(null);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const queryParams = new URLSearchParams({
          period,
          year: year.toString(),
          month: month.toString(),
        });

        const response = await fetch(`/api/business/${params.slug}/kpis?${queryParams}`);
        const data: KPIData = await response.json();

        if (!response.ok || !data.success) {
          setError("Error al cargar las métricas");
          return;
        }

        setKpiData(data.data);
      } catch (err) {
        setError("Error al conectar con el servidor");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [params.slug, period]);

  const money = (v: number) => formatMoney(v, country, currency);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const locale = country ? `es-${country}` : "es-BO";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <AppPage
        kicker="Dashboard"
        title="KPIs"
        tabs={<BusinessTabs slug={params.slug} role="MANAGER" active="resumen" />}
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-[var(--text-secondary)]">Cargando métricas...</p>
        </div>
      </AppPage>
    );
  }

  if (error || !kpiData) {
    return (
      <AppPage
        kicker="Dashboard"
        title="KPIs"
        tabs={<BusinessTabs slug={params.slug} role="MANAGER" active="resumen" />}
      >
        <div className="mv-panel p-6 text-center">
          <p className="text-red-500">{error || "No hay datos disponibles"}</p>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage
      kicker="Dashboard"
      title="KPIs"
      tabs={<BusinessTabs slug={params.slug} role="MANAGER" active="resumen" />}
    >
      {/* Period Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p.value
                ? "bg-gold text-black"
                : "bg-[var(--mv-panel-bg)] text-[var(--text-primary)] hover:bg-[var(--mv-raised-bg)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile
          label="Ventas totales"
          value={money(kpiData.currentMonth.totalSales)}
          icon={TrendingUp}
          hint={`${kpiData.currentMonth.growthPercent > 0 ? "+" : ""}${kpiData.currentMonth.growthPercent.toFixed(1)}% vs. período anterior`}
          tone={kpiData.currentMonth.growthPercent >= 0 ? "gold" : "danger"}
        />
        <StatTile
          label="Margen promedio"
          value={`${kpiData.currentMonth.averageMargin.toFixed(1)}%`}
          icon={Percent}
          hint="Basado en costos conocidos"
          tone="gold"
        />
        <StatTile
          label="Clientes únicos"
          value={kpiData.currentMonth.uniqueCustomers.toString()}
          icon={Users}
          hint="Con datos de identificación"
        />
        <StatTile
          label="Crecimiento"
          value={`${kpiData.currentMonth.growthPercent > 0 ? "+" : ""}${kpiData.currentMonth.growthPercent.toFixed(1)}%`}
          icon={Activity}
          hint="Comparado a período anterior"
          tone={kpiData.currentMonth.growthPercent >= 0 ? "gold" : "danger"}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart - Last 30 Days */}
        <div className="mv-panel p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Ventas últimos 30 días</h3>
          {kpiData.salesLast30Days.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData.salesLast30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mv-hairline)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="var(--text-secondary)"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `${Math.round(value)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-bg-secondary)",
                      border: "1px solid var(--mv-hairline-strong)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                    }}
                    formatter={(value: any): string => value ? money(value) : ""}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#d4af37"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-[var(--text-secondary)]">Sin datos de ventas</p>
            </div>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="mv-panel p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Top 5 productos</h3>
          {kpiData.topProducts.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mv-hairline)" />
                  <XAxis type="number" stroke="var(--text-secondary)" style={{ fontSize: "12px" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--text-secondary)"
                    style={{ fontSize: "11px" }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-bg-secondary)",
                      border: "1px solid var(--mv-hairline-strong)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                    }}
                    formatter={(value: any, name: any): string | [string, string] => {
                      if (!value) return "";
                      if (name === "revenue") return [money(value), "Ingresos"];
                      if (name === "quantity") return [value.toFixed(2), "Cantidad"];
                      return [value.toString(), name || ""];
                    }}
                  />
                  <Bar dataKey="revenue" fill="#d4af37" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-[var(--text-secondary)]">Sin productos vendidos</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table of Top Products */}
      {kpiData.topProducts.length > 0 && (
        <div className="mt-6 mv-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--mv-hairline)]">
                <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Producto</th>
                <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Cantidad</th>
                <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Ingresos</th>
                <th className="px-4 py-3 text-right text-[var(--text-secondary)]">% del total</th>
              </tr>
            </thead>
            <tbody>
              {kpiData.topProducts.map((product, idx) => {
                const totalRevenue = kpiData.topProducts.reduce((sum, p) => sum + p.revenue, 0);
                const percentage = ((product.revenue / totalRevenue) * 100).toFixed(1);
                return (
                  <tr key={idx} className="border-b border-[var(--mv-hairline)] last:border-b-0">
                    <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">{product.quantity.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)] font-semibold">{money(product.revenue)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppPage>
  );
}
