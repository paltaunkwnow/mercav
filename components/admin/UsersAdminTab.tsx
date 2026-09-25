"use client"

import { useState, useEffect } from "react"
import { 
  Search, Users, Crown, ShieldCheck, Lock, Globe, ShieldAlert,
  Loader2, Check, Calendar, ChevronRight, Clock, MessageSquare, AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AdminUserActions } from "./AdminControls"
import { CustomSelect } from "@/components/ui/CustomSelect"

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

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl">
        <div>
          <h3 className="font-bold text-lg">Directorio de Miembros</h3>
          <p className="text-xs text-gray-500 mt-1">Busca por nombre, usuario, email, NIT o CI</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por Nombre / NIT / CI..." 
            className="bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-xs outline-none focus:border-gold/50 transition-all w-full text-white placeholder:text-gray-600"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gold" />}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400 min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600">
                <th className="px-6 py-5 font-bold">Profesional</th>
                <th className="px-6 py-5 font-bold">Identificación / Cuenta</th>
                <th className="px-6 py-5 font-bold">Seguridad</th>
                <th className="px-6 py-5 font-bold">Plan</th>
                <th className="px-6 py-5 font-bold text-center">Estado</th>
                <th className="px-6 py-5 text-right font-bold">Moderación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500 italic text-xs">
                    Ningún usuario coincide con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const isAdmin = user.roles?.some((r: any) => r.role === 'ADMIN');
                  return (
                    <tr key={user.id} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-bg-tertiary flex items-center justify-center font-bold text-white text-xs border border-white/5">
                            {user.avatar ? (
                              <img src={user.avatar} className="h-full w-full object-cover" alt="" />
                            ) : (
                              user.name.charAt(0)
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-semibold text-base">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-xs">@{user.username}</span>
                            {isAdmin && (
                              <div className="flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30">
                                <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                                <span className="text-[8px] text-blue-400 font-black uppercase tracking-tighter">ADMIN</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {user.nit && `NIT: ${user.nit}`} {user.ci && `| CI: ${user.ci}`}
                            {!user.nit && !user.ci && "Sin NIT / CI"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {user.twoFactorEnabled ? (
                            <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-lg border border-green-400/20 text-[10px] font-bold">
                              <Lock className="h-3 w-3" /> 2FA ACTIVO
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-500 bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-[10px]">
                              <Globe className="h-3 w-3" /> NO 2FA
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => {
                            setPlanModalUser(user)
                            setPlan(user.plan)
                            setErrorMsg(null)
                          }}
                          className={`text-[10px] font-black px-2.5 py-1 rounded-md border text-left flex items-center gap-1.5 hover:scale-105 transition-all ${
                            user.plan === 'PROFESSIONAL' || user.plan === 'PRO' ? 'bg-gold text-black border-gold' : 
                            user.plan === 'ELITE' ? 'bg-purple-500 text-white border-purple-500' :
                            user.plan === 'EMPRESA' ? 'bg-blue-500 text-white border-blue-500' :
                            'bg-white/10 text-white border-white/10'
                          }`}
                          title="Cambiar Plan"
                        >
                          <span>{user.plan}</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {user.isSanctioned ? (
                           <div className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 text-[10px] font-black">
                             <ShieldAlert className="h-3 w-3" /> SANCIONADO
                           </div>
                        ) : user.isVerified ? (
                          <div className="inline-flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full border border-blue-400/20 text-[10px] font-bold">
                             <ShieldCheck className="h-3 w-3" /> VERIFICADO
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-gray-500 bg-gray-500/10 px-2.5 py-1 rounded-full border border-gray-500/20 text-[10px]">
                            PENDIENTE
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Sanciones History Button */}
                          <button
                            onClick={() => handleOpenSanctions(user)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs"
                            title="Historial de Sanciones"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>

                          {/* Chat Inspector Button */}
                          <button
                            onClick={() => handleOpenChats(user)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs"
                            title="Auditar Conversaciones"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          <AdminUserActions 
                            userId={user.id} 
                            userName={user.name} 
                            isVerified={user.isVerified} 
                            isSanctioned={user.isSanctioned} 
                            targetIsAdmin={isAdmin}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Modal */}
      <AnimatePresence>
        {planModalUser && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPlanModalUser(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-2xl z-10"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2">Cambiar Plan</h3>
              <p className="text-xs text-gold uppercase font-mono tracking-widest mb-6">Usuario: @{planModalUser.username}</p>

              <div className="space-y-6">
                <div>
                  <CustomSelect
                    label="Plan Comercial"
                    value={plan}
                    onChange={(val) => setPlan(val)}
                    options={[
                      { value: "FREE", label: "FREE" },
                      { value: "PROFESSIONAL", label: "PROFESSIONAL" },
                      { value: "EMPRESA", label: "EMPRESA" },
                      { value: "ELITE", label: "ELITE" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Duración (Días, 0 para ilimitado)</label>
                  <input 
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-gold/50 font-mono"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Razón del cambio (Cortesía/Soporte) *</label>
                  <textarea 
                    value={planReason}
                    onChange={(e) => setPlanReason(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-gold/50 h-24 resize-none placeholder:text-gray-800"
                    placeholder="Justifica detalladamente la modificación manual..."
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setPlanModalUser(null)} className="flex-1 h-12 border border-white/10 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
                  <button onClick={handlePlanSubmit} disabled={planLoading} className="flex-1 h-12 bg-gold text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 transition-all flex items-center justify-center">
                    {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sanctions Timelines Modal */}
      <AnimatePresence>
        {sanctionsUser && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSanctionsUser(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl z-10"
            >
              <h3 className="text-2xl font-black uppercase text-white mb-2">Historial de Sanciones</h3>
              <p className="text-xs text-gold uppercase font-mono tracking-widest mb-6">Usuario: @{sanctionsUser.username}</p>

              {sanctionsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
              ) : sanctions.length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-xs italic">El usuario no tiene antecedentes de sanciones o suspensiones registradas.</div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {sanctions.map((san, idx) => (
                    <div key={san.id || idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative">
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${san.isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                          {san.isActive ? 'Activo' : 'Finalizado'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mb-1">Infracción #{sanctions.length - idx}</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed mb-3">"{san.reason}"</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] font-mono text-gray-600">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(san.startDate).toLocaleDateString()}</span>
                        {san.endDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Expira: {new Date(san.endDate).toLocaleDateString()}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Por: {san.suspendedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button onClick={() => setSanctionsUser(null)} className="px-8 h-12 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Audit Log Inspector Modal */}
      <AnimatePresence>
        {chatsUser && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatsUser(null)} className="absolute inset-0 bg-black/95 backdrop-blur-[20px]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 w-full max-w-4xl h-[85vh] shadow-2xl z-10 flex flex-col"
            >
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase text-white mb-1">Auditoría de Conversaciones</h3>
                  <p className="text-xs text-gold uppercase font-mono tracking-widest">Usuario: @{chatsUser.username} · {chatsUser.name}</p>
                </div>
                <button onClick={() => setChatsUser(null)} className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all">Cerrar</button>
              </div>

              {chatsLoading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-xs italic">El usuario no tiene conversaciones de mensajería activa en el sistema.</div>
              ) : (
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Conversaciones list */}
                  <div className="md:col-span-4 border border-white/5 rounded-2xl bg-white/[0.01] p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 p-2 border-b border-white/5">Chats Detectados ({conversations.length})</p>
                    {conversations.map(conv => {
                      const otherParticipant = conv.participants.find((p: any) => p.id !== chatsUser.id) || conv.participants[0]
                      const lastMsg = conv.messages?.[conv.messages.length - 1]
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConv(conv)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                            activeConv?.id === conv.id 
                              ? 'bg-gold/10 border-gold/40 text-gold' 
                              : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center text-[10px] font-black">
                            {otherParticipant?.avatar ? <img src={otherParticipant.avatar} className="w-full h-full object-cover" alt="" /> : otherParticipant?.name?.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-white">@{otherParticipant?.username || "Otro"}</p>
                            <p className="text-[10px] text-gray-500 truncate leading-normal mt-0.5">{lastMsg ? lastMsg.content : "Sin mensajes"}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Right Column: Active Conversation Messages */}
                  <div className="md:col-span-8 border border-white/5 rounded-2xl bg-black/40 flex flex-col overflow-hidden relative">
                    {activeConv ? (
                      <>
                        {/* Selected Chat Header */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">Chat con @{activeConv.participants.find((p: any) => p.id !== chatsUser.id)?.username || "Usuario"}</p>
                            <p className="text-[9px] text-gray-600 uppercase font-mono tracking-widest mt-0.5">ID: {activeConv.id}</p>
                          </div>
                        </div>

                        {/* Messages bubbles scroll */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 bg-[#080808]/40">
                          {activeConv.messages?.length === 0 ? (
                            <p className="text-center text-gray-600 text-xs italic py-10">No hay mensajes en esta conversación.</p>
                          ) : (
                            activeConv.messages.map((msg: any) => {
                              const isTargetSender = msg.senderId === chatsUser.id
                              return (
                                <div key={msg.id} className={`flex flex-col ${isTargetSender ? 'items-end' : 'items-start'}`}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[9px] text-gray-600 font-black">@{msg.sender.username}</span>
                                    <span className="text-[8px] text-gray-700 font-mono">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className={`p-3.5 rounded-2xl text-xs max-w-sm font-medium leading-relaxed shadow-sm ${
                                    isTargetSender 
                                      ? 'bg-gold/10 text-gold rounded-tr-none border border-gold/10' 
                                      : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'
                                  }`}>
                                    {msg.content}
                                    {msg.attachmentUrl && (
                                      <div className="mt-2 pt-2 border-t border-white/10">
                                        <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="text-[10px] text-gold hover:underline flex items-center gap-1.5">
                                          <AlertCircle className="w-3.5 h-3.5" /> Ver Adjunto
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-8 text-center space-y-4">
                        <MessageSquare className="w-12 h-12 text-gray-800" />
                        <div>
                          <p className="text-xs font-bold text-white">Ningún Chat Seleccionado</p>
                          <p className="text-[10px] text-gray-600 max-w-xs mt-1 leading-relaxed">Selecciona una de las conversaciones de la izquierda para desplegar y auditar el historial de mensajería completo.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
// creado por Patodev y Invertilo
