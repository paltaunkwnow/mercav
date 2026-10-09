"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText, 
  Paperclip, 
  Send, 
  Image as ImageIcon, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Gavel,
  Zap,
  MoreVertical,
  AlertCircle,
  Download,
  Upload,
  Loader2,
  Printer
} from "@/components/icons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, buttonClass } from "@/components/site/primitives";
import Link from "next/link";
import { io } from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { AppBack } from "@/components/app-shell/AppPage";

const EASE = [0.23, 1, 0.32, 1] as const;

interface OrderDashboardClientProps {
  order: any;
  user: any;
  initialMessages: any[];
  conversationId: string | null;
  isProvider: boolean;
  isClient: boolean;
}

const CLOSED_FOR_DISPUTE = ['COMPLETED', 'CANCELLED', 'DISPUTED'];
const REASON_MIN = 5;
const REASON_MAX = 140;

const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-AR', { dateStyle: 'medium' });
const fmtMoney = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
};

const transactionLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Acreditado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};
const milestoneLabels: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  PAID: "Pagado",
};

export default function OrderDashboardClient({ 
  order, 
  user, 
  initialMessages,
  conversationId,
  isProvider,
  isClient
}: OrderDashboardClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [convId, setConvId] = useState<string | null>(conversationId);
  const [status, setStatus] = useState(order.status);
  const [progress, setProgress] = useState(
    order.status === 'COMPLETED' ? 100 : 
    order.status === 'IN_REVIEW' ? 80 : 
    order.status === 'IN_PROGRESS' ? 40 : 10
  );
  const [files, setFiles] = useState<any[]>(order.files || []);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({ subject: "", message: "" });
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>(order.tickets || []);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, isVisible: true });
  };

  // Real-time with Socket.io
  useEffect(() => {
    const socket = io({
      path: "/api/socket/io",
      addTrailingSlash: false,
    });

    socket.on("connect", () => {
      console.log("Dashboard connected to socket");
      socket.emit("join", user.id);
    });

    socket.on("statusUpdate", (data: any) => {
      if (data.orderId === order.id) {
        setStatus(data.status);
        if (data.status === 'COMPLETED') setProgress(100);
        else if (data.status === 'IN_PROGRESS') setProgress(40);
        else if (data.status === 'IN_REVIEW') setProgress(80);
      }
    });

    if (convId) {
      socket.on(`chat:${convId}`, (message: any) => {
        if (message.senderId !== user.id) {
          setMessages((prev) => [...prev, message]);
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [user.id, order.id, convId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      showToast("El archivo excede el límite de 5MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/orders/${order.id}/files`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setFiles([data.data, ...files]);
        showToast("Archivo subido correctamente", "success");
        
        // Also notify in chat
        const msgRes = await fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `📎 He compartido un archivo: ${file.name}` })
        });
        const msgData = await msgRes.json();
        if (msgData.success) {
          setMessages(prev => [...prev, msgData.data]);
        }
      } else {
        showToast(data.error || "Error al subir el archivo", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión al subir el archivo", "error");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      let currentConvId = convId;

      // 1. Create conversation if it doesn't exist
      if (!currentConvId) {
        const targetUserId = isProvider ? order.clientId : order.service.providerId;
        const convRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: 'SERVICE_ORDER',
            contextId: order.id,
            targetUserId
          })
        });
        const convData = await convRes.json();
        if (convData.success) {
          currentConvId = convData.data.id;
          setConvId(currentConvId);
        } else {
          throw new Error("Error creating conversation");
        }
      }

      // 2. Send message
      const res = await fetch(`/api/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (data.success) {
        setStatus(newStatus);
        if (newStatus === 'COMPLETED') setProgress(100);
        else if (newStatus === 'IN_PROGRESS') setProgress(40);
        else if (newStatus === 'IN_REVIEW') setProgress(80);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const canDispute = (isClient || isProvider) && !CLOSED_FOR_DISPUTE.includes(status);
  const ownDisputeTicket = tickets.find((t: any) => t.userId === user.id);

  const openDisputeModal = () => {
    setDisputeError(null);
    setIsReportModalOpen(true);
  };

  const handleOpenDispute = async () => {
    if (disputeLoading) return;
    const reason = reportData.subject.trim();
    if (reason.length < REASON_MIN) {
      setDisputeError(`Indicá el motivo de la disputa (mínimo ${REASON_MIN} caracteres).`);
      return;
    }
    setDisputeLoading(true);
    setDisputeError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details: reportData.message.trim() })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setDisputeError(
          data?.error ||
          (res.status === 401 ? "Tu sesión venció. Iniciá sesión de nuevo." : "No pudimos abrir la disputa. Probá de nuevo en unos minutos.")
        );
        return;
      }
      setStatus('DISPUTED');
      if (data.data?.ticketId) {
        setTickets(prev => [...prev, { id: data.data.ticketId, userId: user.id, status: 'OPEN', createdAt: new Date().toISOString() }]);
      }
      setIsReportModalOpen(false);
      setReportData({ subject: "", message: "" });
      showToast("Abrimos la disputa. El equipo de Mercav va a revisar el caso.", "success");
    } catch (e) {
      console.error(e);
      setDisputeError("No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.");
    } finally {
      setDisputeLoading(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'IN_PROGRESS': return 'text-gold bg-gold/10 border-gold/30';
      case 'IN_REVIEW': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  const otherUser = isProvider ? order.client : order.service.provider;

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En curso",
    IN_REVIEW: "En revisión",
    REVISION: "Con cambios",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    DISPUTED: "En disputa",
  };
  const statusChip = (s: string) =>
    s === 'COMPLETED' ? 'border-green-500/25 bg-green-500/10 text-green-400'
    : s === 'CANCELLED' || s === 'DISPUTED' ? 'border-red-500/25 bg-red-500/10 text-red-400'
    : s === 'PENDING' ? 'border-yellow-500/25 bg-yellow-500/10 text-yellow-400'
    : 'mv-chip-gold';

  const steps = [
    { at: 10, label: "Briefing y requerimientos" },
    { at: 40, label: "En desarrollo" },
    { at: 80, label: "Entrega y revisión" },
    { at: 100, label: "Finalizado" },
  ];

  // Línea de tiempo armada solo con fechas registradas en la base. No hay un log de
  // cambios de estado, así que no se infieren transiciones que no estén guardadas.
  const historyEvents = useMemo(() => {
    const ev: { at: string; title: string; detail?: string; upcoming?: boolean }[] = [];
    const partyLabel = (id: string) => id === order.clientId ? 'el cliente' : 'el profesional';
    ev.push({ at: order.createdAt, title: "Pedido creado", detail: `${order.package?.name ?? 'Paquete'} · $${fmtMoney(order.totalPrice)}` });
    if (order.startDate) ev.push({ at: order.startDate, title: "Inicio del trabajo" });
    for (const t of order.transactions || []) {
      ev.push({ at: t.createdAt, title: "Pago registrado", detail: `${fmtMoney(t.amount)} ${String(t.currency || '').toUpperCase()} · ${transactionLabels[t.status] || t.status}` });
    }
    for (const m of order.milestones || []) {
      ev.push({ at: m.createdAt, title: `Hito creado: ${m.title}`, detail: `$${fmtMoney(m.amount)}` });
      if (m.status !== 'PENDING' && m.updatedAt) {
        ev.push({ at: m.updatedAt, title: `Hito ${milestoneLabels[m.status]?.toLowerCase() || m.status}: ${m.title}` });
      }
    }
    for (const f of files) {
      if (f.createdAt) ev.push({ at: f.createdAt, title: "Archivo compartido", detail: f.name });
    }
    for (const t of tickets) {
      ev.push({ at: t.createdAt, title: "Disputa o reclamo abierto", detail: `Por ${t.userId === user.id ? 'vos' : partyLabel(t.userId)}` });
    }
    for (const r of order.reviews || []) {
      ev.push({ at: r.createdAt, title: "Reseña publicada", detail: `${r.rating} de 5` });
    }
    if (order.completedAt) ev.push({ at: order.completedAt, title: "Pedido completado" });
    if (order.dueDate) {
      const upcoming = new Date(order.dueDate).getTime() > Date.now() && status !== 'COMPLETED';
      ev.push({ at: order.dueDate, title: upcoming ? "Entrega prevista" : "Fecha de entrega pactada", upcoming });
    }
    return ev.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [order, files, tickets, status, user.id]);

  const paidTransactions = (order.transactions || []).filter((t: any) => t.status === 'PAID');

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-primary pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container width="wide" className="relative">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" aria-hidden tabIndex={-1} />

        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4">
            <AppBack href="/dashboard/pedidos" label="Pedidos y ventas" />
            <h1 className="font-display text-[1.9rem] font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-[2.4rem] max-w-4xl break-words">{order.service.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`mv-chip ${statusChip(status)}`}>{statusLabels[status] || status}</span>
              <span className="mv-data text-sm text-[var(--text-tertiary)]">#{order.id.slice(-8).toUpperCase()}</span>
              <span className="text-sm text-[var(--text-secondary)]">
                {isProvider ? 'Cliente' : 'Profesional'}: <span className="font-medium text-[var(--text-primary)]">{otherUser.name}</span>
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {isProvider && status === 'PENDING' && (
              <button type="button" onClick={() => handleUpdateStatus('IN_PROGRESS')} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                <Zap className="h-5 w-5" aria-hidden /> Comenzar proyecto
              </button>
            )}
            {isProvider && status === 'IN_PROGRESS' && (
              <button type="button" onClick={() => handleUpdateStatus('IN_REVIEW')} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                <CheckCircle2 className="h-5 w-5" aria-hidden /> Entregar proyecto
              </button>
            )}
            {!isProvider && status === 'IN_REVIEW' && (
              <button type="button" onClick={() => handleUpdateStatus('COMPLETED')} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                <CheckCircle2 className="h-5 w-5" aria-hidden /> Aprobar y finalizar
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Más acciones del pedido"
                className={buttonClass("secondary", "lg", "w-full sm:w-14 sm:px-0")}
              >
                <MoreVertical className="h-5 w-5" aria-hidden />
                <span className="sm:sr-only">Más acciones</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5">
                <DropdownMenuItem
                  onClick={() => setIsInvoiceOpen(true)}
                  className="min-h-11 cursor-pointer rounded-xl px-3 text-[var(--text-primary)]"
                >
                  <FileText className="mr-2 h-4 w-4 text-gold" aria-hidden /> Ver detalles de factura
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsHistoryOpen(true)}
                  className="min-h-11 cursor-pointer rounded-xl px-3 text-[var(--text-primary)]"
                >
                  <Clock className="mr-2 h-4 w-4 text-gold" aria-hidden /> Ver historial del pedido
                </DropdownMenuItem>
                {canDispute && (
                  <DropdownMenuItem
                    onClick={openDisputeModal}
                    className="min-h-11 cursor-pointer rounded-xl px-3 text-red-400"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" aria-hidden /> Iniciar disputa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Chat y archivos */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <section aria-labelledby="order-chat" className="mv-panel flex h-[min(600px,75svh)] flex-col overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--mv-hairline)] px-5 py-4 md:px-6">
                <img
                  src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}`}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full border border-[var(--mv-hairline)] object-cover"
                />
                <div className="min-w-0">
                  <h2 id="order-chat" className="truncate text-sm font-semibold text-[var(--text-primary)]">{otherUser.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">{isProvider ? 'Cliente' : 'Profesional'}</p>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="scrollbar-hide flex-1 space-y-5 overflow-y-auto scroll-smooth p-5 md:p-6"
                role="log"
                aria-live="polite"
              >
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center"
                    >
                      <MessageSquare className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden />
                      <p className="text-sm font-medium text-[var(--text-primary)]">Todavía no hay mensajes</p>
                      <p className="max-w-xs text-sm text-[var(--text-secondary)]">Escribí abajo para coordinar el pedido. Todo queda registrado en esta conversación.</p>
                    </motion.div>
                  ) : (
                    messages.map((message: any) => {
                      const mine = message.senderId === user.id;
                      return (
                        <motion.div
                          key={message.id}
                          initial={reduce ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                            <div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              mine
                                ? 'rounded-br-md bg-gold text-[var(--mv-on-gold)]'
                                : 'rounded-bl-md border border-[var(--mv-hairline)] bg-[var(--mv-panel-hover)] text-[var(--text-primary)]'
                            }`}>
                              {message.content}
                            </div>
                            <span className="mv-data mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-[var(--mv-hairline)] p-3 md:p-4">
                <div className="flex items-end gap-1 rounded-2xl border border-[var(--mv-hairline-strong)] bg-[color-mix(in_srgb,var(--color-bg-tertiary)_70%,transparent)] p-1.5 transition-colors duration-200 focus-within:border-[var(--color-border-gold)]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Adjuntar archivo"
                    className="mv-focus flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] outline-none transition-colors duration-200 hover:text-gold"
                  >
                    <Paperclip className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Adjuntar imagen"
                    className="mv-focus hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] outline-none transition-colors duration-200 hover:text-gold sm:flex"
                  >
                    <ImageIcon className="h-5 w-5" aria-hidden />
                  </button>
                  <label htmlFor="order-message" className="sr-only">Mensaje</label>
                  <textarea
                    id="order-message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Escribí un mensaje"
                    className="scrollbar-hide h-10 flex-1 resize-none border-none bg-transparent px-2 py-2.5 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-0 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    aria-label="Enviar mensaje"
                    className={buttonClass("primary", "sm", "w-10 shrink-0 px-0")}
                  >
                    <Send className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </section>

            {/* Archivos */}
            <section aria-labelledby="order-files" className="mv-panel p-5 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 id="order-files" className="mv-h3">Archivos compartidos</h2>
                {files.length > 0 && (
                  <span className="mv-chip"><span className="mv-data">{files.length}</span></span>
                )}
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {files.length > 0 ? (
                  files.map(file => (
                    <li key={file.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--mv-hairline)] p-3 transition-colors duration-200 hover:bg-[var(--mv-panel-hover)]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
                          {file.type === 'pdf' ? <FileText className="h-5 w-5" aria-hidden /> : <ImageIcon className="h-5 w-5" aria-hidden />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{file.name}</p>
                          <p className="mv-data text-xs text-[var(--text-tertiary)]">{file.size}{file.createdAt ? ` · ${fmtDate(file.createdAt)}` : ''}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.open(file.url, '_blank')}
                        aria-label={`Descargar ${file.name}`}
                        className={buttonClass("ghost", "sm", "w-10 shrink-0 px-0")}
                      >
                        <Download className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="col-span-full rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                    Todavía no se compartieron archivos en este pedido.
                  </li>
                )}
                <li className={files.length > 0 ? '' : 'col-span-full'}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mv-focus flex h-full min-h-[4rem] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 text-sm font-semibold text-[var(--text-secondary)] outline-none transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-gold"
                  >
                    <Upload className="h-4 w-4" aria-hidden /> Subir archivo
                  </button>
                </li>
              </ul>

              <div className="mt-6 flex gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <div className="space-y-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <p>
                    El límite de carga directa es de <span className="mv-data font-medium text-[var(--text-primary)]">5MB</span>. Para archivos más pesados, compartí un enlace de Google Drive o Dropbox en el chat.
                  </p>
                  <p className="text-red-400">
                    Está prohibido subir software malicioso, virus o contenido ilegal. Todo archivo es monitoreado.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Lateral */}
          <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Detalles del pedido">
            <section aria-labelledby="order-progress" className="liquid-glass rounded-[1.75rem] p-6 md:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 id="order-progress" className="mv-h3">Estado del proyecto</h2>
                <span className={`mv-chip ${statusChip(status)}`}>{statusLabels[status] || status}</span>
              </div>
              <div
                className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--mv-hairline-strong)]"
                role="progressbar"
                aria-label="Avance del proyecto"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <motion.div
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="h-full rounded-full bg-gold"
                />
              </div>
              <ol className="flex flex-col gap-3">
                {steps.map((step) => {
                  const done = progress >= step.at;
                  return (
                    <li key={step.at} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${done ? 'text-gold' : 'text-[var(--text-tertiary)]'}`} aria-hidden />
                      <span className={done ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>{step.label}</span>
                      <span className="sr-only">{done ? '(completado)' : '(pendiente)'}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="order-details" className="mv-panel p-6 md:p-8">
              <h2 id="order-details" className="mv-h3 mb-5">Detalles del pedido</h2>
              <dl className="flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Paquete</dt>
                  <dd className="text-right font-medium text-[var(--text-primary)]">{order.package.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Monto</dt>
                  <dd className="mv-data text-lg font-medium text-[var(--text-primary)]">${order.totalPrice}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Entrega</dt>
                  <dd className="mv-data text-[var(--text-primary)]">{order.package.deliveryDays} días</dd>
                </div>
              </dl>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  El pago queda retenido en Mercav y se libera al profesional cuando el cliente aprueba la entrega final.
                </p>
              </div>

              {canDispute ? (
                <button
                  type="button"
                  onClick={openDisputeModal}
                  className={buttonClass("ghost", "md", "mt-6 w-full text-red-400")}
                >
                  <AlertCircle className="h-4 w-4" aria-hidden /> Reportar un problema
                </button>
              ) : status === 'DISPUTED' ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                  <p>
                    Este pedido está en disputa. El equipo de Mercav revisa el caso y el pago queda retenido hasta la resolución.
                    {ownDisputeTicket && (
                      <> <Link href={`/dashboard/pedidos/tickets/${ownDisputeTicket.id}`} className="mv-link">Ver el caso</Link>.</>
                    )}
                  </p>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </Container>

      {/* Disputa */}
      <Dialog open={isReportModalOpen} onOpenChange={(open) => { if (!disputeLoading) setIsReportModalOpen(open); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-[1.75rem] p-0 outline-none sm:max-w-md">
          <div className="p-6 sm:p-8">
            <DialogHeader className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
                  <ShieldAlert className="h-5 w-5 text-red-400" aria-hidden />
                </span>
                <DialogTitle className="mv-h3">Abrir una disputa</DialogTitle>
              </div>
              <DialogDescription className="text-sm leading-relaxed text-[var(--text-secondary)]">
                El pedido pasa a estado «En disputa», se abre un caso de soporte con tu motivo y avisamos a la otra parte. El equipo de Mercav revisa el chat del pedido antes de decidir.
              </DialogDescription>
              <p className="rounded-2xl border border-[var(--mv-hairline)] p-4 text-sm text-[var(--text-secondary)]">
                Resultados posibles: <span className="font-medium text-[var(--text-primary)]">reembolso parcial</span>, <span className="font-medium text-[var(--text-primary)]">reembolso total</span> o <span className="font-medium text-[var(--text-primary)]">denegación</span>.
              </p>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-6">
              <div>
                <label htmlFor="dispute-subject" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                  Motivo <span className="text-red-400" aria-hidden>*</span><span className="sr-only">(obligatorio)</span>
                </label>
                <input
                  id="dispute-subject"
                  type="text"
                  autoComplete="off"
                  required
                  minLength={REASON_MIN}
                  maxLength={REASON_MAX}
                  aria-invalid={!!disputeError && reportData.subject.trim().length < REASON_MIN}
                  aria-describedby={disputeError ? "dispute-error" : undefined}
                  placeholder="Ej.: retraso en la entrega"
                  className="mv-input"
                  value={reportData.subject}
                  onChange={(e) => setReportData({ ...reportData, subject: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="dispute-message" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Detalles <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span></label>
                <textarea
                  id="dispute-message"
                  maxLength={4000}
                  placeholder="Contá qué pasó y qué esperabas."
                  className="mv-input h-auto min-h-[110px] resize-y py-3"
                  value={reportData.message}
                  onChange={(e) => setReportData({ ...reportData, message: e.target.value })}
                />
              </div>
              {disputeError && (
                <p id="dispute-error" role="alert" className="flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {disputeError}
                </p>
              )}
            </div>

            <DialogFooter className="m-0 flex flex-col-reverse gap-3 rounded-none border-t-0 bg-transparent p-0 sm:flex-row">
              <button type="button" disabled={disputeLoading} onClick={() => setIsReportModalOpen(false)} className={buttonClass("ghost", "md", "w-full sm:flex-1")}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleOpenDispute}
                disabled={disputeLoading || reportData.subject.trim().length < REASON_MIN}
                aria-busy={disputeLoading}
                className={buttonClass("secondary", "md", "w-full border-red-500/40 text-red-400 sm:flex-[2]")}
              >
                {disputeLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {disputeLoading ? "Abriendo disputa…" : "Iniciar disputa"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalles de factura (imprimible) */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent
          id="order-invoice"
          className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-[1.75rem] p-0 outline-none sm:max-w-lg"
        >
          {isInvoiceOpen && (
            <style>{`@media print {
              body * { visibility: hidden !important; }
              #order-invoice, #order-invoice * { visibility: visible !important; color: #111 !important; border-color: #ddd !important; }
              #order-invoice { position: absolute !important; inset: 0 auto auto 0 !important; transform: none !important; width: 100% !important; max-width: none !important; max-height: none !important; overflow: visible !important; background: #fff !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; border: 0 !important; }
            }`}</style>
          )}
          <div className="p-6 sm:p-8">
            <DialogHeader className="space-y-2 pr-10 text-left">
              <p className="mv-kicker">Mercav · comprobante del pedido</p>
              <DialogTitle className="mv-h3">Detalles de factura</DialogTitle>
              <DialogDescription className="text-sm text-[var(--text-secondary)]">
                Pedido <span className="mv-data break-all text-[var(--text-primary)]">{order.id}</span>
              </DialogDescription>
            </DialogHeader>

            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--text-secondary)]">Fecha del pedido</dt>
                <dd className="mv-data mt-0.5 text-[var(--text-primary)]">{fmtDateTime(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Estado</dt>
                <dd className="mt-0.5 text-[var(--text-primary)]">{statusLabels[status] || status}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Cliente</dt>
                <dd className="mt-0.5 break-words text-[var(--text-primary)]">{order.client?.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Profesional</dt>
                <dd className="mt-0.5 break-words text-[var(--text-primary)]">{order.service?.provider?.name}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-[var(--mv-hairline)] pt-5">
              <p className="font-medium text-[var(--text-primary)]">{order.service.title}</p>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Paquete {order.package?.name}{order.package?.deliveryDays ? ` · entrega en ${order.package.deliveryDays} días` : ''}
              </p>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Total del pedido</dt>
                  <dd className="mv-data text-base font-medium text-[var(--text-primary)]">${fmtMoney(order.totalPrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Comisión de la plataforma</dt>
                  <dd className="mv-data text-[var(--text-primary)]">${fmtMoney(order.platformFee)}</dd>
                </div>
                {isProvider && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--text-secondary)]">Neto para el profesional</dt>
                    <dd className="mv-data text-[var(--text-primary)]">${fmtMoney(order.providerPayout)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-6 border-t border-[var(--mv-hairline)] pt-5">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Pagos registrados</h3>
              {(order.transactions || []).length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {order.transactions.map((t: any) => (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <span className="mv-data text-[var(--text-secondary)]">{fmtDateTime(t.createdAt)}</span>
                      <span className="mv-data text-[var(--text-primary)]">
                        {fmtMoney(t.amount)} {String(t.currency || '').toUpperCase()} · {transactionLabels[t.status] || t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">No hay un pago vinculado a este pedido en el registro.</p>
              )}
              {paidTransactions.length > 0 && (
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">El pago queda retenido en Mercav hasta que el cliente aprueba la entrega final.</p>
              )}
            </div>

            <p className="mt-6 text-xs text-[var(--text-tertiary)]">
              Resumen generado con los datos del pedido en Mercav el {fmtDateTime(new Date())}.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 print:hidden sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsInvoiceOpen(false)} className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
                Cerrar
              </button>
              <button type="button" onClick={() => window.print()} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
                <Printer className="h-4 w-4" aria-hidden /> Imprimir o guardar PDF
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Historial del pedido */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-[1.75rem] p-0 outline-none sm:max-w-lg">
          <div className="p-6 sm:p-8">
            <DialogHeader className="space-y-2 pr-10 text-left">
              <DialogTitle className="mv-h3">Historial del pedido</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Estado actual: <span className="font-medium text-[var(--text-primary)]">{statusLabels[status] || status}</span>
                {order.updatedAt && <> · última actualización <span className="mv-data">{fmtDateTime(order.updatedAt)}</span></>}
              </DialogDescription>
            </DialogHeader>

            <ol className="relative mt-6 flex flex-col gap-5 border-l border-[var(--mv-hairline-strong)] pl-6">
              {historyEvents.map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className={`absolute -left-[1.84rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-bg-secondary)] ${e.upcoming ? 'border border-gold bg-transparent' : 'bg-gold'}`}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">{e.title}</p>
                  {e.detail && <p className="mt-0.5 break-words text-sm text-[var(--text-secondary)]">{e.detail}</p>}
                  <p className="mv-data mt-0.5 text-xs text-[var(--text-tertiary)]">
                    <time dateTime={new Date(e.at).toISOString()}>{fmtDateTime(e.at)}</time>
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-6 text-xs leading-relaxed text-[var(--text-tertiary)]">
              Mostramos los hechos con fecha registrada: creación, pagos, hitos, archivos, reclamos, reseñas y cierre. Los cambios intermedios de estado no se guardan por separado.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
// creado por pato dev y askforvini
