"use client"

import { useState, useEffect } from "react"
import { 
  Search, Users, ShieldCheck, Lock, ShieldAlert,
  Loader2, ChevronDown, MessageSquare, Paperclip, History, UserX
} from "@/components/icons"
import { AdminUserActions } from "./AdminControls"
import { AdminDialog } from "./AdminDialog"
import { cn } from "@/lib/utils"
import {
  AdminPanel, Avatar, EmptyState, Field, IconButton, InlineAlert, KeyValue, LoadingState, MobileCard, StatusBadge, fmt, table,
} from "./ui"

const PLANS = [
  { value: "FREE", label: "Free" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "EMPRESA", label: "Empresa" },
  { value: "ELITE", label: "Elite" },
] as const

const planLabel = (plan: string) => PLANS.find((p) => p.value === plan)?.label ?? (plan === "PRO" ? "Professional" : plan)
const planTone = (plan: string) =>
  plan === "PROFESSIONAL" || plan === "PRO" ? "gold" : plan === "EMPRESA" || plan === "ELITE" ? "info" : "neutral"

interface UsersAdminTabProps {
  initialUsers: any[]
}

export function UsersAdminTab({ initialUsers }: UsersAdminTabProps) {
  const [users, setUsers] = useState<any[]>(initialUsers)
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)

  // Modals state
  const [planModalUser, setPlanModalUser] = useState<any | null>(null)
  const [plan, setPlan] = useState<string>("FREE")
  const [durationDays, setDurationDays] = useState<string>("30")
  const [planReason, setPlanReason] = useState<string>("")
  const [planLoading, setPlanLoading] = useState(false)

  const [sanctionsUser, setSanctionsUser] = useState<any | null>(null)
  const [sanctions, setSanctions] = useState<any[]>([])
  const [sanctionsLoading, setSanctionsLoading] = useState(false)

  const [chatsUser, setChatsUser] = useState<any | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [chatsLoading, setChatsLoading] = useState(false)
  const [activeConv, setActiveConv] = useState<any | null>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Search logic
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (data.success) {
          setUsers(data.data)
        }
      } catch (err) {
        console.error("Error searching users:", err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchUsers()
    }, 400)

    return () => clearTimeout(timer)
  }, [q])

  // Fetch sanctions logic
  const handleOpenSanctions = async (user: any) => {
    setSanctionsUser(user)
    setSanctionsLoading(true)
    setSanctions([])
    try {
      const res = await fetch(`/api/admin/users/${user.id}/sanctions`)
      const data = await res.json()
      if (data.success) {
        setSanctions(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSanctionsLoading(false)
    }
  }

  // Fetch chats logic
  const handleOpenChats = async (user: any) => {
    setChatsUser(user)
    setChatsLoading(true)
    setConversations([])
    setActiveConv(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/chats`)
      const data = await res.json()
      if (data.success) {
        setConversations(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setChatsLoading(false)
    }
  }

  // Handle plan change logic
  const handlePlanSubmit = async () => {
    if (!planReason.trim()) {
      setErrorMsg("Debes especificar la razón del cambio de plan.")
      return
    }

    setPlanLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${planModalUser.id}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          durationDays: durationDays ? parseInt(durationDays) : 0,
          reason: planReason.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Update local user state
        setUsers(prev => prev.map(u => u.id === planModalUser.id ? { ...u, plan: plan } : u))
        setPlanModalUser(null)
        setPlanReason("")
        setDurationDays("30")
      } else {
        setErrorMsg(data.error || "Error al actualizar el plan.")
      }
    } catch (e) {
      setErrorMsg("Error de conexión.")
    } finally {
      setPlanLoading(false)
    }
  }

  const closePlan = () => setPlanModalUser(null)

  const userStatus = (user: any) =>
    user.isSanctioned ? (
      <StatusBadge tone="danger"><ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Sancionado</StatusBadge>
    ) : user.isVerified ? (
      <StatusBadge tone="info"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verificado</StatusBadge>
    ) : (
      <StatusBadge>Sin verificar</StatusBadge>
    )

  const planButton = (user: any) => (
    <button
      type="button"
      onClick={() => {
        setPlanModalUser(user)
        setPlan(user.plan)
        setErrorMsg(null)
      }}
      aria-label={`Plan ${planLabel(user.plan)}. Cambiar plan de ${user.name}`}
      className="mv-focus group inline-flex items-center gap-1 rounded-full"
    >
      <StatusBadge tone={planTone(user.plan)} className="group-hover:border-[var(--color-border-gold)]">
        {planLabel(user.plan)}
        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
      </StatusBadge>
    </button>
  )

  const rowActions = (user: any, isAdmin: boolean) => (
    <div className="flex items-center justify-end gap-1.5">
      <IconButton icon={History} label={`Historial de sanciones de ${user.name}`} onClick={() => handleOpenSanctions(user)} />
      <IconButton icon={MessageSquare} label={`Auditar conversaciones de ${user.name}`} onClick={() => handleOpenChats(user)} />
      <span aria-hidden className="mx-0.5 h-6 w-px bg-[var(--mv-hairline-strong)]" />
      <AdminUserActions 
        userId={user.id} 
        userName={user.name} 
        isVerified={user.isVerified} 
        isSanctioned={user.isSanctioned} 
        targetIsAdmin={isAdmin}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <AdminPanel
        id="users-directory"
        title="Directorio"
        description={loading ? "Buscando…" : `${fmt.number(users.length)} ${users.length === 1 ? "cuenta" : "cuentas"}${q ? ` para “${q}”` : ""}`}
        bodyClassName="p-0"
        actions={
          <div className="relative w-full sm:w-80">
            <label htmlFor="users-search" className="sr-only">Buscar por nombre, usuario, email, NIT o CI</label>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input 
              id="users-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, usuario, email, NIT o CI" 
              autoComplete="off"
              className="mv-input h-10 pl-10 pr-10 text-sm"
            />
            {loading && <Loader2 aria-hidden className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold" />}
          </div>
        }
      >
        {users.length === 0 ? (
          <div className="p-5">
            {loading ? (
              <LoadingState label="Buscando usuarios…" />
            ) : (
              <EmptyState icon={UserX} title="Ningún usuario coincide" description="Probá con otro nombre, email, NIT o CI." />
            )}
          </div>
        ) : (
          <div aria-busy={loading} className={cn("transition-opacity duration-200", loading && "opacity-60")}>
            {/* Desktop */}
            <div className={cn("hidden lg:block", table.wrap)}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th scope="col" className={table.th}>Usuario</th>
                    <th scope="col" className={table.th}>Cuenta</th>
                    <th scope="col" className={table.th}>2FA</th>
                    <th scope="col" className={table.th}>Plan</th>
                    <th scope="col" className={table.th}>Estado</th>
                    <th scope="col" className={cn(table.th, "text-right")}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isAdmin = user.roles?.some((r: any) => r.role === 'ADMIN');
                    return (
                      <tr key={user.id} className={table.tr}>
                        <td className={table.td}>
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} src={user.avatar} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--text-primary)]">{user.name}</p>
                              <p className="truncate text-xs text-[var(--text-tertiary)]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={table.td}>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)]">@{user.username}</span>
                            {isAdmin && <StatusBadge tone="info" className="h-5 px-2 text-[0.6875rem]">Admin</StatusBadge>}
                          </div>
                          <p className="mv-data mt-0.5 text-xs text-[var(--text-tertiary)]">
                            {user.nit && `NIT ${user.nit}`}{user.nit && user.ci && " · "}{user.ci && `CI ${user.ci}`}
                            {!user.nit && !user.ci && "Sin NIT ni CI"}
                          </p>
                        </td>
                        <td className={table.td}>
                          {user.twoFactorEnabled ? (
                            <StatusBadge tone="success"><Lock className="h-3 w-3" aria-hidden /> Activo</StatusBadge>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)]">No</span>
                          )}
                        </td>
                        <td className={table.td}>{planButton(user)}</td>
                        <td className={table.td}>{userStatus(user)}</td>
                        <td className={table.td}>{rowActions(user, isAdmin)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet */}
            <ul className="lg:hidden">
              {users.map(user => {
                const isAdmin = user.roles?.some((r: any) => r.role === 'ADMIN');
                return (
                  <MobileCard key={user.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={user.name} src={user.avatar} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--text-primary)]">{user.name}</p>
                          <p className="truncate text-xs text-[var(--text-tertiary)]">@{user.username} · {user.email}</p>
                        </div>
                      </div>
                      {userStatus(user)}
                    </div>
                    <dl className="flex flex-col gap-1.5">
                      <KeyValue label="Plan">{planButton(user)}</KeyValue>
                      <KeyValue label="2FA">{user.twoFactorEnabled ? "Activo" : "No"}</KeyValue>
                      {(user.nit || user.ci) && (
                        <KeyValue label="NIT / CI" mono>{[user.nit, user.ci].filter(Boolean).join(" · ")}</KeyValue>
                      )}
                      {isAdmin && <KeyValue label="Rol">Administrador</KeyValue>}
                    </dl>
                    {rowActions(user, isAdmin)}
                  </MobileCard>
                )
              })}
            </ul>
          </div>
        )}
      </AdminPanel>

      {/* Plan */}
      <AdminDialog
        open={!!planModalUser}
        onClose={closePlan}
        title="Cambiar plan"
        description={planModalUser ? `${planModalUser.name} · @${planModalUser.username}` : undefined}
        footer={
          <>
            <button type="button" onClick={closePlan} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
            <button type="button" onClick={handlePlanSubmit} disabled={planLoading} className="mv-btn mv-btn-primary mv-btn-sm">
              {planLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Guardar plan
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Plan</legend>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-2.5 rounded-[0.875rem] border px-3.5 text-sm font-medium transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold",
                    plan === option.value
                      ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                      : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <input
                    type="radio"
                    name="admin-plan"
                    value={option.value}
                    checked={plan === option.value}
                    onChange={() => setPlan(option.value)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Duración en días" htmlFor="plan-days" hint="Usá 0 para que no venza.">
            <input 
              id="plan-days"
              type="number"
              inputMode="numeric"
              min={0}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              aria-describedby="plan-days-hint"
              className="mv-input mv-data"
              placeholder="30"
            />
          </Field>

          <Field label="Motivo del cambio" htmlFor="plan-reason" hint="Obligatorio. Por ejemplo: cortesía, compensación de soporte.">
            <textarea 
              id="plan-reason"
              value={planReason}
              onChange={(e) => setPlanReason(e.target.value)}
              aria-describedby="plan-reason-hint"
              aria-invalid={!!errorMsg && !planReason.trim()}
              className="mv-input h-24 resize-none py-3 text-sm"
              placeholder="Explicá por qué cambiás el plan manualmente"
            />
          </Field>

          {errorMsg && <InlineAlert>{errorMsg}</InlineAlert>}
        </div>
      </AdminDialog>

      {/* Sanctions history */}
      <AdminDialog
        open={!!sanctionsUser}
        onClose={() => setSanctionsUser(null)}
        icon={<History className="h-5 w-5" />}
        title="Historial de sanciones"
        description={sanctionsUser ? `${sanctionsUser.name} · @${sanctionsUser.username}` : undefined}
      >
        {sanctionsLoading ? (
          <LoadingState label="Cargando historial…" />
        ) : sanctions.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Sin antecedentes" description="Esta cuenta no tiene sanciones ni suspensiones registradas." />
        ) : (
          <ol className="flex flex-col gap-3">
            {sanctions.map((san, idx) => (
              <li key={san.id || idx} className="rounded-[1rem] border border-[var(--mv-hairline-strong)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Sanción {sanctions.length - idx}</p>
                  <StatusBadge tone={san.isActive ? "danger" : "neutral"}>{san.isActive ? "Vigente" : "Finalizada"}</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{san.reason}</p>
                <dl className="mt-3 flex flex-col gap-1.5 border-t border-[var(--mv-hairline)] pt-3">
                  <KeyValue label="Desde" mono>{fmt.date(san.startDate)}</KeyValue>
                  {san.endDate && <KeyValue label="Hasta" mono>{fmt.date(san.endDate)}</KeyValue>}
                  <KeyValue label="Aplicada por">{san.suspendedBy}</KeyValue>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </AdminDialog>

      {/* Chat audit */}
      <AdminDialog
        open={!!chatsUser}
        onClose={() => setChatsUser(null)}
        size="xl"
        icon={<MessageSquare className="h-5 w-5" />}
        title="Auditoría de conversaciones"
        description={chatsUser ? `${chatsUser.name} · @${chatsUser.username}. Solo lectura.` : undefined}
        bodyClassName="p-0 sm:p-0"
      >
        {chatsLoading ? (
          <LoadingState label="Cargando conversaciones…" />
        ) : conversations.length === 0 ? (
          <div className="p-5"><EmptyState icon={MessageSquare} title="Sin conversaciones" description="Esta cuenta no tiene conversaciones de mensajería." /></div>
        ) : (
          <div className="grid h-[min(70dvh,40rem)] grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)]">
            <div className={cn("min-h-0 overflow-y-auto border-[var(--mv-hairline)] md:border-r", activeConv && "hidden md:block")}>
              <p className="sticky top-0 border-b border-[var(--mv-hairline)] bg-bg-secondary px-5 py-3 text-xs font-semibold text-[var(--text-secondary)]">
                {conversations.length} {conversations.length === 1 ? "conversación" : "conversaciones"}
              </p>
              <ul className="p-2">
                {conversations.map(conv => {
                  const otherParticipant = conv.participants.find((p: any) => p.id !== chatsUser.id) || conv.participants[0]
                  const lastMsg = conv.messages?.[conv.messages.length - 1]
                  const current = activeConv?.id === conv.id
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => setActiveConv(conv)}
                        aria-current={current ? "true" : undefined}
                        className={cn(
                          "mv-focus flex w-full items-center gap-3 rounded-[0.875rem] p-3 text-left transition-colors duration-150",
                          current ? "bg-[var(--mv-gold-wash)]" : "hover:bg-[var(--mv-panel-hover)]",
                        )}
                      >
                        <Avatar name={otherParticipant?.name} src={otherParticipant?.avatar} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">@{otherParticipant?.username || "Otro"}</span>
                          <span className="block truncate text-xs text-[var(--text-tertiary)]">{lastMsg ? lastMsg.content : "Sin mensajes"}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className={cn("flex min-h-0 flex-col", !activeConv && "hidden md:flex")}>
              {activeConv ? (
                <>
                  <div className="flex items-center gap-3 border-b border-[var(--mv-hairline)] px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setActiveConv(null)}
                      className="mv-focus -ml-2 inline-flex h-10 items-center rounded-full px-2 text-sm text-[var(--text-secondary)] md:hidden"
                    >
                      ← Volver
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        Con @{activeConv.participants.find((p: any) => p.id !== chatsUser.id)?.username || "usuario"}
                      </p>
                      <p className="mv-data truncate text-xs text-[var(--text-tertiary)]">{activeConv.id}</p>
                    </div>
                  </div>
                  <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    {activeConv.messages?.length === 0 ? (
                      <li className="py-10 text-center text-sm text-[var(--text-tertiary)]">No hay mensajes en esta conversación.</li>
                    ) : (
                      activeConv.messages.map((msg: any) => {
                        const isTargetSender = msg.senderId === chatsUser.id
                        return (
                          <li key={msg.id} className={cn("flex flex-col", isTargetSender ? "items-end" : "items-start")}>
                            <p className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                              <span className="font-semibold">@{msg.sender.username}</span>
                              <time className="mv-data" dateTime={msg.createdAt}>{fmt.dateTime(msg.createdAt)}</time>
                            </p>
                            <div
                              className={cn(
                                "max-w-[85%] rounded-[1rem] border px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-md",
                                isTargetSender
                                  ? "rounded-tr-sm border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                                  : "rounded-tl-sm border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
                              )}
                            >
                              {msg.content}
                              {msg.attachmentUrl && (
                                <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="mv-link mt-2 flex items-center gap-1.5 text-xs">
                                  <Paperclip className="h-3.5 w-3.5" aria-hidden /> Ver adjunto
                                </a>
                              )}
                            </div>
                          </li>
                        )
                      })
                    )}
                  </ol>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8">
                  <EmptyState icon={Users} title="Elegí una conversación" description="Seleccioná un chat de la lista para ver el historial completo." />
                </div>
              )}
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  )
}
// creado por pato dev y askforvini
