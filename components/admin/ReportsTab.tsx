"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { 
  Trash2, CheckCircle2, Eye, FileText, Loader2, Check, Flag, LifeBuoy, Archive, ArrowUpRight
} from "lucide-react"
import Link from "next/link"
import { AdminTicketActions } from "./AdminControls"
import { AdminDialog } from "./AdminDialog"
import { cn } from "@/lib/utils"
import {
  Avatar, EmptyState, Field, InlineAlert, KeyValue, LoadingState, MobileCard, RowButton, StatusBadge, fmt, table, AdminPanel,
} from "./ui"

const TARGET_LABELS: Record<string, string> = {
  POST: "Publicación",
  SERVICE: "Servicio",
  SPACE: "Espacio",
  JOB: "Vacante",
  JOB_POST: "Vacante",
  USER: "Usuario",
  COMMENT: "Comentario",
  COMPANY: "Empresa",
}
const targetLabel = (t: string) => TARGET_LABELS[t?.toUpperCase?.()] ?? t

const TICKET_STATUS: Record<string, { label: string; tone: "info" | "success" | "neutral" | "gold" }> = {
  OPEN: { label: "Abierto", tone: "info" },
  IN_PROGRESS: { label: "En curso", tone: "gold" },
  RESOLVED: { label: "Resuelto", tone: "success" },
  CLOSED: { label: "Cerrado", tone: "neutral" },
}

const TICKET_CATEGORY: Record<string, string> = {
  PAYMENT_ERROR: "Error en el pago",
  DOUBLE_PAYMENT: "Pago duplicado",
  FRAUD: "Sospecha de fraude",
  SCAM: "Estafa o no entrega",
  TECHNICAL_ISSUE: "Problema técnico",
}

