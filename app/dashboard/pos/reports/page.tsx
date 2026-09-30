"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  ChevronLeft,
  Clock,
  XCircle,
  FileText,
  Printer,
  TrendingDown,
  BarChart3,
  Percent,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { PullChart } from "@/components/motion/PullChart";

export default function POSReportsPage() {
  const [range, setRange] = useState("day");
  const [activeTab, setActiveTab] = useState<'sales' | 'profitability'>('sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("BOB");
  const [mounted, setMounted] = useState(false);

  const incomeSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const sale of data?.sales || []) {
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
      const res = await fetch(`/api/pos/reports?range=${range}`);
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
    if (!data?.sales || data.sales.length === 0) return;

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
    data.sales.forEach((sale: any) => {
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

  const statCards = [
    { label: "Ventas Totales", value: data?.stats?.totalRevenue || 0, icon: DollarSign, color: "gold", prefix: currency },
    { label: "Órdenes", value: data?.stats?.totalOrders || 0, icon: ShoppingBag, color: "blue", prefix: "" },
    { label: "Promedio Ticket", value: data?.stats?.averageOrder || 0, icon: TrendingUp, color: "green", prefix: currency },
    { label: "Descuentos", value: data?.stats?.totalDiscounts || 0, icon: XCircle, color: "red", prefix: currency },
  ];

  const profitAverageMargin = data?.stats?.totalRevenue > 0 
    ? (Number(data.stats.totalProfit || 0) / Number(data.stats.totalRevenue)) * 100 
    : 0;

  const profitabilityCards = [
    { label: "Ingresos Totales", value: data?.stats?.totalRevenue || 0, icon: DollarSign, color: "gold", prefix: currency },
    { label: "Costo de Ventas", value: data?.stats?.totalCost || 0, icon: TrendingDown, color: "red", prefix: currency },
    { label: "Ganancia Neta", value: data?.stats?.totalProfit || 0, icon: BarChart3, color: "green", prefix: currency },
    { label: "Margen Promedio", value: profitAverageMargin || 0, icon: Percent, color: "blue", prefix: "", suffix: "%" },
  ];

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

  return (
    <div className="min-h-screen bg-bg-primary text-white p-8 pt-32">
      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/pos" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Reportes <span className="text-gold">POS</span></h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Análisis de rendimiento y sesiones</p>
          </div>
        </div>

        <div className="flex items-center p-1.5 bg-white/5 border border-white/10 rounded-[2rem]">
          {["day", "week", "month"].map((t) => (
            <button key={t} onClick={() => setRange(t)} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${range === t ? "bg-gold text-black" : "text-gray-400 hover:text-white"}`}>
              {t === "day" ? "Hoy" : t === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-white/5 flex gap-8 no-print">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'sales' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
        >
          Sesiones y Ventas
          {activeTab === 'sales' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'profitability' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
        >
          Análisis de Rentabilidad
          {activeTab === 'profitability' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 no-print">
        {/* Render stats cards based on tab */}
        {activeTab === 'sales' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} key={stat.label} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color} mb-4`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-black tracking-tighter">{stat.prefix} {stat.prefix ? Number(stat.value).toFixed(2) : Number(stat.value)}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {profitabilityCards.map((stat, idx) => (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} key={stat.label} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color === 'gold' ? 'yellow' : stat.color}-500/10 border border-${stat.color === 'gold' ? 'yellow' : stat.color}-500/20 flex items-center justify-center text-${stat.color === 'gold' ? 'gold' : stat.color === 'green' ? 'green-400' : stat.color === 'red' ? 'red-400' : 'blue-400'} mb-4`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-3xl font-black tracking-tighter ${stat.color === 'green' ? 'text-green-400' : stat.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                  {stat.prefix} {Number(stat.value).toFixed(2)}{stat.suffix}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        <PullChart
          title="Ingresos del POS"
          caption="Arrastrá la curva para ver cada día. Hacia abajo, actualiza el reporte."
          points={incomeSeries}
          formatValue={(value) => `${currency} ${value.toLocaleString("es-BO", { maximumFractionDigits: 2 })}`}
          onRefresh={fetchData}
        />

        {/* Tab content */}
        {activeTab === 'sales' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tighter px-4">Historial de <span className="text-gold">Sesiones</span></h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando...</div>
                ) : data?.sessions?.map((session: any) => (
                  <div key={session.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${session.status === 'OPEN' ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{format(new Date(session.openedAt), "d 'de' MMMM, HH:mm", { locale: es })}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${session.status === 'OPEN' ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {session.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Ventas Turno</p>
                       <p className="text-lg font-black">{currency} {Number(session.displayTotal || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-gold/5 border border-gold/10 rounded-[3rem] space-y-6">
                 <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-gray-500 text-xs font-bold uppercase">Total Bruto</span>
                    <span className="text-xl font-black">{currency} {Number(data?.stats?.totalRevenue || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col gap-3">
                   <button onClick={handleExportExcel} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-colors hover:bg-white/10">
                     <FileText size={16} /> Excel (.xlsx)
                   </button>
                   <button onClick={() => window.print()} className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-colors hover:bg-gold">
                     <Printer size={16} /> PDF Reporte
                   </button>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left: Product Profitability Table */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tighter px-4">Rentabilidad por <span className="text-gold">Producto</span></h2>
              
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Producto</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Uds</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Ingresos</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Costos</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Ganancia</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando...</td>
                        </tr>
                      ) : data?.productProfitability?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={14} className="text-gray-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white group-hover:text-gold transition-colors text-xs">{p.name}</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{p.categoryName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-xs font-mono font-bold text-gray-300">
                            {p.quantitySold}
                          </td>
                          <td className="p-6 text-xs font-mono font-bold text-white">
                            {currency} {Number(p.revenue).toFixed(2)}
                          </td>
                          <td className="p-6 text-xs font-mono font-bold text-gray-500 hidden sm:table-cell">
                            {currency} {Number(p.cost).toFixed(2)}
                          </td>
                          <td className={`p-6 text-xs font-mono font-bold ${p.profit >= 0 ? 'text-green-400' : 'text-red-400'} hidden sm:table-cell`}>
                            {currency} {Number(p.profit).toFixed(2)}
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-black text-xs text-white">
                                {Number(p.margin).toFixed(2)}%
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${getMarginBadgeClass(p.margin)}`}>
                                {getMarginLabel(p.margin)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && (!data?.productProfitability || data.productProfitability.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-20 text-center text-gray-700 opacity-30">
                            <Package size={60} className="mx-auto mb-4" strokeWidth={1} />
                            <p className="font-black uppercase tracking-widest text-[10px]">No hay transacciones registradas</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side Control */}
            <div className="space-y-6">
              <div className="p-8 bg-gold/5 border border-gold/10 rounded-[3rem] space-y-6">
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Utilidad Neta</p>
                   <p className={`text-3xl font-black tracking-tighter ${Number(data?.stats?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {currency} {Number(data?.stats?.totalProfit || 0).toFixed(2)}
                   </p>
                 </div>
                 <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-gray-500 text-xs font-bold uppercase">Costo total (COGS)</span>
                    <span className="text-sm font-mono font-bold text-white">{currency} {Number(data?.stats?.totalCost || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col gap-3 pt-2">
                   <button onClick={handleExportExcel} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-colors hover:bg-white/10">
                     <FileText size={16} /> Excel Rentabilidad
                   </button>
                   <button onClick={() => window.print()} className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-colors hover:bg-gold">
                     <Printer size={16} /> PDF Rentabilidad
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                        {data?.sales?.map((sale: any) => (
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
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Premium Financial Statement</p>
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
