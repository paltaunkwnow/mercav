"use client"

export * from "./GlobalSettingsForm";

import { useState } from "react"
import { Trash2, ShieldAlert, ShieldCheck, CheckCircle2, Loader2, Check, Users, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Toast } from "@/components/ui/toast"
import { AdminDialog } from "./AdminDialog"
import { Field, IconButton, RowButton, StatusBadge } from "./ui"

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
  const router = useRouter()

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
    <div className="flex items-center gap-1.5">
      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
      
      {targetIsAdmin ? (
        <StatusBadge tone="info">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Protegido
        </StatusBadge>
      ) : (
        <>
          {!isVerified && (
            <IconButton
              icon={CheckCircle2}
              tone="success"
              label={`Verificar a ${userName}`}
              onClick={() => setModal({ open: true, action: "VERIFY_USER" })}
              disabled={!!loading}
              loading={loading === "VERIFY_USER"}
            />
          )}
          
          {!isSanctioned ? (
            <IconButton
              icon={ShieldAlert}
              tone="danger"
              label={`Sancionar a ${userName}`}
              onClick={() => setModal({ open: true, action: "SANCTION_USER" })}
              disabled={!!loading}
              loading={loading === "SANCTION_USER"}
            />
          ) : (
            <IconButton
              icon={ShieldCheck}
              tone="info"
              label={`Quitar la sanción a ${userName}`}
              onClick={() => handleAction("REVOKE_SANCTION")}
              disabled={!!loading}
              loading={loading === "REVOKE_SANCTION"}
            />
          )}
        </>
      )}

      {modal && modal.action !== "SANCTION_USER" && (
        <ConfirmModal 
          isOpen={modal.open}
          setIsOpen={(open) => !open && setModal(null)}
          title={modal.action === "VERIFY_USER" ? "Verificar usuario" : "Moderación"}
          description={`¿Confirmás la acción para ${userName}?`}
          variant={modal.action === "VERIFY_USER" ? "info" : "danger"}
          onConfirm={() => handleAction(modal.action)}
        />
      )}

      <AdminDialog
        open={!!modal && modal.action === "SANCTION_USER"}
        onClose={() => setModal(null)}
        tone="danger"
        icon={<ShieldAlert className="h-5 w-5" />}
        title={`Sancionar a ${userName}`}
        description="La cuenta queda restringida durante el período indicado. Podés quitar la sanción en cualquier momento."
        footer={
          <>
            <button type="button" onClick={() => setModal(null)} className="mv-btn mv-btn-ghost mv-btn-sm">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleAction("SANCTION_USER")}
              disabled={!sanctionReason || !!loading}
              className="mv-btn mv-btn-sm bg-red-600 text-[#fff] hover:bg-red-700"
            >
              {loading === "SANCTION_USER" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Aplicar sanción
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Field label="Motivo" htmlFor={`sanction-reason-${userId}`} hint="Obligatorio. Queda en el historial de la cuenta.">
            <textarea
              id={`sanction-reason-${userId}`}
              value={sanctionReason}
              onChange={(e) => setSanctionReason(e.target.value)}
              aria-describedby={`sanction-reason-${userId}-hint`}
              className="mv-input h-32 resize-none py-3 text-sm"
              placeholder="Describí qué regla se incumplió"
            />
          </Field>
          <Field label="Duración en días" htmlFor={`sanction-days-${userId}`}>
            <input
              id={`sanction-days-${userId}`}
              type="number"
              inputMode="numeric"
              min={1}
              value={sanctionDays}
              onChange={(e) => setSanctionDays(e.target.value)}
              className="mv-input mv-data"
            />
          </Field>
        </div>
      </AdminDialog>
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
    if (action === "DELETE_SERVICE") return "Eliminar servicio";
    if (action === "DELETE_SPACE") return "Eliminar espacio";
    return "Eliminar publicación";
  }

  return (
    <>
      <IconButton
        icon={Trash2}
        tone="danger"
        label={getTitle()}
        onClick={() => setModalOpen(true)}
        loading={loading}
      />

      <ConfirmModal 
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        title={getTitle()}
        description="Se borra de forma permanente y deja de verse en el sitio. Esta acción no se puede deshacer."
        confirmText="Eliminar"
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
    <div className="flex flex-wrap justify-end gap-2">
      <RowButton tone="success" onClick={() => handleAction("APPROVE_COMPANY_MEMBER")} disabled={!!loading}>
        {loading === "APPROVE_COMPANY_MEMBER" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
        Aprobar
      </RowButton>
      <RowButton tone="danger" onClick={() => handleAction("REJECT_COMPANY_MEMBER")} disabled={!!loading}>
        {loading === "REJECT_COMPANY_MEMBER" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
        Rechazar
      </RowButton>
    </div>
  )
}

export function AdminTicketActions({ ticketId, currentStatus, otherParty, isPartyInvited }: { ticketId: string, currentStatus: string, otherParty?: any, isPartyInvited?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    <div className="flex items-center gap-1.5">
       {otherParty && !isPartyInvited && (
          <IconButton
            icon={Users}
            tone="gold"
            label={`Invitar a @${otherParty.username || "la otra parte"} al ticket`}
            onClick={() => handleAction('INVITE_PARTY')}
            disabled={!!loading}
            loading={loading === 'INVITE_PARTY'}
          />
       )}
       {currentStatus !== 'RESOLVED' && (
         <IconButton
           icon={Check}
           tone="success"
           label="Marcar como resuelto"
           onClick={() => handleAction('RESOLVE')}
           disabled={!!loading}
           loading={loading === 'RESOLVE'}
         />
       )}
       <IconButton
          icon={Trash2}
          tone="danger"
          label="Eliminar ticket"
          onClick={() => setConfirmDelete(true)}
          disabled={!!loading}
          loading={loading === 'DELETE'}
       />
       <ConfirmModal
          isOpen={confirmDelete}
          setIsOpen={setConfirmDelete}
          title="Eliminar ticket"
          description="Se borra el ticket y su conversación. Esta acción no se puede deshacer."
          confirmText="Eliminar"
          variant="danger"
          onConfirm={() => handleAction('DELETE')}
       />
    </div>
  );
}
// creado por pato dev y askforvini