const SUBTABS = [
  { id: "queue", label: "Cola de reportes", icon: Flag },
  { id: "tickets", label: "Tickets de soporte", icon: LifeBuoy },
  { id: "history", label: "Contenido eliminado", icon: Archive },
] as const

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

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    const jump = event.key === "Home" ? 0 : event.key === "End" ? SUBTABS.length - 1 : null
    if (!delta && jump === null) return
    event.preventDefault()
    const next = jump ?? (index + delta + SUBTABS.length) % SUBTABS.length
    setActiveSubTab(SUBTABS[next].id)
    tabRefs.current[next]?.focus()
  }
  const counts: Record<string, number | null> = {
    queue: reports.length || groupedReports.length ? groupedReports.length : null,
    tickets: tickets.length,
    history: deletedHistory.length || null,
  }

  const author = previewContent?.author || previewContent?.provider || previewContent?.owner || previewContent?.company

  return (
    <div className="flex flex-col gap-6">
      {/* Sub tabs */}
      <div role="tablist" aria-label="Vistas de reportes" className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1">
        {SUBTABS.map(({ id, label, icon: Icon }, index) => {
          const selected = activeSubTab === id
          return (
            <button
              key={id}
              ref={(el) => { tabRefs.current[index] = el }}
              role="tab"
              id={`reports-tab-${id}`}
              aria-selected={selected}
              aria-controls={`reports-panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(e) => onTabKey(e, index)}
              onClick={() => setActiveSubTab(id)}
              className={cn(
                "mv-focus inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                selected
                  ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]",
              )}
            >
              <Icon className={cn("h-4 w-4", selected ? "text-gold" : "text-[var(--text-tertiary)]")} aria-hidden />
              {label}
              {counts[id] !== null ? <span className="mv-data text-xs text-[var(--text-tertiary)]">{counts[id]}</span> : null}
            </button>
          )
        })}
      </div>

      <div aria-live="polite">{successMessage && <InlineAlert tone="success">{successMessage}</InlineAlert>}</div>

      {/* Queue */}
      {activeSubTab === "queue" && (
        <div role="tabpanel" id="reports-panel-queue" aria-labelledby="reports-tab-queue">
          {queueLoading ? (
            <LoadingState label="Cargando reportes…" />
          ) : groupedReports.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No hay reportes pendientes" description="Cuando alguien reporte contenido, aparecerá acá agrupado por elemento." />
          ) : (
            <AdminPanel id="queue" title="Pendientes de revisión" description="Agrupados por contenido, del más reportado al menos reportado." bodyClassName="p-0">
              <ul>
                {groupedReports.map((group) => (
                  <li
                    key={`${group.targetType}-${group.targetId}`}
                    className="flex flex-col gap-4 border-b border-[var(--mv-hairline)] px-5 py-4 last:border-b-0 md:px-6 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[0.875rem] border border-red-500/25 bg-red-500/10 text-red-400">
                        <span className="mv-data text-sm font-medium leading-none">{group.reports.length}</span>
                        <span className="sr-only">reportes</span>
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="neutral">{targetLabel(group.targetType)}</StatusBadge>
                          <span className="mv-data truncate text-xs text-[var(--text-tertiary)]" title={group.targetId}>{group.targetId.slice(0, 18)}…</span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-semibold">{group.reasons.join(", ")}</span>
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {group.reporters.length ? (
                            <>Reportado por {group.reporters.slice(0, 3).join(", ")}{group.reporters.length > 3 && ` y ${group.reporters.length - 3} más`} · </>
                          ) : null}
                          Último <span className="mv-data">{fmt.date(group.newestDate)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex">
                      <RowButton onClick={() => handleOpenPreview(group.targetType, group.targetId)}>
                        <Eye className="h-4 w-4" aria-hidden /> Ver
                      </RowButton>
                      <RowButton tone="success" onClick={() => handleDismissReports(group.targetType, group.targetId)}>
                        <Check className="h-4 w-4" aria-hidden /> Desestimar
                      </RowButton>
                      <RowButton tone="danger" onClick={() => setDeleteTarget({ type: group.targetType, id: group.targetId })}>
                        <Trash2 className="h-4 w-4" aria-hidden /> Eliminar
                      </RowButton>
                    </div>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          )}
        </div>
      )}

      {/* Tickets */}
      {activeSubTab === "tickets" && (
        <div role="tabpanel" id="reports-panel-tickets" aria-labelledby="reports-tab-tickets">
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No hay tickets" description="Los tickets que abran los usuarios desde sus pedidos aparecerán acá." />
          ) : (
            <AdminPanel id="tickets" title="Tickets" description="Del más reciente al más antiguo." bodyClassName="p-0">
              <ul>
                {tickets.map((ticket: any) => {
                  const otherParty = ticket.order ? (
                    ticket.userId === ticket.order.clientId ? ticket.order.service.provider : ticket.order.client
                  ) : null
                  const st = TICKET_STATUS[ticket.status] ?? { label: ticket.status, tone: "neutral" as const }

                  return (
                    <li key={ticket.id} className="flex flex-col gap-4 border-b border-[var(--mv-hairline)] px-5 py-4 last:border-b-0 md:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                            <span className="text-xs text-[var(--text-secondary)]">{TICKET_CATEGORY[ticket.category] ?? "Otro"}</span>
                          </div>
                          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{ticket.subject}</h3>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Abierto <span className="mv-data">{fmt.dateTime(ticket.createdAt)}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link href={`/dashboard/pedidos/tickets/${ticket.id}`} className="mv-btn mv-btn-secondary mv-btn-sm">
                            Ver conversación <ArrowUpRight className="h-4 w-4" aria-hidden />
                          </Link>
                          <AdminTicketActions 
                            ticketId={ticket.id} 
                            currentStatus={ticket.status} 
                            otherParty={otherParty} 
                            isPartyInvited={!!ticket.involvedUserId} 
                          />
                        </div>
                      </div>

                      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                        <Party label="Reporta" username={ticket.user.username} />
                        {otherParty && <Party label="Contraparte" username={otherParty.username} />}
                        {ticket.involvedUser && <Party label="Invitado al ticket" username={ticket.involvedUser.username} />}
                      </dl>
                    </li>
                  )
                })}
              </ul>
            </AdminPanel>
          )}
        </div>
      )}

      {/* Deleted history */}
      {activeSubTab === "history" && (
        <div role="tabpanel" id="reports-panel-history" aria-labelledby="reports-tab-history">
          {historyLoading ? (
            <LoadingState label="Cargando historial…" />
          ) : deletedHistory.length === 0 ? (
            <EmptyState icon={Archive} title="Sin contenido eliminado" description="Cada eliminación desde moderación queda archivada acá con su respaldo." />
          ) : (
            <AdminPanel id="history" title="Contenido eliminado" description="Cada registro conserva una copia del contenido original." bodyClassName="p-0">
              <div className={cn("hidden md:block", table.wrap)}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={table.th}>Contenido</th>
                      <th scope="col" className={table.th}>Propietario</th>
                      <th scope="col" className={table.th}>Motivo</th>
                      <th scope="col" className={table.th}>Eliminado por</th>
                      <th scope="col" className={table.th}>Fecha</th>
                      <th scope="col" className={cn(table.th, "text-right")}>Respaldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedHistory.map(item => (
                      <tr key={item.id} className={table.tr}>
                        <td className={table.td}>
                          <StatusBadge>{targetLabel(item.contentType)}</StatusBadge>
                          <p className="mv-data mt-1 text-xs text-[var(--text-tertiary)]" title={item.contentId}>{item.contentId.slice(0, 12)}…</p>
                        </td>
                        <td className={cn(table.td, "text-[var(--text-primary)]")}>@{item.contentOwner}</td>
                        <td className={cn(table.td, "max-w-xs")}>
                          <p className="line-clamp-2" title={item.reason}>{item.reason}</p>
                        </td>
                        <td className={table.td}>@{item.deletedBy?.username || "admin"}</td>
                        <td className={cn(table.td, "mv-data whitespace-nowrap text-xs")}>{fmt.dateTime(item.deletedAt)}</td>
                        <td className={cn(table.td, "text-right")}>
                          <RowButton onClick={() => setViewBackupData(item.contentData)}>
                            <FileText className="h-4 w-4" aria-hidden /> Ver
                          </RowButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="md:hidden">
                {deletedHistory.map(item => (
                  <MobileCard key={item.id}>
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge>{targetLabel(item.contentType)}</StatusBadge>
                      <span className="mv-data text-xs text-[var(--text-tertiary)]">{fmt.dateTime(item.deletedAt)}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{item.reason}</p>
                    <dl className="flex flex-col gap-1.5">
                      <KeyValue label="Propietario">@{item.contentOwner}</KeyValue>
                      <KeyValue label="Eliminado por">@{item.deletedBy?.username || "admin"}</KeyValue>
                      <KeyValue label="ID" mono>{item.contentId.slice(0, 12)}…</KeyValue>
                    </dl>
                    <RowButton className="self-start" onClick={() => setViewBackupData(item.contentData)}>
                      <FileText className="h-4 w-4" aria-hidden /> Ver respaldo
                    </RowButton>
                  </MobileCard>
                ))}
              </ul>
            </AdminPanel>
          )}
        </div>
      )}

      {/* Preview */}
      <AdminDialog
        open={!!previewType}
        onClose={() => setPreviewType("")}
        icon={<Eye className="h-5 w-5" />}
        title="Vista previa"
        description={previewType ? `${targetLabel(previewType)} reportado` : undefined}
        footer={
          <button type="button" onClick={() => setPreviewType("")} className="mv-btn mv-btn-secondary mv-btn-sm">Cerrar</button>
        }
      >
        {previewLoading ? (
          <LoadingState label="Cargando contenido…" />
        ) : !previewContent ? (
          <EmptyState title="No se pudo cargar" description="El contenido pudo haber sido eliminado o no está disponible." />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={author?.name || "U"} src={author?.avatar} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">@{author?.username || "usuario"}</p>
                <p className="text-xs text-[var(--text-tertiary)]">Publicado <span className="mv-data">{fmt.date(previewContent.createdAt)}</span></p>
              </div>
            </div>
            <div className="rounded-[1rem] border border-[var(--mv-hairline-strong)] p-4">
              {previewContent.title && <h3 className="mb-2 font-semibold text-[var(--text-primary)]">{previewContent.title}</h3>}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {previewContent.content || previewContent.description || previewContent.requirements}
              </p>
              {previewContent.images && previewContent.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {previewContent.images.map((img: any, i: number) => (
                    <img key={i} src={typeof img === 'string' ? img : img.url} className="aspect-video rounded-[0.75rem] object-cover" alt="" loading="lazy" decoding="async" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminDialog>

      {/* Delete with reason */}
      <AdminDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        title="Eliminar contenido"
        description="Se borra del sitio, se archiva una copia y se cierran sus reportes. No se puede deshacer desde acá."
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
            <button
              type="button"
              onClick={handleDeleteContent}
              disabled={deleteLoading || !deleteReason.trim()}
              className="mv-btn mv-btn-sm bg-red-600 text-[#fff] hover:bg-red-700"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Eliminar contenido
            </button>
          </>
        }
      >
        <Field label="Motivo de la eliminación" htmlFor="delete-reason" hint="Obligatorio. Queda en el historial de contenido eliminado.">
          <textarea 
            id="delete-reason"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            aria-describedby="delete-reason-hint"
            className="mv-input h-32 resize-none py-3 text-sm"
            placeholder="Explicá qué regla incumple este contenido"
          />
        </Field>
      </AdminDialog>

      {/* JSON backup */}
      <AdminDialog
        open={!!viewBackupData}
        onClose={() => setViewBackupData(null)}
        size="lg"
        icon={<FileText className="h-5 w-5" />}
        title="Respaldo del contenido"
        description="Copia completa archivada al momento de eliminarlo."
        footer={
          <button type="button" onClick={() => setViewBackupData(null)} className="mv-btn mv-btn-secondary mv-btn-sm">Cerrar</button>
        }
      >
        <pre className="mv-data max-h-[55dvh] select-text overflow-auto whitespace-pre rounded-[1rem] border border-[var(--mv-hairline-strong)] bg-bg-primary/60 p-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          {JSON.stringify(viewBackupData, null, 2)}
        </pre>
      </AdminDialog>
    </div>
  )
}

function Party({ label, username }: { label: string; username: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[var(--text-tertiary)]">{label}</dt>
      <dd className="font-medium text-[var(--text-primary)]">@{username}</dd>
    </div>
  )
}
// creado por pato dev y askforvini
