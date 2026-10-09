"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Clock,
  FileText,
  Printer,
  Package,
  Loader2,
  Ban,
  AlertTriangle
} from "@/components/icons";
import Link from "next/link";
import POSHeader from "@/components/pos/POSHeader";
import { formatMoney } from "@/lib/pos/money";
import { formatQuantity } from "@/lib/pos/business";
import VoidSaleDialog from "@/components/pos/VoidSaleDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { PullChart } from "@/components/motion/PullChart";
import { posFetch, usePos } from '@/lib/pos/client';

export default function POSReportsPage() {
  const pos = usePos();
  const [range, setRange] = useState("day");
  const [activeTab, setActiveTab] = useState<'sales' | 'profitability'>('sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("BOB");
  const [mounted, setMounted] = useState(false);
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [voidNotice, setVoidNotice] = useState('');

  const incomeSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const sale of (data?.sales || []).filter((x: any) => x.status !== 'VOIDED')) {
      const label = format(new Date(sale.createdAt), "d MMM", { locale: es });
      buckets.set(label, (buckets.get(label) || 0) + Number(sale.totalAmount || 0));
    }
    return [...buckets.entries()].map(([label, value]) => ({ label, value }));
  }, [data]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await posFetch(`/api/pos/reports?range=${range}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
        if (result.config?.currency) {
           setCurrency(result.config.currency);
        }
      }
    } catch (error) {
      console.error("Error fetching reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const completed = (data?.sales || []).filter((x: any) => x.status !== 'VOIDED');
    if (completed.length === 0) return;

    if (activeTab === 'profitability' && data.productProfitability) {
      const summaryData = [
        { Concepto: "Reporte de Rentabilidad", Valor: range.toUpperCase() },
        { Concepto: "Fecha de Generación", Valor: format(new Date(), "dd/MM/yyyy HH:mm") },
        { Concepto: "Ingresos Totales", Valor: Number(data.stats.totalRevenue) },
        { Concepto: "Costo Total de Ventas", Valor: Number(data.stats.totalCost || 0) },
        { Concepto: "Ganancia Neta", Valor: Number(data.stats.totalProfit || 0) },
        { Concepto: "Margen Promedio (%)", Valor: data.stats.totalRevenue > 0 ? ((Number(data.stats.totalProfit || 0) / Number(data.stats.totalRevenue)) * 100).toFixed(2) + "%" : "0%" },
        { Concepto: "Moneda", Valor: currency }
      ];

      const detailedData = data.productProfitability.map((p: any) => ({
        "Producto": p.name,
        "Categoría": p.categoryName,
        "Cantidad Vendida": p.quantitySold,
        "Ingresos Totales": Number(p.revenue),
        "Costo Total": Number(p.cost),
        "Ganancia Neta": Number(p.profit),
        "Margen (%)": Number(p.margin).toFixed(2) + "%"
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Resumen Rentabilidad");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedData), "Rentabilidad por Producto");
      XLSX.writeFile(wb, `Reporte_Rentabilidad_${range}_${format(new Date(), "yyyyMMdd")}.xlsx`);
      return;
    }

    const summaryData = [
      { Concepto: "Rango de Reporte", Valor: range.toUpperCase() },
      { Concepto: "Fecha de Generación", Valor: format(new Date(), "dd/MM/yyyy HH:mm") },
      { Concepto: "Total Ventas Brutas", Valor: Number(data.stats.totalRevenue) },
      { Concepto: "Total Órdenes", Valor: data.stats.totalOrders },
      { Concepto: "Ticket Promedio", Valor: Number(data.stats.averageOrder) },
      { Concepto: "Total Descuentos", Valor: Number(data.stats.totalDiscounts) },
      { Concepto: "Moneda", Valor: currency }
    ];

    const detailedData: any[] = [];
    completed.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const pName = item.product?.name || item.productName || "Producto";
        detailedData.push({
          "Ticket #": sale.transactionId.slice(-8).toUpperCase(),
          "Fecha": format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm"),
          "Producto": pName,
          "Cantidad": Number(item.quantity),
          "Precio Unitario": Number(item.unitPrice),
          "Subtotal Item": Number(item.subtotal),
          "Total Venta": Number(sale.totalAmount),
          "Monto Recibido": Number(sale.receivedAmount || 0),
          "Cambio Entregado": Number(sale.changeAmount || 0),
          "Tipo": sale.orderType,
          "Canal": sale.deliveryChannel || 'Directo'
        });
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Resumen General");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedData), "Detalle de Productos");
    XLSX.writeFile(wb, `Reporte_Mercav_Detallado_${range}_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  const profitAverageMargin = data?.stats?.totalRevenue > 0 
    ? (Number(data.stats.totalProfit || 0) / Number(data.stats.totalRevenue)) * 100 
    : 0;

  const getMarginBadgeClass = (margin: number) => {
    if (margin >= 30) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (margin >= 15) return "bg-yellow-500/10 text-gold border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const getMarginLabel = (margin: number) => {
    if (margin >= 30) return "Alto";
    if (margin >= 15) return "Medio";
    return "Bajo";
  };

  const money = (v: unknown) => formatMoney(Number(v || 0), currency);
  const allSales: any[] = data?.sales || [];
  const completedSales = allSales.filter((x) => x.status !== 'VOIDED');
  const hasSales = completedSales.length > 0;
  const lowStock: any[] = data?.lowStock || [];
  const rangeLabel = range === 'day' ? 'hoy' : range === 'week' ? 'esta semana' : 'este mes';
  const sessions: any[] = data?.sessions || [];
  // Caja de empresa: ventas por persona (cada uno vende con su cuenta).
  const sellers: { userId: string; name: string; orders: number; revenue: number }[] = data?.sellers || [];
  const products: any[] = data?.productProfitability || [];
  const plainBtn = 'mv-btn w-full border border-[var(--mv-hairline-strong)] text-[var(--text-primary)] hover:border-[var(--color-border-gold)]';

  const kpis = activeTab === 'sales'
    ? [
        { label: 'Ventas totales', value: money(data?.stats?.totalRevenue), tone: '' },
        { label: 'Órdenes', value: String(Number(data?.stats?.totalOrders || 0)), tone: '' },
        { label: 'Ticket promedio', value: money(data?.stats?.averageOrder), tone: '' },
        { label: 'Descuentos', value: money(data?.stats?.totalDiscounts), tone: '' },
      ]
    : [
        { label: 'Ingresos', value: money(data?.stats?.totalRevenue), tone: '' },
        { label: 'Costo de ventas', value: money(data?.stats?.totalCost), tone: '' },
        { label: 'Ganancia neta', value: money(data?.stats?.totalProfit), tone: Number(data?.stats?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400' },
        { label: 'Margen promedio', value: `${Number(profitAverageMargin || 0).toFixed(2)}%`, tone: '' },
      ];

  const emptyState = (title: string, body: string) => (
    <div className="mv-panel flex flex-col items-center px-6 py-14 text-center" role="status">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--mv-panel)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[color:var(--mv-hairline-strong)]">
        <Package size={22} strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-3 text-base font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">{body}</p>
      <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link href={pos.href()} className="mv-btn mv-btn-primary mv-btn-sm">Ir a la caja</Link>
        {range !== 'month' && (
          <button type="button" onClick={() => setRange('month')} className="mv-btn mv-btn-sm border border-[var(--mv-hairline-strong)] text-[var(--text-primary)]">
            Ver el mes completo
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-[var(--text-primary)]">
      <div className="no-print">
        <POSHeader />
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] sm:px-6 md:pt-12 no-print">
        <header className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="mv-kicker">Reportes</p>
            <h1 className="mv-h2">Ventas y rentabilidad</h1>
            <p className="mv-body">Turnos, ingresos y margen por producto de {rangeLabel}.</p>
          </div>

          <div className="inline-flex self-start rounded-full border border-[var(--mv-hairline-strong)] p-1 md:self-auto" role="group" aria-label="Período">
            {["day", "week", "month"].map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={range === t}
                onClick={() => setRange(t)}
                className={`mv-focus h-10 rounded-full px-4 text-sm font-semibold transition-colors duration-150 sm:px-5 ${range === t ? "bg-gold text-[var(--mv-on-gold)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
              >
                {t === "day" ? "Hoy" : t === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div className="scrollbar-hide mb-6 flex gap-6 overflow-x-auto border-b border-[var(--mv-hairline)]" role="tablist" aria-label="Tipo de reporte">
          {([['sales', 'Turnos y ventas'], ['profitability', 'Rentabilidad']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={activeTab === id}
              aria-controls="report-panel"
              onClick={() => setActiveTab(id)}
              className={`mv-focus relative h-12 shrink-0 whitespace-nowrap text-sm font-semibold transition-colors duration-150 ${activeTab === id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {label}
              {activeTab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gold" aria-hidden />}
            </button>
          ))}
        </div>

        <div id="report-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} aria-busy={loading} className="space-y-6">
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="mv-panel rounded-[1.25rem] p-4 sm:p-5">
                <dt className="text-sm text-[var(--text-secondary)]">{k.label}</dt>
                <dd className={`mv-data mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl ${k.tone || 'text-[var(--text-primary)]'} ${loading ? 'opacity-50' : ''}`}>{k.value}</dd>
              </div>
            ))}
          </dl>

          <PullChart
            title="Ingresos del POS"
            caption="Arrastrá la curva para ver cada día. Hacia abajo, actualiza el reporte."
            points={incomeSeries}
            formatValue={(value) => `${currency} ${value.toLocaleString("es-BO", { maximumFractionDigits: 2 })}`}
            onRefresh={fetchData}
          />

          {activeTab === 'sales' ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section aria-labelledby="sessions-title" className="space-y-3 lg:col-span-2">
                <h2 id="sessions-title" className="mv-h3">Turnos</h2>
                {loading ? (
                  <div className="mv-panel flex items-center justify-center gap-3 py-14" role="status">
                    <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden />
                    <span className="text-sm text-[var(--text-secondary)]">Cargando turnos…</span>
                  </div>
                ) : sessions.length === 0 ? (
                  emptyState(`No hubo turnos ${rangeLabel}`, 'Cuando abras la caja y registres ventas, cada turno aparece acá con su total.')
                ) : (
                  <ul className="mv-panel divide-y divide-[var(--mv-hairline)] overflow-hidden">
                    {sessions.map((session: any) => {
                      const open = session.status === 'OPEN';
                      return (
                        <li key={session.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${open ? 'bg-green-500/10 text-green-400' : 'bg-[var(--mv-panel)] text-[var(--text-tertiary)]'}`}>
                              <Clock size={18} aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="mv-data truncate text-sm font-semibold text-[var(--text-primary)]">{format(new Date(session.openedAt), "d MMM, HH:mm", { locale: es })}</p>
                              <p className={`text-xs font-medium ${open ? 'text-green-400' : 'text-[var(--text-secondary)]'}`}>{open ? 'Abierto' : 'Cerrado'}</p>
                              {session.openedByName || session.closedByName ? (
                                <p className="truncate text-xs text-[var(--text-tertiary)]">
                                  {session.openedByName ? `Abrió ${session.openedByName}` : ''}
                                  {session.openedByName && session.closedByName ? ' · ' : ''}
                                  {session.closedByName ? `Cerró ${session.closedByName}` : ''}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-[var(--text-secondary)]">Ventas</p>
                            <p className="mv-data text-base font-semibold text-[var(--text-primary)]">{money(session.displayTotal)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {sellers.length > 0 ? (
                  <>
                    <h2 id="sellers-title" className="mv-h3 pt-4">Por persona</h2>
                    <ul className="mv-panel divide-y divide-[var(--mv-hairline)] overflow-hidden" aria-labelledby="sellers-title">
                      {sellers.map((seller) => (
                        <li key={seller.userId} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{seller.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {seller.orders} {seller.orders === 1 ? 'venta' : 'ventas'}
                            </p>
                          </div>
                          <p className="mv-data shrink-0 text-base font-semibold text-[var(--text-primary)]">{money(seller.revenue)}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <h2 id="sales-list-title" className="mv-h3 pt-4">Ventas</h2>
                <p aria-live="polite" className="sr-only">{voidNotice}</p>
                {!loading && allSales.length > 0 && (
                  <ul className="mv-panel divide-y divide-[var(--mv-hairline)] overflow-hidden" aria-labelledby="sales-list-title">
                    {allSales.map((sale: any) => {
                      const voided = sale.status === 'VOIDED';
                      return (
                        <li key={sale.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-x-2 text-sm">
                              <span className="mv-data font-semibold text-[var(--text-primary)]">#{String(sale.transactionId).slice(-8).toUpperCase()}</span>
                              <span className="mv-data text-[var(--text-secondary)]">{format(new Date(sale.createdAt), "d MMM, HH:mm", { locale: es })}</span>
                              {sale.staff?.name && <span className="text-[var(--text-secondary)]">· {sale.staff.name}</span>}
                              {!sale.staff?.name && sale.sellerUserId && sellers.find((p) => p.userId === sale.sellerUserId) ? (
                                <span className="text-[var(--text-secondary)]">· {sellers.find((p) => p.userId === sale.sellerUserId)?.name}</span>
                              ) : null}
                            </p>
                            {voided ? (
                              <p className="text-xs font-medium text-red-400">Anulada{sale.voidReason ? ` · ${sale.voidReason}` : ''}</p>
                            ) : (
                              <p className="text-xs text-[var(--text-secondary)]">{sale.items?.length ?? 0} {sale.items?.length === 1 ? 'producto' : 'productos'}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`mv-data text-sm font-semibold ${voided ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
                              {money(sale.totalAmount)}
                              {voided && <span className="sr-only"> (anulada, no suma)</span>}
                            </span>
                            {!voided && (
                              <button
                                type="button"
                                onClick={() => setVoidTarget(sale)}
                                aria-label={`Anular venta ${String(sale.transactionId).slice(-8).toUpperCase()}`}
                                className="mv-focus grid h-11 w-11 place-items-center rounded-xl text-[var(--text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Ban size={16} aria-hidden />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!loading && allSales.length === 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">No hay ventas {rangeLabel}.</p>
                )}
              </section>

              <aside aria-label="Exportar" className="space-y-3">
                <h2 className="mv-h3">Exportar</h2>
                <div className="mv-panel space-y-4 p-5">
                  <div className="flex items-baseline justify-between gap-4 border-b border-[var(--mv-hairline)] pb-4">
                    <span className="text-sm text-[var(--text-secondary)]">Total bruto</span>
                    <span className="mv-data text-xl font-semibold text-[var(--text-primary)]">{money(data?.stats?.totalRevenue)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={handleExportExcel} disabled={!hasSales} className={plainBtn}>
                      <FileText size={16} aria-hidden /> Descargar Excel
                    </button>
                    <button type="button" onClick={() => window.print()} disabled={!data} className={plainBtn}>
                      <Printer size={16} aria-hidden /> Imprimir o guardar PDF
                    </button>
                  </div>
                  {!loading && !hasSales && <p className="text-xs text-[var(--text-secondary)]">El Excel se habilita cuando hay ventas en el período.</p>}
                </div>
              </aside>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section aria-labelledby="profit-title" className="space-y-3 lg:col-span-2">
                <h2 id="profit-title" className="mv-h3">Rentabilidad por producto</h2>
                {loading ? (
                  <div className="mv-panel flex items-center justify-center gap-3 py-14" role="status">
                    <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden />
                    <span className="text-sm text-[var(--text-secondary)]">Cargando productos…</span>
                  </div>
                ) : products.length === 0 ? (
                  emptyState(`No hay ventas ${rangeLabel}`, 'La rentabilidad se calcula con el costo que cargaste en el inventario y las ventas del período.')
                ) : (
                  <div className="mv-panel overflow-hidden">
                    {/* Tablet and desktop: table */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[var(--mv-hairline)] text-xs text-[var(--text-secondary)]">
                            <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Uds.</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Ingresos</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Costo</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Ganancia</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Margen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--mv-hairline)]">
                          {products.map((p: any) => (
                            <tr key={p.id} className="transition-colors duration-150 hover:bg-[var(--mv-panel-hover)]">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--text-tertiary)]">
                                    {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <Package size={14} aria-hidden />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                                    <p className="truncate text-xs text-[var(--text-secondary)]">{p.categoryName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="mv-data px-4 py-3 text-right text-sm text-[var(--text-secondary)]">{p.quantitySold}</td>
                              <td className="mv-data px-4 py-3 text-right text-sm text-[var(--text-primary)]">{money(p.revenue)}</td>
                              <td className="mv-data px-4 py-3 text-right text-sm text-[var(--text-secondary)]">{money(p.cost)}</td>
                              <td className={`mv-data px-4 py-3 text-right text-sm font-semibold ${p.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{money(p.profit)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className="mv-data text-sm font-semibold text-[var(--text-primary)]">{Number(p.margin).toFixed(2)}%</span>
                                <span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getMarginBadgeClass(p.margin)}`}>{getMarginLabel(p.margin)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Phone: cards */}
                    <ul className="divide-y divide-[var(--mv-hairline)] md:hidden">
                      {products.map((p: any) => (
                        <li key={p.id} className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                              <p className="text-xs text-[var(--text-secondary)]">{p.categoryName} · <span className="mv-data">{p.quantitySold}</span> uds.</p>
                            </div>
                            <span className="shrink-0 text-right">
                              <span className="mv-data block text-sm font-semibold text-[var(--text-primary)]">{Number(p.margin).toFixed(2)}%</span>
                              <span className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getMarginBadgeClass(p.margin)}`}>{getMarginLabel(p.margin)}</span>
                            </span>
                          </div>
                          <dl className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--mv-panel)] px-3 py-2">
                            <div className="min-w-0">
                              <dt className="text-xs text-[var(--text-secondary)]">Ingresos</dt>
                              <dd className="mv-data truncate text-sm text-[var(--text-primary)]">{money(p.revenue)}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="text-xs text-[var(--text-secondary)]">Costo</dt>
                              <dd className="mv-data truncate text-sm text-[var(--text-secondary)]">{money(p.cost)}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="text-xs text-[var(--text-secondary)]">Ganancia</dt>
                              <dd className={`mv-data truncate text-sm font-semibold ${p.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{money(p.profit)}</dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <aside aria-label="Resumen y exportación" className="space-y-3">
                <h2 className="mv-h3">Resumen</h2>
                <div className="mv-panel space-y-4 p-5">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Ganancia neta</p>
                    <p className={`mv-data mt-1 text-2xl font-semibold ${Number(data?.stats?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {money(data?.stats?.totalProfit)}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-[var(--mv-hairline)] pt-4">
                    <span className="text-sm text-[var(--text-secondary)]">Costo de lo vendido</span>
                    <span className="mv-data text-sm font-semibold text-[var(--text-primary)]">{money(data?.stats?.totalCost)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={handleExportExcel} disabled={!hasSales} className={plainBtn}>
                      <FileText size={16} aria-hidden /> Descargar Excel
                    </button>
                    <button type="button" onClick={() => window.print()} disabled={!data} className={plainBtn}>
                      <Printer size={16} aria-hidden /> Imprimir o guardar PDF
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {!loading && (
            <section aria-labelledby="low-stock-title" className="space-y-3">
              <h2 id="low-stock-title" className="mv-h3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" aria-hidden />
                Stock bajo
              </h2>
              {lowStock.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Ningún producto está por debajo de su mínimo. El mínimo se define en cada producto del{' '}
                  <Link href={pos.href('inventory')} className="mv-link">inventario</Link>.
                </p>
              ) : (
                <ul className="mv-panel divide-y divide-[var(--mv-hairline)] overflow-hidden">
                  {lowStock.map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                      <span className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                      <span className="mv-data shrink-0 text-sm text-red-400">
                        {formatQuantity(p.stock, p.unit)} <span className="text-[var(--text-secondary)]">/ mín. {formatQuantity(p.minStock, p.unit)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>

      {voidTarget && (
        <VoidSaleDialog
          sale={voidTarget}
          currency={currency}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            setVoidNotice('Venta anulada. Los totales se actualizaron.');
            fetchData();
          }}
        />
      )}

      {/* Printable template */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className="hidden print:block fixed inset-0 bg-white text-black p-16 z-[99999] printable-report-root overflow-hidden">
           {/* Watermark Logo */}
           {data?.config?.logoUrl && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-[-1]">
               <img src={data.config.logoUrl} alt="" className="w-[600px] h-[600px] object-contain grayscale" />
             </div>
           )}

           <div className="flex justify-between items-end border-b-[6px] border-[#D4AF37] pb-10 mb-12">
              <div className="flex items-center gap-8">
                 {data?.config?.logoUrl && (
                   <img src={data.config.logoUrl} alt="Logo" className="w-24 h-24 object-contain" />
                 )}
                 <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">
                      {activeTab === 'profitability' ? 'Estado de Utilidad' : 'Reporte Financiero'}
                    </h1>
                    <p className="text-lg font-bold text-gray-400 uppercase tracking-[0.3em]">{data?.config?.shopName || 'Mercav POS'}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1">Periodo de Análisis</p>
                 <p className="text-3xl font-black uppercase tracking-tighter">{range === 'day' ? 'Hoy' : range === 'week' ? 'Semanal' : 'Mensual'}</p>
                 <p className="text-xs font-bold text-gray-400 mt-2">{format(new Date(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
              </div>
           </div>

           {activeTab === 'sales' ? (
             <>
               <div className="grid grid-cols-2 gap-6 mb-12">
                  {[
                    { l: "Ingreso Bruto Total", v: Number(data?.stats?.totalRevenue || 0).toFixed(2), c: "#D4AF37", p: currency },
                    { l: "Órdenes Procesadas", v: data?.stats?.totalOrders || 0, c: "black", p: "" },
                    { l: "Ticket Promedio", v: Number(data?.stats?.averageOrder || 0).toFixed(2), c: "black", p: currency },
                    { l: "Descuentos Aplicados", v: Number(data?.stats?.totalDiscounts || 0).toFixed(2), c: "#ef4444", p: `-${currency}` }
                  ].map(s => (
                    <div key={s.l} style={{ borderLeftColor: s.c }} className="p-8 border-l-[12px] bg-gray-50 rounded-r-[2.5rem] shadow-sm flex items-center justify-between min-h-[110px]">
                       <div className="flex-1 pr-6">
                          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 leading-tight">{s.l}</p>
                       </div>
                       <div className="flex items-center gap-5 text-right whitespace-nowrap">
                          {s.p && <span className="text-xs font-black text-gray-300">{s.p}</span>}
                          <p style={{ color: s.c }} className="text-2xl font-black tracking-tighter leading-none">{s.v}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="flex-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.5em] mb-6 text-[#D4AF37] flex items-center gap-4">
                    <span>Registro de Transacciones</span>
                    <div className="h-[2px] flex-1 bg-gray-100" />
                  </h2>
                  <table className="w-full text-left table-fixed">
                     <thead>
                        <tr className="border-b-2 border-black bg-gray-50">
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest w-[15%]">Ticket</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest w-[15%]">Fecha / Hora</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest w-[35%]">Desglose de Productos</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-right w-[15%]">Total</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-right w-[20%]">Conciliación</th>
                        </tr>
                     </thead>
                     <tbody>
                        {completedSales.map((sale: any) => (
                           <tr key={sale.id} className="border-b border-gray-100 break-inside-avoid">
                              <td className="py-6 px-3 font-bold text-[9px] text-gray-400 uppercase tracking-widest align-top">#{sale.transactionId.slice(-8).toUpperCase()}</td>
                              <td className="py-6 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-tighter align-top">
                                 {format(new Date(sale.createdAt), "dd MMM, HH:mm", { locale: es })}
                              </td>
                              <td className="py-6 px-3 align-top">
                                 <div className="space-y-2">
                                    {sale.items.map((item: any) => (
                                       <div key={item.id} className="text-[10px] font-medium flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-black text-[8px] flex-shrink-0 mt-0.5">x{item.quantity}</span>
                                          <span className="text-gray-800 font-bold leading-tight">{item.product?.name || item.productName || 'Producto'}</span>
                                       </div>
                                    ))}
                                 </div>
                              </td>
                              <td className="py-6 px-3 text-right align-top">
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 mb-0.5">{currency}</span>
                                    <span className="text-sm font-black tracking-tight">{Number(sale.totalAmount).toFixed(2)}</span>
                                 </div>
                              </td>
                              <td className="py-6 px-3 text-right text-[9px] font-bold text-gray-400 leading-relaxed align-top">
                                 <span className="block">PAGADO: {Number(sale.receivedAmount || 0).toFixed(2)}</span>
                                 <span className="block">CAMBIO: {Number(sale.changeAmount || 0).toFixed(2)}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             </>
           ) : (
             <>
               <div className="grid grid-cols-2 gap-6 mb-12">
                  {[
                    { l: "Ventas Totales Brutas", v: Number(data?.stats?.totalRevenue || 0).toFixed(2), c: "black", p: currency },
                    { l: "Costo de Ventas (COGS)", v: Number(data?.stats?.totalCost || 0).toFixed(2), c: "#ef4444", p: currency },
                    { l: "Utilidad / Ganancia Neta", v: Number(data?.stats?.totalProfit || 0).toFixed(2), c: "#10b981", p: currency },
                    { l: "Margen de Ganancia Promedio", v: (profitAverageMargin || 0).toFixed(2) + "%", c: "#D4AF37", p: "" }
                  ].map(s => (
                    <div key={s.l} style={{ borderLeftColor: s.c }} className="p-8 border-l-[12px] bg-gray-50 rounded-r-[2.5rem] shadow-sm flex items-center justify-between min-h-[110px]">
                       <div className="flex-1 pr-6">
                          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 leading-tight">{s.l}</p>
                       </div>
                       <div className="flex items-center gap-5 text-right whitespace-nowrap">
                          {s.p && <span className="text-xs font-black text-gray-300">{s.p}</span>}
                          <p style={{ color: s.c }} className="text-2xl font-black tracking-tighter leading-none">{s.v}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="flex-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.5em] mb-6 text-[#D4AF37] flex items-center gap-4">
                    <span>Rentabilidad de Catálogo</span>
                    <div className="h-[2px] flex-1 bg-gray-100" />
                  </h2>
                  <table className="w-full text-left table-fixed">
                     <thead>
                        <tr className="border-b-2 border-black bg-gray-50">
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest w-[30%]">Producto</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest w-[10%] text-center">Uds</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-right w-[15%]">Venta Bruta</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-right w-[15%]">Costo Total</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-right w-[15%]">Utilidad</th>
                           <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-right w-[15%]">Margen</th>
                        </tr>
                     </thead>
                     <tbody>
                        {data?.productProfitability?.map((p: any) => (
                           <tr key={p.id} className="border-b border-gray-100 break-inside-avoid">
                              <td className="py-6 px-3 align-top">
                                 <p className="text-xs font-bold text-gray-800 uppercase leading-none mb-1">{p.name}</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{p.categoryName}</p>
                              </td>
                              <td className="py-6 px-3 text-center align-top text-xs font-mono font-bold text-gray-600">{p.quantitySold}</td>
                              <td className="py-6 px-3 text-right align-top text-xs font-mono font-bold text-gray-600">{currency} {Number(p.revenue).toFixed(2)}</td>
                              <td className="py-6 px-3 text-right align-top text-xs font-mono font-bold text-gray-400">{currency} {Number(p.cost).toFixed(2)}</td>
                              <td style={{ color: p.profit >= 0 ? '#10b981' : '#ef4444' }} className="py-6 px-3 text-right align-top text-xs font-mono font-black">{currency} {Number(p.profit).toFixed(2)}</td>
                              <td className="py-6 px-3 text-right align-top">
                                 <span className="text-xs font-mono font-black">{Number(p.margin).toFixed(2)}%</span>
                                 <span className="block text-[8px] font-black uppercase tracking-tighter text-gray-400">({getMarginLabel(p.margin)})</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             </>
           )}

           <div className="mt-12 pt-8 border-t-2 border-gray-100 flex justify-between items-end opacity-50">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest">Mercav POS — Ecosistema Digital</p>
                 <p className="text-[8px] font-bold uppercase tracking-tighter">Reporte generado el {format(new Date(), "PPPPpppp", { locale: es })}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Reporte financiero</p>
                 <p className="text-[8px] font-bold text-gray-300">© 2026 Mercav.lat — Todos los derechos reservados</p>
              </div>
           </div>
        </div>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{ __html: `
         @media print {
            @page { margin: 15mm; size: auto; }
            body > *:not(.printable-report-root) { display: none !important; }
            .printable-report-root { 
               display: flex !important; 
               flex-direction: column !important;
               min-height: 100vh !important;
               background: white !important;
               position: static !important;
               visibility: visible !important;
            }
            .printable-report-root * { visibility: visible !important; }
         }
      `}} />
    </div>
  );
}
// creado por pato dev y askforvini
