"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { 
  MessageSquare, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  User,
  Loader2,
  ArrowLeft,
  Circle,
  UserPlus,
  X,
  CheckCircle2,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { Toast } from "@/components/ui/toast";

function MensajesUI() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [convsLoading, setConvsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const [searchConvQuery, setSearchConvQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = (session?.user as any)?.id;
  const isAuthLoading = status === "loading";

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status]);

  const [adminUser, setAdminUser] = useState<any>(null);

  const fetchConversations = async () => {
    setConvsLoading(true);
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      
      let convs = data.success ? data.data : [];

      // Check if admin chat exists
      const adminConv = convs.find((c: any) => 
        c.participants.some((p: any) => p.email === 'admin@mercav.lat')
      );

      if (!adminConv) {
        // Fetch Admin user info to show virtual chat
        const aRes = await fetch('/api/search?q=admin&tipo=users');
        const aData = await aRes.json();
        const admin = aData.data?.users?.find((u: any) => u.username === 'admin');
        if (admin) {
          setAdminUser(admin);
          // Prepend virtual conversation
          convs = [{
            id: 'virtual-admin',
            isVirtual: true,
            participants: [admin, session?.user],
            messages: [{
              id: 'admin-welcome-virtual',
              content: encryptMessage("¡Hola! Bienvenido al canal oficial de Soporte Mercav. 🛡️\n\nEstamos aquí para ayudarte 24/7 con:\n• Reportes de fraude o usuarios sospechosos.\n• Problemas técnicos con tu POS o publicaciones.\n• Dudas sobre pagos y comisiones.\n• Sugerencias para mejorar la plataforma.\n\nEscríbenos tu duda detallada y un miembro de nuestro staff te atenderá lo antes posible."),
              senderId: admin.id,
              createdAt: new Date().toISOString()
            }]
          }, ...convs];
        }
      }

      setConversations(convs);
    } catch (err) {
      console.error(err);
    } finally {
      setConvsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        const decryptedMessages = data.data.map((m: any) => ({
          ...m,
          content: decryptMessage(m.content)
        }));

        // Prepend official welcome if it's the admin chat
        const isAdminChat = selectedConv.participants.some((p: any) => p.email === 'admin@mercav.lat');
        if (isAdminChat) {
          decryptedMessages.unshift({
            id: 'admin-welcome',
            content: "¡Hola! Bienvenido al canal oficial de Soporte Mercav. 🛡️\n\nEstamos aquí para ayudarte 24/7 con:\n• Reportes de fraude o usuarios sospechosos.\n• Problemas técnicos con tu POS o publicaciones.\n• Dudas sobre pagos y comisiones.\n• Sugerencias para mejorar la plataforma.\n\nEscríbenos tu duda detallada y un miembro de nuestro staff te atenderá lo antes posible.",
            senderId: selectedConv.participants.find((p: any) => p.email === 'admin@mercav.lat')?.id,
            createdAt: selectedConv.createdAt,
            isOfficial: true
          });
        }

        setMessages(decryptedMessages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    const convId = searchParams?.get("convId");
    const toUserId = searchParams?.get("to");

    if (!isAuthLoading && currentUserId) {
      if (convId) {
        if (selectedConv?.id === convId) return;
        
        const conv = conversations.find(c => c.id === convId);
        if (conv) {
          setSelectedConv(conv);
        } else if (!convsLoading) {
          // If not in list and not loading, we must be missing it
          // Wait for next fetch or handle manually
        }
      } else if (toUserId && !convId) {
        if (toUserId === currentUserId) {
          router.replace('/mensajes');
          return;
        }
        handleDirectContact(toUserId);
      }
    }
  }, [searchParams, conversations, isAuthLoading, currentUserId, selectedConv?.id, convsLoading]);

  const [isContacting, setIsContacting] = useState<string | null>(null);

  const handleDirectContact = async (userId: string) => {
    if (userId === currentUserId) {
      setToast({ visible: true, message: "No puedes enviarte mensajes a ti mismo.", type: "error" });
      return;
    }
    
    setIsContacting(userId);
    try {
      const res = await fetch('/api/messages/contact', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, context: "GENERAL" }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setSelectedConv(data.conversation);
        router.replace(`/mensajes?convId=${data.conversationId}`);
        fetchConversations();
        setIsSearchOpen(false);
      } else {
        setToast({ visible: true, message: data.error || "No se pudo iniciar la conversación", type: "error" });
      }
    } catch (err) {
      console.error("Error in handleDirectContact:", err);
      setToast({ visible: true, message: "Error de conexión al iniciar el chat", type: "error" });
    } finally {
      setIsContacting(null);
    }
  };

  useEffect(() => {
    if (selectedConv && !selectedConv.isVirtual) {
      fetchMessages(selectedConv.id);
    } else if (selectedConv?.isVirtual) {
      const decryptedVirtual = selectedConv.messages.map((m: any) => ({
        ...m,
        content: decryptMessage(m.content)
      }));
      setMessages(decryptedVirtual);
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) {
      setUserSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&tipo=users`);
      const data = await res.json();
      if (data.success) {
        setUserSearchResults(data.data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    let targetConvId = selectedConv.id;

    // If it's the virtual admin chat, create it for real first
    if (selectedConv.isVirtual && adminUser) {
      try {
        const res = await fetch('/api/messages/contact', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: adminUser.id, context: "GENERAL" }),
        });
        const data = await res.json();
        if (data.success) {
          targetConvId = data.conversationId;
          setSelectedConv(data.conversation);
        } else {
          setToast({ visible: true, message: "Error al contactar soporte", type: "error" });
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    const originalMessage = newMessage;
    const encryptedMessage = encryptMessage(originalMessage);
    setNewMessage("");

    try {
      const res = await fetch(`/api/conversations/${targetConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: encryptedMessage }),
      });
      const data = await res.json();
      if (data.success) {
        const decryptedNewMsg = { ...data.data, content: originalMessage };
        setMessages(prev => [...prev, decryptedNewMsg]);
        fetchConversations(); // Refresh list to remove virtual and show real
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (participants: any[]) => {
    return participants.find(p => p.id !== currentUserId) || participants[0];
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] w-full max-w-[1600px] mx-auto bg-[#050505] overflow-hidden mt-16">
      {/* Sidebar */}
      <div className={`w-full md:w-[450px] border-r border-white/5 flex flex-col bg-bg-primary relative z-20 ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-black text-white tracking-tighter">Mensajes</h1>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-3 bg-white/5 hover:bg-gold hover:text-black rounded-2xl transition-all border border-white/5"
            >
              <UserPlus size={20} />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors w-4 h-4" />
            <input 
              placeholder="Buscar conversaciones..."
              value={searchConvQuery}
              onChange={(e) => setSearchConvQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold/30 transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {convsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-40">
              <MessageSquare size={48} className="text-gray-700 mb-4" />
              <p className="text-sm text-gray-500">No tienes chats activos aún. ¡Inicia uno nuevo!</p>
            </div>
          ) : (
            conversations
              .filter(conv => {
                const other = getOtherParticipant(conv.participants);
                return other?.name?.toLowerCase().includes(searchConvQuery.toLowerCase());
              })
              .map((conv) => {
              const other = getOtherParticipant(conv.participants);
              const lastMsg = conv.messages?.[0];
              const isSelected = selectedConv?.id === conv.id;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-5 flex items-center gap-4 transition-all relative group border-b border-white/[0.02] ${
                    isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold shadow-[0_0_15px_rgba(255,215,0,0.5)]" />}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.name || 'User'}`} 
                      className={`w-14 h-14 rounded-2xl object-cover border-2 transition-all ${isSelected ? 'border-gold shadow-lg shadow-gold/20' : 'border-white/5'}`}
                      alt={other?.name}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-bg-primary rounded-full shadow-lg" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-bold truncate text-sm ${isSelected ? 'text-gold' : 'text-white'}`}>{other?.name}</h3>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {other?.profile?.headline && (
                      <p className="text-[9px] text-gold/60 font-black uppercase tracking-widest mb-1 truncate">{other.profile.headline}</p>
                    )}
                    <p className="text-xs text-gray-400 truncate pr-4">
                      {lastMsg?.senderId === currentUserId ? <span className="text-gold font-bold mr-1">Tú:</span> : ''}
                      {lastMsg ? decryptMessage(lastMsg.content) : 'Empezar chat...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#080808] relative ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <header className="p-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-3xl flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 text-gray-400 hover:text-white mr-2">
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <img 
                    src={getOtherParticipant(selectedConv.participants)?.avatar || `https://ui-avatars.com/api/?name=${getOtherParticipant(selectedConv.participants)?.name}`} 
                    className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                    alt="Chat"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#080808] rounded-full" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                    {getOtherParticipant(selectedConv.participants)?.name}
                    <ShieldCheck size={18} className="text-gold" />
                  </h2>
                  <p className="text-[11px] text-gold font-black uppercase tracking-[0.15em]">Seguridad: Cifrado de extremo a extremo</p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                 <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-3 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                 >
                   <MoreVertical size={20} />
                 </button>

                 <AnimatePresence>
                   {isMenuOpen && (
                     <>
                       <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                       <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                       >
                         <div className="p-2 space-y-1">
                           <Link 
                            href={`/perfil/${getOtherParticipant(selectedConv.participants)?.id}`}
                            className="flex items-center gap-3 p-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                           >
                             <User size={16} /> Ver Perfil
                           </Link>
                           <button className="w-full flex items-center gap-3 p-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                             <Trash2 size={16} /> Borrar Chat
                           </button>
                         </div>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <AnimatePresence initial={false}>
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                  </div>
                ) : messages.map((m, i) => {
                  const isMine = m.senderId === currentUserId;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={m.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] group relative`}>
                         <div className={`px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed shadow-2xl ${
                          isMine 
                            ? "bg-gold text-black font-medium rounded-tr-none" 
                            : "bg-white/[0.03] border border-white/5 text-gray-200 rounded-tl-none"
                        }`}>
                          {decryptMessage(m.content)}
                        </div>
                        <div className={`mt-2 text-[9px] font-black uppercase tracking-widest text-gray-600 ${isMine ? "text-right" : "text-left"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-4 w-full">
                <div className="flex gap-2">
                  <button type="button" className="p-3 text-gray-500 hover:text-gold transition-colors bg-white/5 rounded-2xl border border-white/5"><Paperclip size={20} /></button>
                  <button type="button" className="p-3 text-gray-500 hover:text-gold transition-colors bg-white/5 rounded-2xl border border-white/5"><Smile size={20} /></button>
                </div>
                <div className="relative flex-1">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje con seguridad..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] h-14 pl-6 pr-12 text-sm text-white focus:outline-none focus:border-gold/30 transition-all placeholder:text-gray-600"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gold text-black rounded-xl hover:bg-gold-light transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-center mb-8 relative">
                <MessageSquare size={40} className="text-gold" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold text-black rounded-full flex items-center justify-center text-[10px] font-black">!</div>
             </div>
             <h2 className="text-3xl font-display font-black text-white mb-4 tracking-tighter">Tus Conversaciones Seguras</h2>
             <p className="text-gray-500 max-w-md leading-relaxed">
               Selecciona un chat de la lista lateral o busca un nuevo profesional para iniciar una comunicación cifrada de extremo a extremo.
             </p>
             <Button 
               onClick={() => setIsSearchOpen(true)}
               className="mt-8 bg-white/5 hover:bg-gold hover:text-black border border-white/10 rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px]"
             >
               Buscar Personas
             </Button>
          </div>
        )}
      </div>

      {/* User Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-bg-secondary border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <UserPlus className="text-gold" /> Iniciar Nueva Conversación
                </h3>
                <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <div className="relative mb-8">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
                  <input 
                    autoFocus
                    placeholder="Escribe el nombre o @usuario..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-16 pl-16 pr-6 text-lg text-white focus:outline-none focus:border-gold/50 transition-all shadow-xl"
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                  {isSearchingUsers ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Buscando profesionales...</p>
                    </div>
                  ) : userSearchResults.length > 0 ? (
                    userSearchResults.map((u) => (
                      <button 
                        key={u.id}
                        onClick={() => handleDirectContact(u.id)}
                        className="w-full flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-gold/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                          <div className="text-left">
                            <p className="font-bold text-white group-hover:text-gold transition-colors">{u.name}</p>
                            <p className="text-xs text-gray-500 font-mono">@{u.username || 'usuario'}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isContacting === u.id ? "bg-white/10 text-gray-400" : "bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black"
                        }`}>
                          {isContacting === u.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Escribir"
                          )}
                        </div>
                      </button>
                    ))
                  ) : userSearchQuery ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 italic">No encontramos a nadie con ese nombre.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 opacity-30">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Comienza a escribir para buscar</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

export default function MensajesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    }>
      <MensajesUI />
    </Suspense>
  );
}
