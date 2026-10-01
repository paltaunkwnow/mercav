"use client"

import { useState, useEffect } from "react"
import { 
  DollarSign, Zap, Briefcase, MapPin, Loader2, Search, Lock,
  FileSpreadsheet, FileText, CreditCard, AlertTriangle, Scale, Receipt, RotateCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminDialog } from "./AdminDialog"
import {
  AdminPanel, EmptyState, Field, InlineAlert, KeyValue, LoadingState, Metric, MobileCard, RowButton, StatusBadge, fmt, table,
} from "./ui"
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
    return <LoadingState label="Cargando finanzas…" />
  }

  if (!data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar las finanzas"
        description="Revisá la conexión y volvé a intentar."
        action={
          <button type="button" onClick={fetchFinanceData} className="mv-btn mv-btn-secondary mv-btn-sm">
            <RotateCw className="h-4 w-4" aria-hidden /> Reintentar
          </button>
        }
      />
    )
  }

  const rangeInvalid = !!startDate && !!endDate && new Date(startDate) > new Date(endDate)

  return (
    <div className="flex flex-col gap-8">
      {/* Commissions */}
      <section aria-labelledby="commissions-title" className="flex flex-col gap-3">
        <h2 id="commissions-title" className="text-sm font-semibold text-[var(--text-secondary)]">Comisiones de plataforma</h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total" value={fmt.money(data.commissions.total)} icon={DollarSign} tone="gold" />
          <Metric label="Ads" value={fmt.money(data.commissions.ads)} icon={MapPin} />
          <Metric label="Servicios" value={fmt.money(data.commissions.services)} icon={Zap} />
          <Metric label="Empleos" value={fmt.money(data.commissions.jobs)} icon={Briefcase} />
        </dl>
      </section>

      <div aria-live="polite">{successMessage && <InlineAlert tone="success">{successMessage}</InlineAlert>}</div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-7">
          {/* Disputes */}
          <AdminPanel
            id="disputes"
            title="Órdenes en disputa"
            description="Decidí si los fondos van al proveedor o vuelven al cliente."
            bodyClassName="p-0"
            actions={data.disputedOrders.length > 0 ? <StatusBadge tone="danger">{data.disputedOrders.length} abiertas</StatusBadge> : undefined}
          >
            {data.disputedOrders.length === 0 ? (
              <div className="p-5"><EmptyState icon={Scale} title="No hay disputas abiertas" /></div>
            ) : (
              <ul>
                {data.disputedOrders.map((order: any) => (
                  <li key={order.id} className="flex flex-col gap-4 border-b border-[var(--mv-hairline)] px-5 py-4 last:border-b-0 md:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{order.service.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                        Cliente @{order.client.username} · Proveedor @{order.service.provider.username}
                      </p>
                      <p className="mv-data mt-1 text-xs text-[var(--text-secondary)]">
                        {fmt.money(order.totalPrice)} <span className="text-[var(--text-tertiary)]">· tarifa {fmt.money(order.platformFee)}</span>
                      </p>
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                      <RowButton
                        tone="success"
                        onClick={() => {
                          setDisputeModalOrder(order)
                          setDisputeAction("RELEASE")
                          setErrorMessage(null)
                        }}
                      >
                        Liberar al proveedor
                      </RowButton>
                      <RowButton
                        tone="danger"
                        onClick={() => {
                          setDisputeModalOrder(order)
                          setDisputeAction("REFUND")
                          setErrorMessage(null)
                        }}
                      >
                        Reembolsar
                      </RowButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          {/* Escrow */}
          <AdminPanel
            id="escrow"
            title="Fondos en custodia"
            description="Pagos retenidos que todavía no se liberaron al proveedor."
            bodyClassName="p-0"
          >
            {data.escrowOrders.length === 0 ? (
              <div className="p-5"><EmptyState icon={Lock} title="No hay fondos retenidos" /></div>
            ) : (
              <>
                <div className={cn("hidden sm:block", table.wrap, "max-h-[24rem]")}>
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th scope="col" className={table.th}>Orden</th>
                        <th scope="col" className={table.th}>Partes</th>
                        <th scope="col" className={table.th}>Estado</th>
                        <th scope="col" className={cn(table.th, "text-right")}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.escrowOrders.map((order: any) => (
                        <tr key={order.id} className={table.tr}>
                          <td className={cn(table.td, "max-w-[16rem]")}><p className="truncate text-[var(--text-primary)]">{order.service.title}</p></td>
                          <td className={cn(table.td, "text-xs")}>@{order.client.username} → @{order.service.provider.username}</td>
                          <td className={table.td}><StatusBadge className="mv-data">{order.status}</StatusBadge></td>
                          <td className={cn(table.td, "mv-data whitespace-nowrap text-right text-[var(--text-primary)]")}>{fmt.money(order.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="sm:hidden">
                  {data.escrowOrders.map((order: any) => (
                    <MobileCard key={order.id}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{order.service.title}</p>
                        <span className="mv-data shrink-0 text-sm text-[var(--text-primary)]">{fmt.money(order.totalPrice)}</span>
                      </div>
                      <dl className="flex flex-col gap-1.5">
                        <KeyValue label="Cliente">@{order.client.username}</KeyValue>
                        <KeyValue label="Proveedor">@{order.service.provider.username}</KeyValue>
                        <KeyValue label="Estado" mono>{order.status}</KeyValue>
                      </dl>
                    </MobileCard>
                  ))}
                </ul>
              </>
            )}
          </AdminPanel>
        </div>

        <div className="flex min-w-0 flex-col gap-6 xl:col-span-5">
          {/* Export */}
          <AdminPanel id="export" title="Exportar transacciones" description="Sin fechas se exporta todo el historial cargado.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Desde" htmlFor="export-start">
                <input id="export-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mv-input mv-data h-11 text-sm" />
              </Field>
              <Field label="Hasta" htmlFor="export-end">
                <input
                  id="export-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-invalid={rangeInvalid}
                  aria-describedby={rangeInvalid ? "export-range-error" : undefined}
                  className="mv-input mv-data h-11 text-sm"
                />
              </Field>
            </div>
            {rangeInvalid ? (
              <p id="export-range-error" role="alert" className="mt-2 text-xs text-red-400">La fecha final es anterior a la inicial.</p>
            ) : startDate && !endDate || !startDate && endDate ? (
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">Completá ambas fechas para filtrar por período.</p>
            ) : null}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" onClick={handleExportExcel} className="mv-btn mv-btn-secondary mv-btn-sm">
                <FileSpreadsheet className="h-4 w-4" aria-hidden /> Excel (.xlsx)
              </button>
              <button type="button" onClick={handleExportPDF} className="mv-btn mv-btn-secondary mv-btn-sm">
                <FileText className="h-4 w-4" aria-hidden /> PDF
              </button>
            </div>
          </AdminPanel>

          {/* Manual refunds */}
          <AdminPanel id="refunds" title="Reembolsos manuales" description="Transacciones cobradas que podés devolver." bodyClassName="p-0">
            <div className="border-b border-[var(--mv-hairline)] px-5 py-3 md:px-6">
              <label htmlFor="refund-search" className="sr-only">Buscar por ID, Stripe ID, usuario o email</label>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input 
                  id="refund-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID, Stripe ID, usuario o email"
                  autoComplete="off"
                  className="mv-input h-10 pl-10 text-sm"
                />
              </div>
            </div>
            {filteredTransactions.length === 0 ? (
              <div className="p-5"><EmptyState icon={Receipt} title="No se encontraron transacciones" /></div>
            ) : (
              <ul className="max-h-[28rem] overflow-y-auto overscroll-contain">
                {filteredTransactions.map((tx: any) => (
                  <li key={tx.id} className="flex items-center justify-between gap-4 border-b border-[var(--mv-hairline)] px-5 py-3 last:border-b-0 md:px-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{tx.metadata?.description || "Pago de sistema"}</p>
                      <p className="mv-data truncate text-xs text-[var(--text-tertiary)]" title={tx.stripeId}>{tx.stripeId.slice(0, 16)}…</p>
                      <p className="truncate text-xs text-[var(--text-tertiary)]">
                        <span className="mv-data">{fmt.date(tx.createdAt)}</span> · @{tx.user?.username || "N/A"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p className="mv-data text-sm text-[var(--text-primary)]">{fmt.money(tx.amount, tx.currency || "USD")}</p>
                      {tx.status === "REFUNDED" ? (
                        <StatusBadge tone="neutral">Reembolsado</StatusBadge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundModalTx(tx)
                            setRefundReason("")
                            setErrorMessage(null)
                          }}
                          className="mv-focus inline-flex h-8 items-center rounded-full border border-red-500/25 px-3 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          Reembolsar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      </div>

      {/* Resolve dispute */}
      <AdminDialog
        open={!!disputeModalOrder}
        onClose={() => setDisputeModalOrder(null)}
        tone={disputeAction === "REFUND" ? "danger" : "default"}
        icon={<Scale className="h-5 w-5" />}
        title={disputeAction === "RELEASE" ? "Liberar fondos al proveedor" : "Reembolsar al cliente"}
        description={
          disputeAction === "RELEASE"
            ? "Los fondos en custodia se transfieren al proveedor de forma definitiva."
            : "La orden se cancela y se inicia la devolución al cliente."
        }
        footer={
          <>
            <button type="button" onClick={() => setDisputeModalOrder(null)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
            <button
              type="button"
              onClick={handleResolveDispute}
              disabled={disputeLoading}
              className={cn("mv-btn mv-btn-sm", disputeAction === "RELEASE" ? "mv-btn-primary" : "bg-red-600 text-[#fff] hover:bg-red-700")}
            >
              {disputeLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {disputeAction === "RELEASE" ? "Liberar fondos" : "Confirmar reembolso"}
            </button>
          </>
        }
      >
        {disputeModalOrder && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{disputeModalOrder.service.title}</p>
            <dl className="flex flex-col gap-2 rounded-[1rem] border border-[var(--mv-hairline-strong)] p-4">
              <KeyValue label="Monto" mono>{fmt.money(disputeModalOrder.totalPrice)}</KeyValue>
              <KeyValue label="Cliente">@{disputeModalOrder.client.username}</KeyValue>
              <KeyValue label="Proveedor">@{disputeModalOrder.service.provider.username}</KeyValue>
            </dl>
            {errorMessage && <InlineAlert>{errorMessage}</InlineAlert>}
          </div>
        )}
      </AdminDialog>

      {/* Manual refund */}
      <AdminDialog
        open={!!refundModalTx}
        onClose={() => setRefundModalTx(null)}
        tone="danger"
        icon={<CreditCard className="h-5 w-5" />}
        title="Reembolso manual"
        description={
          refundModalTx
            ? `Vas a devolver ${fmt.money(refundModalTx.amount, refundModalTx.currency || "USD")}. La transacción pasa a reembolsada y se notifica al usuario.`
            : undefined
        }
        footer={
          <>
            <button type="button" onClick={() => setRefundModalTx(null)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
            <button
              type="button"
              onClick={handleProcessRefund}
              disabled={refundLoading || !refundReason.trim()}
              className="mv-btn mv-btn-sm bg-red-600 text-[#fff] hover:bg-red-700"
            >
              {refundLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Reembolsar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Motivo del reembolso" htmlFor="refund-reason" hint="Obligatorio. Queda registrado en la transacción.">
            <textarea 
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              aria-describedby="refund-reason-hint"
              className="mv-input h-24 resize-none py-3 text-sm"
              placeholder="Justificación administrativa"
            />
          </Field>
          {errorMessage && <InlineAlert>{errorMessage}</InlineAlert>}
        </div>
      </AdminDialog>
    </div>
  )
}
// creado por pato dev y askforvini
