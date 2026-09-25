"use client"

export * from "./GlobalSettingsForm";

import { useState } from "react"
import { Trash2, ShieldAlert, CheckCircle2, Loader2, Check, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useEffect } from "react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Toast } from "@/components/ui/toast"

export function AdminUserActions({ 
  userId, 
  userName, 
  isVerified, 
  isSanctioned,
  targetIsAdmin 
}: { 
  userId: string, 
  userName: string, 
  isVerified: boolean, 
  isSanctioned?: boolean,
  targetIsAdmin?: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [modal, setModal] = useState<{ open: boolean, action: string } | null>(null)
  const [sanctionReason, setSanctionReason] = useState("");
  const [sanctionDays, setSanctionDays] = useState("7");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({
    message: "",
    type: "info",
    visible: false
  });
  const [mounted, setMounted] = useState(false);
  const router = useRouter()

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAction = async (action: string) => {
    setLoading(action)
    try {
      let endpoint = "/api/admin/moderation";
      let body: any = { action, targetId: userId };

      if (action === "SANCTION_USER") {
        endpoint = `/api/admin/users/${userId}/sanction`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(sanctionDays));
        body = { isSanctioned: true, reason: sanctionReason, expiresAt };
      } else if (action === "REVOKE_SANCTION") {
        endpoint = `/api/admin/users/${userId}/sanction`;
        body = { isSanctioned: false };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      
      if (res.ok) {
        setToast({ message: "Acción completada", type: "success", visible: true });
        router.refresh()
      } else {
        const err = await res.json()
        setToast({ message: err.error || "Error", type: "error", visible: true });
      }
    } catch (e) {
      setToast({ message: "Error de conexión", type: "error", visible: true });
    } finally {
      setLoading(null)
      setModal(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
      
      {targetIsAdmin ? (
        <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5">
           <ShieldAlert className="h-3 w-3" /> Protegido
        </div>
      ) : (
        <>
          {!isVerified && (
            <button 
              onClick={() => setModal({ open: true, action: "VERIFY_USER" })}
              disabled={!!loading}
              className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
              title="Verificar Usuario"
            >
              {loading === "VERIFY_USER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            </button>
          )}
          
          {!isSanctioned ? (
            <button 
              onClick={() => setModal({ open: true, action: "SANCTION_USER" })}
              disabled={!!loading}
              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all"
              title="Sancionar Usuario"
            >
              {loading === "SANCTION_USER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            </button>
          ) : (
            <button 
              onClick={() => handleAction("REVOKE_SANCTION")}
              disabled={!!loading}
              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
              title="Quitar Sanción"
            >
              {loading === "REVOKE_SANCTION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            </button>
          )}
        </>
      )}

      {modal && modal.action !== "SANCTION_USER" && (
        <ConfirmModal 
          isOpen={modal.open}
          setIsOpen={(open) => !open && setModal(null)}
          title={modal.action === "VERIFY_USER" ? "Verificar Usuario" : "Moderación"}
          description={`¿Confirmas la acción para ${userName}?`}
          variant={modal.action === "VERIFY_USER" ? "info" : "danger"}
          onConfirm={() => handleAction(modal.action)}
        />
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {modal && modal.action === "SANCTION_USER" && (
            <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 overflow-hidden">
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setModal(null)}
                  className="absolute inset-0 bg-black/95 backdrop-blur-[20px]"
                  style={{ width: '100vw', height: '100vh' }}
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  className="relative bg-bg-secondary border border-gold/20 rounded-[3rem] p-12 w-full max-w-lg shadow-[0_0_150px_rgba(212,175,55,0.15)] overflow-hidden"
               >
                  {/* Premium Decoration */}
                  <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none text-gold">
                     <ShieldAlert size={200} />
                  </div>

                  <div className="flex items-center gap-6 mb-10 relative z-10">
                     <div className="w-16 h-16 bg-gold/10 rounded-[1.5rem] flex items-center justify-center text-gold border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                        <ShieldAlert size={32} />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Sancionar</h3>
                        <p className="text-gold font-mono text-xs tracking-widest uppercase">Usuario: @{userName}</p>
                     </div>
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 ml-2">Motivo del procedimiento</label>
                        <textarea 
                           value={sanctionReason}
                           onChange={(e) => setSanctionReason(e.target.value)}
                           className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 text-white text-base focus:outline-none focus:border-gold/40 h-40 resize-none transition-all placeholder:text-gray-800"
                           placeholder="Detalla la violación de términos..."
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 ml-2">Periodo de restricción (Días)</label>
                        <input 
                           type="number"
                           value={sanctionDays}
                           onChange={(e) => setSanctionDays(e.target.value)}
                           className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] h-16 px-6 text-white text-xl focus:outline-none focus:border-gold/40 transition-all font-mono"
                        />
                     </div>
                  </div>

                  <div className="flex gap-4 mt-12 relative z-10">
                     <button 
                        onClick={() => setModal(null)} 
                        className="flex-1 h-16 rounded-2xl border border-white/10 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                     >
                        Abortar
                     </button>
                     <button 
                        onClick={() => handleAction("SANCTION_USER")}
                        disabled={!sanctionReason || !!loading}
                        className="flex-2 h-16 px-10 rounded-2xl bg-gold text-primary-foreground font-black uppercase tracking-widest text-xs hover:bg-gold-light transition-all disabled:opacity-30 shadow-[0_0_40px_rgba(212,175,55,0.2)]"
                     >
                        {loading === "SANCTION_USER" ? <Loader2 className="animate-spin mx-auto h-6 w-6" /> : "Ejecutar Sanción"}
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

export function AdminPostActions({ 
  postId, 
  action = "DELETE_POST" 
}: { 
  postId: string, 
  action?: "DELETE_POST" | "DELETE_SERVICE" | "DELETE_SPACE" 
}) {
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId: postId })
      })
      
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
      setModalOpen(false)
    }
  }

  const getTitle = () => {
    if (action === "DELETE_SERVICE") return "Eliminar Servicio";
    if (action === "DELETE_SPACE") return "Eliminar Espacio";
    return "Eliminar Publicación";
  }

  return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        disabled={loading}
        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      <ConfirmModal 
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        title={getTitle()}
        description={`¿Estás seguro de que deseas eliminar este elemento? Se borrará permanentemente del sistema.`}
        variant="danger"
        onConfirm={handleDelete}
      />
    </>
  )
}

export function AdminCompanyActions({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (action: string) => {
    setLoading(action)
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId: requestId })
      })
      
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus !== "PENDING") return null;

  return (
    <div className="flex justify-end gap-2">
      <button 
        onClick={() => handleAction("APPROVE_COMPANY_MEMBER")}
        disabled={!!loading}
        className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/5"
        title="Aprobar Solicitud"
      >
        {loading === "APPROVE_COMPANY_MEMBER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      </button>
      <button 
        onClick={() => handleAction("REJECT_COMPANY_MEMBER")}
        disabled={!!loading}
        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
        title="Rechazar Solicitud"
      >
        {loading === "REJECT_COMPANY_MEMBER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function AdminTicketActions({ ticketId, currentStatus, otherParty, isPartyInvited }: { ticketId: string, currentStatus: string, otherParty?: any, isPartyInvited?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (action: string) => {
    setLoading(action)
    try {
      let res;
      if (action === 'RESOLVE') {
        res = await fetch(`/api/admin/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'RESOLVED' })
        })
      } else if (action === 'DELETE') {
        res = await fetch(`/api/admin/tickets/${ticketId}`, {
          method: 'DELETE'
        })
      } else if (action === 'INVITE_PARTY' && otherParty) {
        res = await fetch(`/api/admin/tickets/${ticketId}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: otherParty.id })
        })
      }

      if (res?.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
       {otherParty && !isPartyInvited && (
          <button 
            onClick={() => handleAction('INVITE_PARTY')}
            disabled={!!loading}
            className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-black transition-all"
            title="Invitar a la otra parte"
          >
             {loading === 'INVITE_PARTY' ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
          </button>
       )}
       {currentStatus !== 'RESOLVED' && (
         <button 
           onClick={() => handleAction('RESOLVE')}
           disabled={!!loading}
           className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
           title="Resolver Ticket"
         >
            {loading === 'RESOLVE' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
         </button>
       )}
       <button 
          onClick={() => handleAction('DELETE')}
          disabled={!!loading}
          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
          title="Eliminar Ticket"
       >
          {loading === 'DELETE' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
       </button>
    </div>
  );
}
// creado por pato dev y askforvini
