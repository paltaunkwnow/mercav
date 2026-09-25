"use client"

import { useState, useEffect } from "react"
import { 
  ShieldAlert, AlertTriangle, Trash2, CheckCircle2, ChevronRight,
  Eye, FileText, Calendar, User, Clock, Loader2, ArrowRight, Check, ShieldCheck
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AdminTicketActions } from "./AdminControls"

interface ReportsTabProps {
  tickets: any[]
}

export function ReportsTab({ tickets }: ReportsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"queue" | "tickets" | "history">("queue")

  // Content reports queue state
  const [reports, setReports] = useState<any[]>([])
  const [groupedReports, setGroupedReports] = useState<any[]>([])
  const [queueLoading, setQueueLoading] = useState(false)

  // Deleted history logs state
  const [deletedHistory, setDeletedHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Modals state
  const [previewContent, setPreviewContent] = useState<any | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewType, setPreviewType] = useState<string>("")

  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)
  const [deleteReason, setDeleteReason] = useState<string>("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [viewBackupData, setViewBackupData] = useState<any | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch reports queue
  const fetchReportsQueue = async () => {
    setQueueLoading(true)
    try {
      const res = await fetch("/api/admin/reports")
      const data = await res.json()
      if (data.success) {
        setReports(data.data)
        groupAndSortReports(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setQueueLoading(false)
    }
  }

  // Fetch deleted history
  const fetchDeletedHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch("/api/admin/moderation/deleted-history")
      const data = await res.json()
      if (data.success) {
        setDeletedHistory(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubTab === "queue") fetchReportsQueue()
    else if (activeSubTab === "history") fetchDeletedHistory()
  }, [activeSubTab])

  // Grouping & Sorting logic
  const groupAndSortReports = (rawReports: any[]) => {
    const groups: Record<string, {
      targetType: string
      targetId: string
      reports: any[]
      reasons: string[]
      reporters: string[]
      newestDate: string
    }> = {}

    rawReports.forEach(rep => {
      const key = `${rep.targetType}-${rep.targetId}`
      if (!groups[key]) {
        groups[key] = {
          targetType: rep.targetType,
          targetId: rep.targetId,
          reports: [],
          reasons: [],
          reporters: [],
          newestDate: rep.createdAt
        }
      }
      groups[key].reports.push(rep)
      if (!groups[key].reasons.includes(rep.reason)) groups[key].reasons.push(rep.reason)
      if (rep.reporter && !groups[key].reporters.includes(`@${rep.reporter.username}`)) {
        groups[key].reporters.push(`@${rep.reporter.username}`)
      }
      if (new Date(rep.createdAt) > new Date(groups[key].newestDate)) {
        groups[key].newestDate = rep.createdAt
      }
    })

    // Sort by report count descending
    const sorted = Object.values(groups).sort((a, b) => b.reports.length - a.reports.length)
    setGroupedReports(sorted)
  }

  // Preview content details
  const handleOpenPreview = async (type: string, id: string) => {
    setPreviewLoading(true)
    setPreviewType(type)
    setPreviewContent(null)
    try {
      const res = await fetch(`/api/admin/moderation/preview/${type}/${id}`)
      const data = await res.json()
      if (data.success) {
        setPreviewContent(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Dismiss reports against content
  const handleDismissReports = async (type: string, id: string) => {
    try {
      const res = await fetch("/api/admin/moderation/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: type, targetId: id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage("Reportes desestimados con éxito.")
        setTimeout(() => setSuccessMessage(null), 3000)
        fetchReportsQueue()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Delete content with reason
  const handleDeleteContent = async () => {
    if (!deleteTarget || !deleteReason.trim()) return

    setDeleteLoading(true)
    try {
      const res = await fetch("/api/admin/moderation/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: deleteTarget.type,
          targetId: deleteTarget.id,
          reason: deleteReason.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage("Contenido eliminado y archivado exitosamente.")
        setTimeout(() => setSuccessMessage(null), 3000)
        setDeleteTarget(null)
        setDeleteReason("")
        fetchReportsQueue()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.02] border border-white/5 w-fit">
        <button 
          onClick={() => setActiveSubTab("queue")}
          className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === "queue" ? "bg-gold text-black shadow-lg shadow-gold/10" : "text-gray-500 hover:text-white"}`}
        >
          Cola de Reportes ({groupedReports.length})
        </button>
        <button 
          onClick={() => setActiveSubTab("tickets")}
          className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === "tickets" ? "bg-gold text-black shadow-lg shadow-gold/10" : "text-gray-500 hover:text-white"}`}
        >
          Tickets de Soporte ({tickets.length})
        </button>
        <button 
          onClick={() => setActiveSubTab("history")}
          className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === "history" ? "bg-gold text-black shadow-lg shadow-gold/10" : "text-gray-500 hover:text-white"}`}
        >
          Historial de Contenido Eliminado
        </button>
      </div>

      {/* Floating Alert message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-bold flex items-center gap-3 shadow-lg"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub tab: Queue */}
      {activeSubTab === "queue" && (
        <div className="space-y-6">
          {queueLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
          ) : groupedReports.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-black/40 p-12 text-center backdrop-blur-xl">
              <div className="h-20 w-20 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Comunidad en Paz</h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">No hay denuncias o reportes de contenido pendientes. El ecosistema está operando en armonía.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {groupedReports.map((group, idx) => (
                <div key={`${group.targetType}-${group.targetId}`} className="rounded-3xl border border-white/5 bg-black/40 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-yellow-500 transition-colors relative shrink-0">
                      <ShieldAlert size={28} />
                      <span className="absolute -top-2.5 -right-2.5 bg-yellow-500 text-black text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border border-[#121212] shadow-xl">
                        {group.reports.length}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-yellow-500/30 text-yellow-500 bg-yellow-500/5">
                          {group.targetType}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">ID: {group.targetId.slice(0, 18)}...</span>
                      </div>
                      <h4 className="text-base font-bold text-white line-clamp-1">Reportado por: {group.reporters.slice(0, 3).join(", ")} {group.reporters.length > 3 && `y ${group.reporters.length - 3} más`}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-gray-500 font-mono">
                        <span>Motivo(s): <span className="text-gray-300 font-bold">{group.reasons.join(", ")}</span></span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Último: {new Date(group.newestDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleOpenPreview(group.targetType, group.targetId)}
                      className="flex-1 md:flex-none h-11 px-5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-gold" /> Previsualizar
                    </button>
                    
                    <button
                      onClick={() => handleDismissReports(group.targetType, group.targetId)}
                      className="flex-1 md:flex-none h-11 px-5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Desestimar
                    </button>

                    <button
                      onClick={() => setDeleteTarget({ type: group.targetType, id: group.targetId })}
                      className="flex-1 md:flex-none h-11 px-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub tab: Tickets */}
      {activeSubTab === "tickets" && (
        <div className="space-y-6">
          <div className="grid gap-6">
            {tickets.map((ticket: any) => {
              const otherParty = ticket.order ? (
                ticket.userId === ticket.order.clientId ? ticket.order.service.provider : ticket.order.client
              ) : null

              return (
                <div key={ticket.id} className="rounded-3xl border border-white/5 bg-black/40 p-8 flex flex-col gap-6 hover:border-gold/20 transition-all group">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex items-center gap-6">
                       <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-gold transition-colors">
                          <ShieldAlert size={28} />
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                               ticket.status === 'OPEN' ? 'border-blue-500/50 text-blue-400 bg-blue-500/5' : 
                               ticket.status === 'RESOLVED' ? 'border-green-500/50 text-green-400 bg-green-500/5' : 
                               'border-gray-500/50 text-gray-400 bg-gray-500/5'
                             }`}>
                               {ticket.status}
                             </span>
                             <span className="text-[10px] text-gold font-bold">Categoría: {
                               ticket.category === "PAYMENT_ERROR" ? "Error en el Pago" :
                               ticket.category === "DOUBLE_PAYMENT" ? "Pago Duplicado" :
                               ticket.category === "FRAUD" ? "Sospecha de Fraude" :
                               ticket.category === "SCAM" ? "Estafa / No entrega" :
                               ticket.category === "TECHNICAL_ISSUE" ? "Problema Técnico" :
                               "Otro"
                             }</span>
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1">{ticket.subject}</h4>
                          <p className="text-xs text-gray-500">Reportado por <span className="text-gray-300">@{ticket.user.username}</span> · {new Date(ticket.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <Button asChild variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 h-10 px-5 text-xs font-bold">
                          <Link href={`/dashboard/pedidos/tickets/${ticket.id}`}>Ver Conversación</Link>
                       </Button>
                       <AdminTicketActions 
                          ticketId={ticket.id} 
                          currentStatus={ticket.status} 
                          otherParty={otherParty} 
                          isPartyInvited={!!ticket.involvedUserId} 
                       />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex flex-wrap gap-8">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                           <User size={14} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Reportante</p>
                           <p className="text-xs font-bold text-white">@{ticket.user.username}</p>
                        </div>
                     </div>

                     {otherParty && (
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                              <User size={14} />
                           </div>
                           <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Contraparte Detectada</p>
                              <p className="text-xs font-bold text-white">@{otherParty.username}</p>
                           </div>
                        </div>
                     )}

                     {ticket.involvedUser && (
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                              <User size={14} />
                           </div>
                           <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Usuario Invitado</p>
                              <p className="text-xs font-bold text-white">@{ticket.involvedUser.username}</p>
                           </div>
                        </div>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sub tab: Deleted History */}
      {activeSubTab === "history" && (
        <div className="space-y-6">
          {historyLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
          ) : deletedHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs italic bg-[#121212]/20 border border-white/5 rounded-3xl">
              No hay registros de contenidos eliminados en el historial de auditoría.
            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400 min-w-[900px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600">
                      <th className="px-6 py-5 font-bold">Tipo / ID Original</th>
                      <th className="px-6 py-5 font-bold">Propietario original</th>
                      <th className="px-6 py-5 font-bold">Razón de eliminación</th>
                      <th className="px-6 py-5 font-bold">Eliminado por</th>
                      <th className="px-6 py-5 font-bold">Fecha / Hora</th>
                      <th className="px-6 py-5 text-right font-bold">Respaldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deletedHistory.map(item => (
                      <tr key={item.id} className="group hover:bg-white/[0.03] transition-all text-xs">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                              {item.contentType}
                            </span>
                            <span className="font-mono text-gray-500">{item.contentId.slice(0, 12)}...</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white font-bold">@{item.contentOwner}</td>
                        <td className="px-6 py-4 text-gray-300 max-w-xs truncate leading-normal">"{item.reason}"</td>
                        <td className="px-6 py-4">
                          <span className="text-blue-400 font-bold">@{item.deletedBy?.username || "ADMIN"}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono">{new Date(item.deletedAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setViewBackupData(item.contentData)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Ver Backup JSON"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Preview Modal */}
      <AnimatePresence>
        {previewType && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewType("")} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-xl shadow-2xl z-10"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2 flex items-center gap-3">
                <Eye className="text-gold" /> Vista Previa
              </h3>
              <p className="text-xs text-gold uppercase font-mono tracking-widest mb-6">Módulo: {previewType}</p>

              {previewLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
              ) : !previewContent ? (
                <p className="py-16 text-center text-gray-500 text-xs italic">No se pudo recuperar la previsualización del contenido.</p>
              ) : (
                <div className="space-y-6">
                  {/* Author / Provider */}
                  <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-tertiary flex items-center justify-center font-bold text-white text-xs">
                      {previewContent.author?.avatar || previewContent.provider?.avatar || previewContent.owner?.avatar || previewContent.company?.avatar ? (
                        <img src={previewContent.author?.avatar || previewContent.provider?.avatar || previewContent.owner?.avatar || previewContent.company?.avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                        (previewContent.author?.name || previewContent.provider?.name || previewContent.owner?.name || previewContent.company?.name || "U").charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">@{previewContent.author?.username || previewContent.provider?.username || previewContent.owner?.username || previewContent.company?.username || "Usuario"}</p>
                      <p className="text-[10px] text-gray-500">Publicado: {new Date(previewContent.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar border-t border-b border-white/5 py-4">
                    <h4 className="font-black text-white text-lg leading-tight">{previewContent.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{previewContent.content || previewContent.description || previewContent.requirements}</p>
                    {previewContent.images && previewContent.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {previewContent.images.map((img: any, i: number) => (
                          <img key={i} src={typeof img === 'string' ? img : img.url} className="rounded-xl aspect-video object-cover" alt="" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button onClick={() => setPreviewType("")} className="px-8 h-12 bg-gold text-black rounded-xl text-xs font-bold hover:bg-yellow-500 transition-all">Entendido</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Content Modal prompting for reason */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-2xl z-10"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2 flex items-center gap-3">
                <Trash2 className="text-red-500" /> Eliminar Contenido
              </h3>
              <p className="text-xs text-red-500 uppercase font-mono tracking-widest mb-6">Confirmación de Moderación Administrativa</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Motivo de eliminación *</label>
                  <textarea 
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-red-500/40 h-32 resize-none placeholder:text-gray-800"
                    placeholder="Justifica por qué estás eliminando este contenido..."
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 h-12 border border-white/10 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
                  <button onClick={handleDeleteContent} disabled={deleteLoading || !deleteReason.trim()} className="flex-1 h-12 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center">
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Eliminación"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JSON Backup Viewer Modal */}
      <AnimatePresence>
        {viewBackupData && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewBackupData(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-2xl h-[70vh] shadow-2xl z-10 flex flex-col"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2">Respaldo JSON de Contenido</h3>
              <p className="text-xs text-gold uppercase font-mono tracking-widest mb-6">Datos completos archivados del post</p>

              <div className="flex-1 min-h-0 bg-black/50 border border-white/5 rounded-2xl p-6 overflow-auto font-mono text-[10px] text-gray-400 custom-scrollbar select-text whitespace-pre">
                {JSON.stringify(viewBackupData, null, 2)}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setViewBackupData(null)} className="px-8 h-12 bg-gold text-black rounded-xl text-xs font-bold hover:bg-yellow-500 transition-all">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
// creado por pato dev y askforvini
