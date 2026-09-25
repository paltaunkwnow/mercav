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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(extraData.days || "7"));
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
      case 'OPEN': return 'bg-blue-500/10 text-blue-400 border-blue-400/20';
      case 'IN_PROGRESS': return 'bg-gold/10 text-gold border-gold/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-400 border-green-400/20';
      case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-400/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-400/20';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white pt-24 pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header & Back */}
        <div className="mb-12">
          <Link href="/dashboard/pedidos" className="inline-flex items-center text-gray-500 hover:text-gold transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em] group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver a Pedidos y Reportes
          </Link>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                  Caso {ticket.status}
                </span>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  ID: {ticket.id.split('-')[0].toUpperCase()}
                </span>
              </div>
              <h1 className="text-4xl font-display font-black tracking-tighter mb-2">{ticket.subject}</h1>
              <p className="text-gray-500 flex items-center gap-2">
                <Clock size={14} /> Iniciado el {new Date(ticket.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-6 rounded-[2rem]">
               <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                  <Headphones size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Agente Asignado</p>
                  <p className="font-bold text-white">Soporte Mercav Pro</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Conversation */}
          <div className="lg:col-span-8 space-y-8">
            {/* Original Message */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <AlertCircle size={80} className="text-gold" />
               </div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-bold text-white">{user.name}</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Autor del Reporte</p>
                  </div>
               </div>
               <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                  {ticket.message}
               </div>
            </div>

            {/* Replies Timeline */}
            <div className="space-y-8 relative">
               <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/5 via-white/10 to-transparent" />
               
               {replies.map((reply: any, i: number) => (
                 <motion.div 
                   key={reply.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className={`relative pl-16 ${reply.isAdmin ? 'ml-auto max-w-[90%]' : ''}`}
                 >
                    <div className={`absolute left-4 top-0 w-4 h-4 rounded-full border-2 border-[#050505] z-10 ${reply.isAdmin ? 'bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-gray-600'}`} />
                    
                    <div className={`p-8 rounded-[2rem] border ${reply.isAdmin ? 'bg-gold/5 border-gold/20' : 'bg-white/[0.02] border-white/5'}`}>
                       <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                             <p className={`font-bold ${reply.isAdmin ? 'text-gold' : 'text-white'}`}>
                                {reply.isAdmin ? "Soporte Oficial" : reply.user.name}
                             </p>
                             {reply.isAdmin && <ShieldCheck size={14} className="text-gold" />}
                          </div>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                             {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                       <p className="text-gray-400 leading-relaxed">{reply.message}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Reply Form */}
            <div className="mt-12">
               {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 text-center">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
                        <Lock size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">Este caso ha finalizado</h3>
                     <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        No es posible enviar más mensajes en este ticket. Si tienes un problema nuevo, por favor abre un reporte diferente.
                     </p>
                  </div>
               ) : (
                  <div className="bg-bg-secondary border border-white/10 rounded-[2.5rem] p-10 focus-within:border-gold/30 transition-all">
                     <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6">Responder al Caso</h3>
                     <form onSubmit={handleSubmitReply}>
                       <textarea 
                         value={newMessage}
                         onChange={(e) => setNewMessage(e.target.value)}
                         placeholder="Escribe tu mensaje o actualización aquí..."
                         className="w-full bg-transparent border-none text-white text-lg min-h-[150px] focus:ring-0 resize-none mb-6 placeholder:text-gray-700"
                       />
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest max-w-[200px]">
                             Tu respuesta llegará directamente a nuestro equipo de mediación.
                          </p>
                          <Button 
                            type="submit"
                            disabled={!newMessage.trim() || isSubmitting}
                            className="bg-gold text-black hover:bg-gold-light rounded-2xl h-14 px-10 font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-gold/20 disabled:opacity-50 disabled:scale-100"
                          >
                             {isSubmitting ? "Enviando..." : <><Send className="w-5 h-5 mr-3" /> Enviar Mensaje</>}
                          </Button>
                       </div>
                     </form>
                  </div>
               )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4">
             <div className="sticky top-24 space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10">
                   <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Información del Caso</h3>
                   
                   <div className="space-y-6">
                      <div>
                         <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Categoría</p>
                         <p className="text-white font-bold">{categoryLabels[ticket.category] || ticket.category}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Prioridad</p>
                         <p className="text-gold font-bold flex items-center gap-2">
                            <Zap size={14} className="fill-gold" /> Alta (Mercav Protection)
                         </p>
                      </div>
                      {ticket.transactionId && (
                        <div>
                           <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Transacción Vinculada</p>
                           <p className="text-white font-mono text-xs">{ticket.transactionId}</p>
                        </div>
                      )}
                      <div className="pt-6 border-t border-white/5">
                         <div className="flex items-center gap-3 bg-green-500/5 border border-green-500/10 p-4 rounded-2xl">
                            <ShieldCheck className="text-green-500 w-5 h-5 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-tight">
                               Tus datos y archivos están encriptados y protegidos.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Admin Control Panel */}
                {isAdmin && (
                  <div className="bg-bg-secondary border border-gold/20 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                     <h3 className="text-gold font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <Hammer size={18} /> Centro de Justicia
                     </h3>
                     
                     <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Mediación</p>
                           {ticket.order && !ticket.involvedUserId ? (
                              <Button 
                                onClick={() => {
                                  const targetId = ticket.userId === ticket.order.clientId ? ticket.order.providerId : ticket.order.clientId;
                                  handleAdminAction('INVITE_PARTY', targetId);
                                }}
                                className="w-full bg-gold/10 text-gold border border-gold/20 hover:bg-gold hover:text-black rounded-xl h-12 text-xs font-bold transition-all"
                              >
                                 Invitar Contraparte
                              </Button>
                           ) : ticket.involvedUserId ? (
                              <div className="flex items-center gap-2 text-green-400 bg-green-400/5 p-3 rounded-xl border border-green-400/10">
                                 <UsersIcon size={12} />
                                 <span className="text-[10px] font-bold">Contraparte en el Caso</span>
                              </div>
                           ) : (
                              <p className="text-[10px] text-gray-400 italic">Sin acciones de mediación.</p>
                           )}
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Acciones Rápidas</p>
                           <div className="flex gap-2">
                              <Button 
                                onClick={() => setResolveModal({ open: true, status: 'RESOLVE' })}
                                className="flex-1 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white rounded-xl h-10 text-[10px] font-bold transition-all"
                              >
                                 Resolver
                              </Button>
                              <Button 
                                onClick={() => setResolveModal({ open: true, status: 'CLOSE' })}
                                className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl h-10 text-[10px] font-bold transition-all"
                              >
                                 Cerrar
                              </Button>
                           </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                           <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3 text-center">Sanciones</p>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-white/5 transition-all">
                                 <span className="text-[10px] font-bold text-gray-400 truncate w-24">Reportante</span>
                                 <Button 
                                   onClick={() => setSanctionModal({ open: true, targetId: ticket.userId, username: ticket.user.username })}
                                   variant="ghost" className="h-7 px-3 text-[9px] text-red-400 hover:text-red-500 border border-red-500/20"
                                 >
                                    Sancionar
                                 </Button>
                              </div>
                              {ticket.involvedUserId && (
                                 <div className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-white/5 transition-all">
                                    <span className="text-[10px] font-bold text-gray-400 truncate w-24">Invitado</span>
                                    <Button 
                                      onClick={() => setSanctionModal({ open: true, targetId: ticket.involvedUserId, username: "Invitado" })}
                                      variant="ghost" className="h-7 px-3 text-[9px] text-red-400 hover:text-red-500 border border-red-500/20"
                                    >
                                       Sancionar
                                    </Button>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/10 rounded-[2.5rem] p-10">
                   <h4 className="text-xl font-bold text-white mb-4">Preguntas Frecuentes</h4>
                   <p className="text-gray-500 text-sm leading-relaxed mb-6">
                      ¿Sabías que la mayoría de los problemas de pago se resuelven en menos de 24 horas?
                   </p>
                   <Button variant="link" className="text-gold p-0 h-auto font-black uppercase tracking-widest text-[10px] hover:no-underline group">
                      Ver Centro de Ayuda <ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
             </div>
          </div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {isSuccessModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSuccessModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-bg-secondary border border-gold/20 rounded-[2.5rem] p-12 text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]"
              >
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                    <CheckCircle2 className="text-gold w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">¡Enviado!</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-10">
                  {modalMessage}
                </p>
                <Button 
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="w-full bg-gold text-black hover:bg-gold-light rounded-2xl h-14 font-black uppercase tracking-widest transition-all"
                >
                  Continuar
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error Modal */}
        <AnimatePresence>
          {isErrorModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsErrorModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-bg-secondary border border-red-500/20 rounded-[2.5rem] p-12 text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]"
              >
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                    <AlertCircle className="text-red-500 w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-10">
                  {modalMessage}
                </p>
                <Button 
                  onClick={() => setIsErrorModalOpen(false)}
                  className="w-full bg-red-500 text-white hover:bg-red-600 rounded-2xl h-14 font-black uppercase tracking-widest transition-all"
                >
                  Cerrar
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Sanction Modal */}
        <AnimatePresence>
           {sanctionModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={() => setSanctionModal(null)}
                 />
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="relative w-full max-w-md bg-bg-secondary border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
                 >
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <ShieldAlert size={24} />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-white">Sancionar a @{sanctionModal.username}</h3>
                          <p className="text-xs text-gray-500">Esta acción restringirá el acceso al usuario.</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Motivo de la Sanción</label>
                          <textarea 
                             value={sanctionReason}
                             onChange={(e) => setSanctionReason(e.target.value)}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-gold/30 h-32 resize-none"
                             placeholder="Explica el motivo de la suspensión..."
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Duración (Días)</label>
                          <input 
                             type="number"
                             value={sanctionDays}
                             onChange={(e) => setSanctionDays(e.target.value)}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-gold/30"
                          />
                       </div>
                    </div>

                    <div className="flex gap-4 mt-10">
                       <Button 
                          onClick={() => setSanctionModal(null)}
                          variant="ghost" 
                          className="flex-1 h-14 rounded-2xl border border-white/5 text-gray-500 font-bold hover:bg-white/5"
                       >
                          Cancelar
                       </Button>
                       <Button 
                          onClick={() => handleAdminAction('SANCTION', sanctionModal.targetId, { reason: sanctionReason, days: sanctionDays })}
                          disabled={!sanctionReason || isSubmitting}
                          className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/20 disabled:opacity-50"
                       >
                          {isSubmitting ? "Ejecutando..." : "Confirmar"}
                       </Button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* Custom Resolution Modal */}
        <AnimatePresence>
           {resolveModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={() => setResolveModal(null)}
                 />
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="relative w-full max-w-md bg-bg-secondary border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
                 >
                    <div className="flex items-center gap-4 mb-8">
                       <div className={`w-12 h-12 ${resolveModal.status === 'RESOLVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} rounded-2xl flex items-center justify-center`}>
                          <ShieldCheck size={24} />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-white">
                             {resolveModal.status === 'RESOLVE' ? 'Resolver el Caso' : 'Cerrar el Caso'}
                          </h3>
                          <p className="text-xs text-gray-500">Añade una respuesta final para las partes.</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Resolución Final (Público)</label>
                          <textarea 
                             value={finalResolution}
                             onChange={(e) => setFinalResolution(e.target.value)}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-gold/30 h-40 resize-none"
                             placeholder="Ej: Se ha procedido al reembolso tras verificar el error técnico..."
                          />
                       </div>
                    </div>

                    <div className="flex gap-4 mt-10">
                       <Button 
                          onClick={() => setResolveModal(null)}
                          variant="ghost" 
                          className="flex-1 h-14 rounded-2xl border border-white/5 text-gray-500 font-bold hover:bg-white/5"
                       >
                          Cancelar
                       </Button>
                       <Button 
                          onClick={() => handleAdminAction(resolveModal.status, undefined, { message: finalResolution })}
                          disabled={!finalResolution || isSubmitting}
                          className={`flex-1 h-14 rounded-2xl ${resolveModal.status === 'RESOLVE' ? 'bg-green-600 shadow-green-600/20' : 'bg-red-600 shadow-red-600/20'} text-white font-bold hover:opacity-90 shadow-xl disabled:opacity-50`}
                       >
                          {isSubmitting ? "Procesando..." : "Finalizar Caso"}
                       </Button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
