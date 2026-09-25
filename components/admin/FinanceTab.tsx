"use client"

import { useState, useEffect } from "react"
import { 
  DollarSign, Zap, Briefcase, MapPin, Loader2, Search, ArrowDownCircle,
  FileText, Calendar, CreditCard, ChevronRight, CheckCircle, XCircle, AlertTriangle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"

export function FinanceTab() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [disputeModalOrder, setDisputeModalOrder] = useState<any | null>(null)
  const [disputeAction, setDisputeAction] = useState<"RELEASE" | "REFUND" | null>(null)
  const [disputeLoading, setDisputeLoading] = useState(false)

  const [refundModalTx, setRefundModalTx] = useState<any | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [refundLoading, setRefundLoading] = useState(false)

  // Export date states
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchFinanceData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/finance")
      const resData = await res.json()
      if (resData.success) {
        setData(resData.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceData()
  }, [])

  // Resolve disputes
  const handleResolveDispute = async () => {
    if (!disputeModalOrder || !disputeAction) return

    setDisputeLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/finance/disputes/${disputeModalOrder.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: disputeAction })
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        setSuccessMessage(`Disputa resuelta con éxito (${disputeAction === "RELEASE" ? "Fondos liberados" : "Reembolsado"}).`)
        setTimeout(() => setSuccessMessage(null), 3000)
        setDisputeModalOrder(null)
        setDisputeAction(null)
        fetchFinanceData()
      } else {
        setErrorMessage(resData.error || "Error al resolver la disputa.")
      }
    } catch (e) {
      setErrorMessage("Error de conexión.")
    } finally {
      setDisputeLoading(false)
    }
  }

  // Process manual refund
  const handleProcessRefund = async () => {
    if (!refundModalTx || !refundReason.trim()) return

    setRefundLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/admin/finance/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: refundModalTx.id,
          reason: refundReason.trim()
        })
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        setSuccessMessage("Reembolso manual procesado con éxito.")
        setTimeout(() => setSuccessMessage(null), 3000)
        setRefundModalTx(null)
        setRefundReason("")
        fetchFinanceData()
      } else {
        setErrorMessage(resData.error || "Error al procesar el reembolso.")
      }
    } catch (e) {
      setErrorMessage("Error de conexión.")
    } finally {
      setRefundLoading(false)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (!data?.transactions) return

    let txToExport = data.transactions
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      txToExport = txToExport.filter((tx: any) => {
        const d = new Date(tx.createdAt)
        return d >= start && d <= end
      })
    }

    const rows = txToExport.map((tx: any) => ({
      ID_Transaccion: tx.id,
      Stripe_ID: tx.stripeId,
      Usuario: tx.user ? `@${tx.user.username} (${tx.user.email})` : "N/A",
      Monto: Number(tx.amount),
      Moneda: tx.currency,
      Estado: tx.status,
      Fecha: new Date(tx.createdAt).toLocaleDateString(),
      Detalle: tx.metadata?.description || "Pago de Sistema"
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transacciones")
    XLSX.writeFile(wb, `Reporte_Mercav_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Export to PDF
  const handleExportPDF = () => {
    if (!data?.transactions) return

    let txToExport = data.transactions
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      txToExport = txToExport.filter((tx: any) => {
        const d = new Date(tx.createdAt)
        return d >= start && d <= end
      })
    }

    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(212, 175, 55) // Gold
    doc.text("REPORTE FINANCIERO OFICIAL - MERCAV.LAT", 14, 20)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 28)
    if (startDate && endDate) {
      doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 34)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.setFillColor(20, 20, 20)
    doc.rect(14, 42, 182, 8, "F")
    doc.setTextColor(212, 175, 55)
    doc.text("Resumen de Comisiones", 16, 47)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Comisiones por Anuncios (Ads): $${Number(data.commissions.ads || 0).toFixed(2)} USD`, 16, 56)
    doc.text(`Comisiones por Servicios: $${Number(data.commissions.services || 0).toFixed(2)} USD`, 16, 62)
    doc.text(`Comisiones por Empleos (Jobs): $${Number(data.commissions.jobs || 0).toFixed(2)} USD`, 16, 68)
    doc.setFont("helvetica", "bold")
    doc.text(`Comisiones de Plataforma Totales: $${Number(data.commissions.total || 0).toFixed(2)} USD`, 16, 75)

    doc.setFillColor(20, 20, 20)
    doc.rect(14, 85, 182, 8, "F")
    doc.setTextColor(212, 175, 55)
    doc.text("Listado de Transacciones Recientes", 16, 90)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    let y = 100

    txToExport.slice(0, 20).forEach((tx: any, idx: number) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(
        `${new Date(tx.createdAt).toLocaleDateString()} | $${Number(tx.amount).toFixed(2)} ${tx.currency} | ${tx.status} | @${tx.user?.username || "N/A"} | ${tx.metadata?.description?.slice(0, 30) || "Pago"}`,
        16,
        y
      )
      y += 8
    })

    doc.save(`Reporte_Financiero_Mercav_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Filter paid transactions list
  const filteredTransactions = data?.transactions?.filter((tx: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.stripeId.toLowerCase().includes(q) ||
      tx.user?.username?.toLowerCase().includes(q) ||
      tx.user?.email?.toLowerCase().includes(q)
    )
  }) || []

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
  }

  return (
    <div className="space-y-8">
      {/* Commission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Total Comisiones Plataforma" 
          value={`$${Number(data.commissions.total || 0).toLocaleString()}`} 
          trend="+15.3%" 
          icon={DollarSign}
          color="from-gold/20 to-transparent"
          iconColor="text-gold"
        />
        <KPICard 
          label="Comisiones de Ads" 
          value={`$${Number(data.commissions.ads || 0).toLocaleString()}`} 
          trend="+12.4%" 
          icon={MapPin}
          color="from-blue-500/20 to-transparent"
          iconColor="text-blue-400"
        />
        <KPICard 
          label="Comisiones de Servicios" 
          value={`$${Number(data.commissions.services || 0).toLocaleString()}`} 
          trend="+8.1%" 
          icon={Zap}
          color="from-purple-500/20 to-transparent"
          iconColor="text-purple-400"
        />
        <KPICard 
          label="Comisiones de Jobs" 
          value={`$${Number(data.commissions.jobs || 0).toLocaleString()}`} 
          trend="+22.1%" 
          icon={Briefcase}
          color="from-green-500/20 to-transparent"
          iconColor="text-green-400"
        />
      </div>

      {/* Floating alert states */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Disputes & Escrows */}
        <div className="lg:col-span-7 space-y-6">
          {/* Service orders in Dispute section */}
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-xl">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" />
              Órdenes de Servicio en Disputa
            </h3>
            {data.disputedOrders.length === 0 ? (
              <p className="text-gray-500 text-xs italic py-6 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">No hay órdenes disputadas actualmente.</p>
            ) : (
              <div className="space-y-4">
                {data.disputedOrders.map((order: any) => (
                  <div key={order.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white leading-normal">Orden: {order.service.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1 font-mono">
                        Cliente: @{order.client.username} | Proveedor: @{order.service.provider.username}
                      </p>
                      <p className="text-[10px] text-gold font-mono mt-1">Total: ${Number(order.totalPrice)} USD (Tarifa plataforma: ${Number(order.platformFee)})</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          setDisputeModalOrder(order)
                          setDisputeAction("RELEASE")
                          setErrorMessage(null)
                        }}
                        className="flex-1 md:flex-none px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Liberar Fondos
                      </button>
                      <button
                        onClick={() => {
                          setDisputeModalOrder(order)
                          setDisputeAction("REFUND")
                          setErrorMessage(null)
                        }}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Reembolsar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escrow transactions pending release section */}
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-xl">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <ArrowDownCircle className="text-gold w-5 h-5" />
              Fondos Escrow en Custodia (Pendientes de Liberar)
            </h3>
            {data.escrowOrders.length === 0 ? (
              <p className="text-gray-500 text-xs italic py-6 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">No hay fondos retenidos en Escrow pendientes.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {data.escrowOrders.map((order: any) => (
                  <div key={order.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-white truncate max-w-[200px]">{order.service.title}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Cliente: @{order.client.username} | Proveedor: @{order.service.provider.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-gold">${Number(order.totalPrice)}</p>
                      <span className="text-[8px] uppercase tracking-wider font-mono text-gray-600 border border-white/5 px-1.5 py-0.5 rounded bg-black/20">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Refunds, Date Range Export */}
        <div className="lg:col-span-5 space-y-6">
          {/* Date range selection and export buttons */}
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-xl">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <FileText className="text-gold w-5 h-5" />
              Exportar Reportes Financieros
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 ml-1">Fecha Inicio</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-gold/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 ml-1">Fecha Fin</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-gold/50 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportExcel}
                className="flex-1 h-12 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-black font-black uppercase tracking-widest text-[10px] text-green-400 transition-all flex items-center justify-center gap-2"
              >
                Descargar Excel
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex-1 h-12 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[10px] text-red-400 transition-all flex items-center justify-center gap-2"
              >
                Descargar PDF
              </button>
            </div>
          </div>

          {/* PAID transactions for manual refunds list with search bar */}
          <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Reembolsos Manuales</h3>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Stripe ID o Email..."
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-gold/50 font-medium text-white placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredTransactions.length === 0 ? (
                <p className="text-gray-500 text-xs italic py-6 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">No se encontraron transacciones.</p>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <div key={tx.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-4 text-xs hover:border-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-white">{tx.metadata?.description || "Pago de Sistema"}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Stripe ID: {tx.stripeId.slice(0, 16)}...</p>
                      <p className="text-[8px] text-gray-600 font-mono mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} @{tx.user?.username || "N/A"}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                      <p className="font-mono font-bold text-green-400">+${Number(tx.amount)}</p>
                      {tx.status === "REFUNDED" ? (
                        <span className="text-[8px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">Reembolsado</span>
                      ) : (
                        <button
                          onClick={() => {
                            setRefundModalTx(tx)
                            setRefundReason("")
                            setErrorMessage(null)
                          }}
                          className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-bold transition-all"
                        >
                          Reembolsar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Dispute Confirmation Modal */}
      <AnimatePresence>
        {disputeModalOrder && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDisputeModalOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-2xl z-10"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2 flex items-center gap-3">
                <AlertTriangle className={disputeAction === "RELEASE" ? "text-green-500" : "text-red-500"} />
                {disputeAction === "RELEASE" ? "Liberar Fondos" : "Aprobar Reembolso"}
              </h3>
              <p className="text-xs text-gold uppercase font-mono tracking-widest mb-6">Auditoría del Escrow en Disputa</p>

              <div className="space-y-6 text-xs text-gray-400">
                <p className="leading-relaxed">
                  ¿Estás seguro de que deseas resolver la disputa de la orden <strong>"{disputeModalOrder.service.title}"</strong>?
                  {disputeAction === "RELEASE" 
                    ? " Esta acción transferirá los fondos de custodia de forma permanente al freelancer/proveedor." 
                    : " Esta acción cancelará la orden e iniciará el proceso de devolución de fondos al cliente."}
                </p>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] space-y-1 text-gray-300">
                  <p>Monto: ${Number(disputeModalOrder.totalPrice)} USD</p>
                  <p>Cliente: @{disputeModalOrder.client.username}</p>
                  <p>Proveedor: @{disputeModalOrder.service.provider.username}</p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setDisputeModalOrder(null)} className="flex-1 h-12 border border-white/10 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
                  <button onClick={handleResolveDispute} disabled={disputeLoading} className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all flex items-center justify-center ${disputeAction === "RELEASE" ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                    {disputeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Refund Confirmation Modal */}
      <AnimatePresence>
        {refundModalTx && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRefundModalTx(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-2xl z-10"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2 flex items-center gap-3 text-red-500">
                <CreditCard className="text-red-500" /> Reembolso Manual
              </h3>
              <p className="text-xs text-red-500 uppercase font-mono tracking-widest mb-6">Procedimiento de Reversión de Fondos</p>

              <div className="space-y-6">
                <p className="text-xs text-gray-400 leading-relaxed">
                  ¿Confirmas el reembolso manual de la transacción de <strong>${Number(refundModalTx.amount)} USD</strong>? El estado de la transacción cambiará a reembolsado en el sistema y se le notificará al usuario.
                </p>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Razón del Reembolso *</label>
                  <textarea 
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-red-500/40 h-24 resize-none placeholder:text-gray-800"
                    placeholder="Escribe la justificación administrativa..."
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setRefundModalTx(null)} className="flex-1 h-12 border border-white/10 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
                  <button onClick={handleProcessRefund} disabled={refundLoading || !refundReason.trim()} className="flex-1 h-12 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center">
                    {refundLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ejecutar Reembolso"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function KPICard({ label, value, trend, icon: Icon, color, iconColor }: any) {
  return (
    <div className={`rounded-3xl border border-white/5 bg-bg-secondary bg-gradient-to-br ${color} p-6 relative overflow-hidden group`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-green-400">{trend}</span>
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-bold font-mono tracking-tighter text-white">{value}</p>
      </div>
    </div>
  )
}
// creado por Patodev y Invertilo
