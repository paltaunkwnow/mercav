"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  ShieldCheck, 
  User as UserIcon,
  Headphones,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Zap,
  ShieldAlert,
  Users as UsersIcon,
  Trash2,
  Hammer
} from "@/components/icons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ButtonLink, Container, buttonClass } from "@/components/site/primitives";

const EASE = [0.23, 1, 0.32, 1] as const;

interface TicketDetailClientProps {
  ticket: any;
  user: any;
}

export default function TicketDetailClient({ ticket, user }: TicketDetailClientProps) {
  const [replies, setReplies] = useState(ticket.replies || []);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [sanctionModal, setSanctionModal] = useState<{ open: boolean; targetId: string; username: string } | null>(null);
  const [resolveModal, setResolveModal] = useState<{ open: boolean; status: string } | null>(null);
  const [finalResolution, setFinalResolution] = useState("");
  const [sanctionReason, setSanctionReason] = useState("");
  const [sanctionDays, setSanctionDays] = useState("7");
  const reduce = useReducedMotion();

  const categoryLabels: Record<string, string> = {
    PAYMENT_ERROR: "Error en el Pago",
    DOUBLE_PAYMENT: "Pago Duplicado",
    FRAUD: "Sospecha de Fraude",
    SCAM: "Estafa / No entrega",
    TECHNICAL_ISSUE: "Problema Técnico",
    OTHER: "Otro"
  };

  const isAdmin = user.roles?.includes("ADMIN");

  const handleAdminAction = async (action: string, targetId?: string, extraData?: any) => {
    setIsSubmitting(true);
    try {
      let endpoint = "";
      let method = "POST";
      let body: any = { action };
      
      if (action === 'INVITE_PARTY') {
        endpoint = `/api/admin/tickets/${ticket.id}/invite`;
        body = { userId: targetId };
      } else if (action === 'SANCTION') {
        endpoint = `/api/admin/users/${targetId}/sanction`;
        const days = parseInt(extraData.days, 10);
        if (!Number.isFinite(days) || days < 1 || days > 3650) {
          setModalMessage("La duración tiene que ser un número de días entre 1 y 3650.");
          setIsErrorModalOpen(true);
          setIsSubmitting(false);
          return;
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        body = { isSanctioned: true, reason: extraData.reason, expiresAt };
      } else if (action === 'RESOLVE' || action === 'CLOSE') {
        const newStatus = action === 'RESOLVE' ? 'RESOLVED' : 'CLOSED';
        
        // 1. Send final resolution message as reply first
        if (extraData?.message) {
           await fetch(`/api/tickets/${ticket.id}/replies`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ message: `[RESOLUCIÓN FINAL]: ${extraData.message}` })
           });
        }

        // 2. Update status
        endpoint = `/api/admin/tickets/${ticket.id}`;
        method = "PATCH";
        body = { status: newStatus };
      }

      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setModalMessage("Comando administrativo ejecutado con éxito.");
        setIsSuccessModalOpen(true);
        if (action === 'SANCTION') setSanctionModal(null);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const err = await res.json();
        setModalMessage(err.error || "Error al ejecutar comando.");
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      setModalMessage("Error de conexión con el servidor.");
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    console.log("Submitting reply to ticket:", ticket.id);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      const data = await res.json();
      console.log("Response from server:", data);
      if (data.success) {
        setReplies([...replies, { ...data.data, user: { name: user.name, avatar: user.avatar } }]);
        setNewMessage("");
        setModalMessage("Tu mensaje ha sido enviado correctamente.");
        setIsSuccessModalOpen(true);
      } else {
        setModalMessage(data.error || "No se pudo procesar tu respuesta.");
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setModalMessage("No se pudo conectar con el servidor. Por favor, revisa tu conexión.");
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'mv-chip-gold';
      case 'IN_PROGRESS': return 'border-yellow-500/25 bg-yellow-500/10 text-yellow-400';
      case 'RESOLVED': return 'border-green-500/25 bg-green-500/10 text-green-400';
      case 'CLOSED': return '';
      default: return '';
    }
  };

  const statusLabels: Record<string, string> = {
    OPEN: "Abierto",
    IN_PROGRESS: "En curso",
    RESOLVED: "Resuelto",
    CLOSED: "Cerrado",
  };

  const fieldLabel = "mb-2 block text-sm font-medium text-[var(--text-secondary)]";

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-bg-primary pb-20 pt-28 md:pb-28 md:pt-36">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <header className="mb-10 flex flex-col gap-4">
          <p className="mv-kicker">
            <Link href="/dashboard/pedidos?tab=tickets" className="-my-2 inline-flex items-center gap-1.5 rounded py-2 hover:underline mv-focus">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Reportes
            </Link>
            <span aria-hidden>/</span>
            <span className="mv-data">{ticket.id.split('-')[0].toUpperCase()}</span>
          </p>
          <h1 className="mv-h1 max-w-4xl break-words">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`mv-chip ${getStatusColor(ticket.status)}`}>{statusLabels[ticket.status] || ticket.status}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5" aria-hidden /> Abierto el{" "}
              <time dateTime={ticket.createdAt} className="mv-data">
                {new Date(ticket.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Conversación */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <article aria-labelledby="ticket-original" className="mv-panel p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel-hover)]">
                  {user.avatar ? <img src={user.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" /> : <UserIcon className="h-5 w-5 text-[var(--text-tertiary)]" aria-hidden />}
                </span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{user.name}</p>
                  <h2 id="ticket-original" className="text-xs text-[var(--text-secondary)]">Reporte original</h2>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-[var(--text-primary)]">
                {ticket.message}
              </p>
            </article>

            {replies.length > 0 && (
              <section aria-label="Respuestas">
                <ol className="relative flex flex-col gap-4 border-l border-[var(--mv-hairline-strong)] pl-5 md:pl-7">
                  {replies.map((reply: any, i: number) => (
                    <motion.li
                      key={reply.id}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3), ease: EASE }}
                      className="relative"
                    >
                      <span
                        aria-hidden
                        className={`absolute -left-[1.6rem] top-6 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-bg-primary)] md:-left-[2.1rem] ${reply.isAdmin ? 'bg-gold' : 'bg-[var(--text-tertiary)]'}`}
                      />
                      <div className={`rounded-[1.25rem] border p-5 md:p-6 ${reply.isAdmin ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]' : 'border-[var(--mv-hairline)] bg-[var(--mv-panel)]'}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className={`flex items-center gap-1.5 text-sm font-semibold ${reply.isAdmin ? 'text-gold' : 'text-[var(--text-primary)]'}`}>
                            {reply.isAdmin ? "Soporte Mercav" : reply.user.name}
                            {reply.isAdmin && <ShieldCheck className="h-3.5 w-3.5" aria-hidden />}
                          </p>
                          <time dateTime={reply.createdAt} className="mv-data text-xs text-[var(--text-tertiary)]">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]">{reply.message}</p>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </section>
            )}

            {/* Responder */}
            {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
              <div className="mv-panel flex flex-col items-start gap-3 p-6 md:p-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mv-hairline)] text-[var(--text-secondary)]">
                  <Lock className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mv-h3">Este caso está cerrado</h2>
                <p className="mv-body max-w-md">
                  Ya no se pueden enviar mensajes en este reporte. Si tenés un problema nuevo, abrí otro desde la compra o la transacción.
                </p>
                <ButtonLink href="/dashboard/pedidos" tone="secondary" className="mt-2 w-full sm:w-auto">Ir a mis pedidos</ButtonLink>
              </div>
            ) : (
              <section aria-labelledby="ticket-reply" className="mv-panel p-5 md:p-8">
                <h2 id="ticket-reply" className="mv-h3 mb-4">Responder</h2>
                <form onSubmit={handleSubmitReply} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="ticket-reply-message" className="sr-only">Tu mensaje</label>
                    <textarea
                      id="ticket-reply-message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribí tu mensaje o una actualización del caso"
                      aria-describedby="ticket-reply-hint"
                      className="mv-input h-auto min-h-[140px] resize-y py-3 leading-relaxed"
                    />
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p id="ticket-reply-hint" className="text-sm text-[var(--text-secondary)] sm:max-w-xs">
                      Tu respuesta llega al equipo que media el caso.
                    </p>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSubmitting}
                      aria-busy={isSubmitting}
                      className={buttonClass("primary", "md", "w-full sm:w-auto")}
                    >
                      {isSubmitting ? "Enviando…" : <><Send className="h-4 w-4" aria-hidden /> Enviar mensaje</>}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>

          {/* Lateral */}
          <aside className="lg:col-span-4" aria-label="Información del caso">
            <div className="flex flex-col gap-6 lg:sticky lg:top-28">
              <section aria-labelledby="ticket-info" className="mv-panel p-6 md:p-8">
                <h2 id="ticket-info" className="mv-h3 mb-5">Información del caso</h2>
                <dl className="flex flex-col gap-4 text-sm">
                  <div>
                    <dt className="text-[var(--text-secondary)]">Categoría</dt>
                    <dd className="mt-0.5 font-medium text-[var(--text-primary)]">{categoryLabels[ticket.category] || ticket.category}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-secondary)]">Estado</dt>
                    <dd className="mt-0.5 font-medium text-[var(--text-primary)]">{statusLabels[ticket.status] || ticket.status}</dd>
                  </div>
                  {ticket.transactionId && (
                    <div>
                      <dt className="text-[var(--text-secondary)]">Transacción vinculada</dt>
                      <dd className="mv-data mt-0.5 break-all text-xs text-[var(--text-primary)]">{ticket.transactionId}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Panel de administración */}
              {isAdmin && (
                <section aria-labelledby="ticket-admin" className="liquid-glass rounded-[1.75rem] p-6 md:p-8">
                  <h2 id="ticket-admin" className="mv-h3 mb-1 flex items-center gap-2">
                    <Hammer className="h-4 w-4 text-gold" aria-hidden /> Administración
                  </h2>
                  <p className="mb-5 text-sm text-[var(--text-secondary)]">Solo visible para administradores.</p>

                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Mediación</h3>
                      {ticket.order && !ticket.involvedUserId ? (
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = ticket.userId === ticket.order.clientId ? ticket.order.providerId : ticket.order.clientId;
                            handleAdminAction('INVITE_PARTY', targetId);
                          }}
                          disabled={isSubmitting}
                          className={buttonClass("secondary", "sm", "w-full")}
                        >
                          Invitar a la contraparte
                        </button>
                      ) : ticket.involvedUserId ? (
                        <span className="mv-chip border-green-500/25 bg-green-500/10 text-green-400">
                          <UsersIcon className="h-3.5 w-3.5" aria-hidden /> Contraparte en el caso
                        </span>
                      ) : (
                        <p className="text-sm text-[var(--text-tertiary)]">Sin acciones de mediación.</p>
                      )}
                    </div>

                    <div className="border-t border-[var(--mv-hairline)] pt-5">
                      <h3 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Cerrar el caso</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setResolveModal({ open: true, status: 'RESOLVE' })}
                          className={buttonClass("secondary", "sm", "w-full text-green-400")}
                        >
                          Resolver
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolveModal({ open: true, status: 'CLOSE' })}
                          className={buttonClass("secondary", "sm", "w-full text-red-400")}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-[var(--mv-hairline)] pt-5">
                      <h3 className="mb-2 text-sm font-medium text-red-400">Sanciones</h3>
                      <ul className="flex flex-col gap-2">
                        <li className="flex items-center justify-between gap-4">
                          <span className="min-w-0 text-sm text-[var(--text-secondary)]">
                            Reportante{ticket.user?.username && <> · <span className="text-[var(--text-primary)]">@{ticket.user.username}</span></>}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setSanctionReason(""); setSanctionDays("7"); setSanctionModal({ open: true, targetId: ticket.userId, username: ticket.user?.username || ticket.user?.name || "usuario" }); }}
                            className={buttonClass("ghost", "sm", "text-red-400")}
                          >
                            Sancionar
                          </button>
                        </li>
                        {ticket.involvedUserId && (
                          <li className="flex items-center justify-between gap-4">
                            <span className="min-w-0 text-sm text-[var(--text-secondary)]">
                              Contraparte{ticket.involvedUser?.username && <> · <span className="text-[var(--text-primary)]">@{ticket.involvedUser.username}</span></>}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setSanctionReason(""); setSanctionDays("7"); setSanctionModal({ open: true, targetId: ticket.involvedUserId, username: ticket.involvedUser?.username || ticket.involvedUser?.name || "invitado" }); }}
                              className={buttonClass("ghost", "sm", "text-red-400")}
                            >
                              Sancionar
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              <section aria-labelledby="ticket-help" className="mv-panel p-6 md:p-8">
                <h2 id="ticket-help" className="mv-h3 mb-2">¿Necesitás más ayuda?</h2>
                <p className="mv-body mb-5">Si el caso es urgente o tenés dudas generales, escribinos desde el centro de soporte.</p>
                <ButtonLink href="/soporte" tone="secondary" className="w-full">
                  Ir a soporte <ChevronRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </section>
            </div>
          </aside>
        </div>
      </Container>

      {/* Confirmación */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-hidden
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="ticket-ok-title"
              aria-describedby="ticket-ok-body"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mv-menu relative w-full max-w-sm rounded-[1.75rem] p-8 text-center"
            >
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-400" aria-hidden />
              </span>
              <h2 id="ticket-ok-title" className="mv-h3">Listo</h2>
              <p id="ticket-ok-body" className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {modalMessage}
              </p>
              <button type="button" onClick={() => setIsSuccessModalOpen(false)} className={buttonClass("primary", "md", "mt-8 w-full")}>
                Continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {isErrorModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsErrorModalOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-hidden
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="ticket-err-title"
              aria-describedby="ticket-err-body"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mv-menu relative w-full max-w-sm rounded-[1.75rem] p-8 text-center"
            >
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-400" aria-hidden />
              </span>
              <h2 id="ticket-err-title" className="mv-h3">No se pudo completar</h2>
              <p id="ticket-err-body" role="alert" className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {modalMessage}
              </p>
              <button type="button" onClick={() => setIsErrorModalOpen(false)} className={buttonClass("secondary", "md", "mt-8 w-full")}>
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sanción */}
      <AnimatePresence>
        {sanctionModal && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setSanctionModal(null)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sanction-title"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mv-menu relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
                  <ShieldAlert className="h-5 w-5 text-red-400" aria-hidden />
                </span>
                <div>
                  <h2 id="sanction-title" className="mv-h3">Sancionar a @{sanctionModal.username}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Esta acción restringe el acceso del usuario.</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label htmlFor="sanction-reason" className={fieldLabel}>Motivo de la sanción</label>
                  <textarea
                    id="sanction-reason"
                    value={sanctionReason}
                    onChange={(e) => setSanctionReason(e.target.value)}
                    className="mv-input h-32 resize-none py-3"
                    placeholder="Explicá el motivo de la suspensión"
                  />
                </div>
                <div>
                  <label htmlFor="sanction-days" className={fieldLabel}>Duración (días)</label>
                  <input
                    id="sanction-days"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={3650}
                    value={sanctionDays}
                    onChange={(e) => setSanctionDays(e.target.value)}
                    className="mv-input mv-data"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={() => setSanctionModal(null)} className={buttonClass("ghost", "md", "w-full sm:flex-1")}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminAction('SANCTION', sanctionModal.targetId, { reason: sanctionReason, days: sanctionDays })}
                  disabled={!sanctionReason.trim() || isSubmitting}
                  className={buttonClass("secondary", "md", "w-full border-red-500/40 text-red-400 sm:flex-1")}
                >
                  {isSubmitting ? "Ejecutando…" : "Confirmar sanción"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resolución */}
      <AnimatePresence>
        {resolveModal && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setResolveModal(null)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="resolve-title"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mv-menu relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${resolveModal.status === 'RESOLVE' ? 'border-green-500/25 bg-green-500/10 text-green-400' : 'border-red-500/25 bg-red-500/10 text-red-400'}`}>
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 id="resolve-title" className="mv-h3">
                    {resolveModal.status === 'RESOLVE' ? 'Resolver el caso' : 'Cerrar el caso'}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">Agregá una respuesta final para las partes.</p>
                </div>
              </div>

              <div>
                <label htmlFor="resolve-message" className={fieldLabel}>Resolución final (visible para las partes)</label>
                <textarea
                  id="resolve-message"
                  value={finalResolution}
                  onChange={(e) => setFinalResolution(e.target.value)}
                  className="mv-input h-40 resize-none py-3"
                  placeholder="Ej.: se procesó el reembolso tras verificar el error técnico."
                />
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={() => setResolveModal(null)} className={buttonClass("ghost", "md", "w-full sm:flex-1")}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminAction(resolveModal.status, undefined, { message: finalResolution })}
                  disabled={!finalResolution || isSubmitting}
                  className={resolveModal.status === 'RESOLVE' ? buttonClass("primary", "md", "w-full sm:flex-1") : buttonClass("secondary", "md", "w-full border-red-500/40 text-red-400 sm:flex-1")}
                >
                  {isSubmitting ? "Procesando…" : "Finalizar caso"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
// creado por pato dev y askforvini
