"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

interface OrderDashboardClientProps {
  order: any;
  user: any;
  initialMessages: any[];
  conversationId: string | null;
  isProvider: boolean;
}

export default function OrderDashboardClient({ 
  order, 
  user, 
  initialMessages,
  conversationId,
  isProvider 
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'IN_PROGRESS': return 'text-gold bg-gold/10 border-gold/30';
      case 'IN_REVIEW': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  const otherUser = isProvider ? order.client : order.service.provider;

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-gold selection:text-black pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
        >
          <div className="space-y-4">
            <Link href="/dashboard/pedidos">
              <Button variant="ghost" className="text-gray-400 hover:text-white p-0 hover:bg-transparent group transition-all">
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> TODOS LOS PEDIDOS
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter uppercase">{order.service.title}</h1>
              <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <span className="text-green-500 text-[10px] font-black tracking-[0.2em] uppercase">{status}</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium tracking-tight">ID de Proyecto: <span className="text-white font-black">{order.id.slice(-8).toUpperCase()}</span></p>
          </div>
          
          <div className="flex gap-4">
            {isProvider && status === 'PENDING' && (
              <Button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="bg-gold hover:bg-gold/90 text-black font-black px-8 h-14 rounded-2xl">
                <Zap className="mr-2 w-5 h-5" /> Comenzar Proyecto
              </Button>
            )}
            {isProvider && status === 'IN_PROGRESS' && (
              <Button onClick={() => handleUpdateStatus('IN_REVIEW')} className="bg-gold hover:bg-gold/90 text-black font-black px-8 h-14 rounded-2xl">
                <CheckCircle2 className="mr-2 w-5 h-5" /> Entregar Proyecto
              </Button>
            )}
            {!isProvider && status === 'IN_REVIEW' && (
              <Button onClick={() => handleUpdateStatus('COMPLETED')} className="bg-green-500 hover:bg-green-600 text-white font-black px-8 h-14 rounded-2xl">
                <CheckCircle2 className="mr-2 w-5 h-5" /> Aprobar y Finalizar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="w-14 h-14 rounded-2xl border border-white/10 hover:bg-white/5 p-0 focus:ring-0 flex items-center justify-center bg-transparent text-gray-500 cursor-pointer">
                <MoreVertical size={20} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0c] border-white/10 text-white rounded-2xl p-2 shadow-2xl">
                <DropdownMenuItem className="rounded-xl hover:bg-white/5 py-3 cursor-pointer">
                  <FileText className="mr-2 h-4 w-4 text-gold" /> Ver detalles de factura
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl hover:bg-white/5 py-3 cursor-pointer">
                  <Clock className="mr-2 h-4 w-4 text-gold" /> Ver historial de estados
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsReportModalOpen(true)}
                  className="rounded-xl hover:bg-red-500/10 text-red-400 py-3 cursor-pointer"
                >
                  <AlertCircle className="mr-2 h-4 w-4" /> Cancelar / Disputa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Area: Chat & Files */}
          <div className="lg:col-span-8 space-y-8">
            {/* Chat Box */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] flex flex-col h-[600px] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}`} alt={otherUser.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{otherUser.name}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      {isProvider ? 'Cliente' : 'Profesional'} • En línea
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Activo</span>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide scroll-smooth"
              >
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center h-full text-center py-12"
                    >
                      <MessageSquare size={48} className="text-white/5 mb-4" />
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No hay mensajes aún</p>
                    </motion.div>
                  ) : (
                    messages.map((message: any) => (
                      <motion.div 
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] flex flex-col ${message.senderId === user.id ? 'items-end' : 'items-start'}`}>
                          <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                            message.senderId === user.id 
                              ? 'bg-gold text-black font-medium rounded-tr-none shadow-lg shadow-gold/10' 
                              : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                          }`}>
                            {message.content}
                          </div>
                          <span className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-tighter">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-end gap-4 bg-[#121212] border border-white/10 rounded-2xl p-4 group focus-within:border-gold/30 transition-all">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gold transition-colors"
                  >
                    <Paperclip size={20} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gold transition-colors"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none h-10 scrollbar-hide"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 rounded-xl bg-gold text-black flex items-center justify-center hover:scale-110 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Files & Deliveries Section */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold flex items-center gap-3">
                    <Paperclip className="text-gold" size={20} /> Archivos compartidos
                  </h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-gold hover:underline">Ver todos</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {files.length > 0 ? (
                    files.map(file => (
                      <div key={file.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file.type === 'pdf' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {file.type === 'pdf' ? <FileText size={24} /> : <ImageIcon size={24} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white mb-1 group-hover:text-gold transition-colors">{file.name}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{file.size} • {file.date}</p>
                            </div>
                        </div>
                        <button 
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-2 text-gray-600 hover:text-white transition-colors"
                        >
                            <Download size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                       <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Aún no hay archivos compartidos</p>
                    </div>
                  )}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/5 rounded-2xl p-4 flex items-center justify-center hover:border-gold/30 hover:bg-gold/5 transition-all cursor-pointer group"
                  >
                     <div className="flex items-center gap-3 text-gray-500 group-hover:text-gold">
                        <Upload size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Subir Archivo</span>
                     </div>
                  </div>
               </div>

               {/* File Upload Disclaimer */}
               <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex gap-3">
                     <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Información de Archivos</p>
                        <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                          El límite de carga directa es de <span className="text-gold font-bold">5MB</span>. Para archivos más pesados, recomendamos usar servicios externos (Google Drive, Dropbox) y compartir el enlace en el chat.
                        </p>
                        <p className="text-[9px] text-red-500/70 leading-relaxed font-bold uppercase tracking-tighter pt-1">
                          Está estrictamente prohibido subir software malicioso, virus o contenido ilegal. Todo archivo es monitoreado.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar: Details & Info */}
          <div className="lg:col-span-4 space-y-8">
            {/* Progress Card */}
            <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-[2.5rem] p-8 shadow-2xl">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gold mb-6">Estado del Proyecto</h4>
               <div className="mb-6">
                  <div className="flex justify-between items-end mb-3">
                     <span className="text-2xl font-black text-white">{progress}%</span>
                     <span className="text-[10px] font-bold text-gray-500 uppercase">{status.replace('_', ' ')}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                     />
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                     <CheckCircle2 className={`w-4 h-4 ${progress >= 10 ? 'text-gold' : 'text-gray-700'}`} />
                     <span className={progress >= 10 ? 'text-white font-bold' : ''}>Briefing y Requerimientos</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                     <CheckCircle2 className={`w-4 h-4 ${progress >= 40 ? 'text-gold' : 'text-gray-700'}`} />
                     <span className={progress >= 40 ? 'text-white font-bold' : ''}>En Desarrollo</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                     <CheckCircle2 className={`w-4 h-4 ${progress >= 80 ? 'text-gold' : 'text-gray-700'}`} />
                     <span className={progress >= 80 ? 'text-white font-bold' : ''}>Entrega y Revisión</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                     <CheckCircle2 className={`w-4 h-4 ${progress >= 100 ? 'text-gold' : 'text-gray-700'}`} />
                     <span className={progress >= 100 ? 'text-white font-bold' : ''}>Finalizado</span>
                  </div>
               </div>
            </div>

            {/* Order Info */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Detalles del Pedido</h4>
                  <div className="space-y-6">
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Paquete</span>
                        <span className="text-xs text-white font-black uppercase tracking-widest">{order.package.name}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Monto</span>
                        <span className="text-xl font-mono font-black text-gold">${order.totalPrice}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Entrega</span>
                        <div className="flex items-center gap-2 text-white text-xs font-bold">
                           <Clock size={14} className="text-gold" /> {order.package.deliveryDays} Días
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Protección Mercav</h4>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-4">
                     <ShieldCheck className="text-emerald-500 w-6 h-6 shrink-0" />
                     <p className="text-[10px] text-gray-400 leading-relaxed">
                        Tus fondos están protegidos en nuestro sistema Escrow. El pago se liberará al profesional solo cuando apruebes la entrega final.
                     </p>
                  </div>
               </div>
               
               <Button 
                onClick={() => setIsReportModalOpen(true)}
                variant="outline" 
                className="w-full h-12 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/5 font-black uppercase text-[10px] tracking-[0.2em]"
               >
                  <AlertCircle className="mr-2 w-4 h-4" /> Reportar Problema
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="bg-[#080808] border-black text-white rounded-[2rem] p-0 max-w-md overflow-hidden backdrop-blur-2xl shadow-2xl ring-0 focus:ring-0 outline-none">
          <div className="bg-gradient-to-br from-red-500/10 via-transparent to-transparent p-8">
            <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <ShieldAlert className="text-red-500 w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight">Centro de Disputas</DialogTitle>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-60">Resolución de conflictos Mercav</p>
                </div>
              </div>
              <DialogDescription className="text-gray-400 text-[13px] leading-relaxed">
                Describe el inconveniente detalladamente. Nuestro equipo legal emitirá un veredicto justo revisando el chat.
              </DialogDescription>
              
              <div className="mt-4 p-4 bg-white/[0.03] border border-white/5 rounded-xl relative overflow-hidden">
                <div className="flex gap-3 relative z-10">
                  <ShieldCheck size={16} className="text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gold">Política de Resolución</p>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Resultados: <span className="text-white font-bold">Reembolso Parcial</span>, <span className="text-white font-bold">Total</span> o <span className="text-white font-bold">Denegación</span>.
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Motivo</label>
                <Input 
                  placeholder="Ej: Retraso en la entrega" 
                  className="bg-white/[0.03] border-white/10 rounded-xl h-12 px-4 focus:border-red-500/50 text-sm"
                  value={reportData.subject}
                  onChange={(e) => setReportData({ ...reportData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Detalles</label>
                <Textarea 
                  placeholder="Explica la situación..." 
                  className="bg-white/[0.03] border-white/10 rounded-xl min-h-[100px] px-4 focus:border-red-500/50 text-sm py-3"
                  value={reportData.message}
                  onChange={(e) => setReportData({ ...reportData, message: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:flex-row flex-col-reverse mt-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsReportModalOpen(false)} 
                className="rounded-xl h-12 border-white/5 hover:bg-white/5 text-gray-500 font-bold text-xs flex-1"
              >
                Cancelar
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 flex-[2] transition-all">
                Iniciar Disputa
              </Button>
            </DialogFooter>
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
