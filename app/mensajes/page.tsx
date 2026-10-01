"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { 
  MessageSquare, 
  Search, 
  Send, 
  MoreVertical, 
  User,
  Loader2,
  ArrowLeft,
  UserPlus,
  X,
  SquarePen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BodyPortal } from "@/components/auth/BodyPortal";
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
  // Evita que una respuesta vieja pise los mensajes de otra conversación y
  // que el parámetro ?to= dispare varios POST de contacto mientras se actualiza la URL.
  const activeConvIdRef = useRef<string | null>(null);
  const contactingRef = useRef<string | null>(null);
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
              content: encryptMessage("¡Hola! Este es el canal oficial de soporte de Mercav.\n\nPodemos ayudarte con:\n• Reportes de fraude o usuarios sospechosos.\n• Problemas técnicos con tu POS o publicaciones.\n• Dudas sobre pagos y comisiones.\n• Sugerencias para mejorar la plataforma.\n\nEscribinos tu consulta con el mayor detalle posible y alguien del equipo te va a responder."),
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
      if (activeConvIdRef.current !== convId) return;
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
            content: "¡Hola! Este es el canal oficial de soporte de Mercav.\n\nPodemos ayudarte con:\n• Reportes de fraude o usuarios sospechosos.\n• Problemas técnicos con tu POS o publicaciones.\n• Dudas sobre pagos y comisiones.\n• Sugerencias para mejorar la plataforma.\n\nEscribinos tu consulta con el mayor detalle posible y alguien del equipo te va a responder.",
            senderId: selectedConv.participants.find((p: any) => p.email === 'admin@mercav.lat')?.id,
            createdAt: selectedConv.createdAt,
            isOfficial: true
          });
        }

        setMessages(decryptedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (activeConvIdRef.current === convId) setMessagesLoading(false);
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
        if (contactingRef.current === toUserId) return;
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
    
    contactingRef.current = userId;
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
      contactingRef.current = null;
    }
  };

  useEffect(() => {
    activeConvIdRef.current = selectedConv?.id ?? null;
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
      } else {
        setNewMessage(originalMessage);
        setToast({ visible: true, message: data.error || "No se pudo enviar el mensaje", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNewMessage(originalMessage);
      setToast({ visible: true, message: "Error de conexión al enviar el mensaje", type: "error" });
    }
  };

  const getOtherParticipant = (participants: any[]) => {
    return participants.find(p => p.id !== currentUserId) || participants[0];
  };

  const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const avatarFor = (u: any) => u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'Usuario')}&background=1a1a1a&color=D4AF37`;
  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv.participants);
    return other?.name?.toLowerCase().includes(searchConvQuery.toLowerCase());
  });
  const otherInThread = selectedConv ? getOtherParticipant(selectedConv.participants) : null;

  if (isAuthLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-bg-primary" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
        <span className="sr-only">Cargando mensajes</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[88rem] flex-col px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:px-6 md:pb-6 md:pt-28 lg:px-8">
      <div className="mv-panel flex min-h-0 flex-1 overflow-hidden rounded-[1.5rem] md:rounded-[1.75rem]">
        {/* Inbox */}
        <section
          aria-labelledby="inbox-title"
          className={`min-h-0 w-full flex-col border-r border-[var(--mv-hairline)] md:flex md:w-[22rem] lg:w-[24rem] ${selectedConv ? 'hidden' : 'flex'}`}
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 id="inbox-title" className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Mensajes</h1>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Nueva conversación"
                className="mv-btn mv-btn-secondary h-10 w-10 px-0"
              >
                <SquarePen className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </div>

            <div className="relative mt-4">
              <label htmlFor="conv-search" className="sr-only">Buscar conversaciones</label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
              <input
                id="conv-search"
                type="search"
                placeholder="Buscar conversaciones"
                value={searchConvQuery}
                onChange={(e) => setSearchConvQuery(e.target.value)}
                className="mv-input h-11 pl-10 text-[15px]"
              />
            </div>
          </div>

          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
            {convsLoading ? (
              <ul className="space-y-1 px-1" aria-label="Cargando conversaciones">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                    <span className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--mv-panel-hover)]" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-2/5 rounded-full bg-[var(--mv-panel-hover)]" />
                      <span className="block h-3 w-4/5 rounded-full bg-[var(--mv-panel-hover)]" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-[var(--text-tertiary)]">
                  <MessageSquare className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 font-semibold text-[var(--text-primary)]">Todavía no tenés conversaciones</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Buscá a una persona o empresa para escribirle.</p>
                <button type="button" onClick={() => setIsSearchOpen(true)} className="mv-btn mv-btn-primary mv-btn-sm mt-5">
                  Nueva conversación
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">Ninguna conversación coincide con “{searchConvQuery}”.</p>
            ) : (
              <ul className="space-y-0.5">
                {filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv.participants);
                  const lastMsg = conv.messages?.[0];
                  const isSelected = selectedConv?.id === conv.id;
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedConv(conv)}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`mv-focus relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-200 ${
                          isSelected ? 'bg-[var(--mv-panel-hover)]' : 'hover:bg-[var(--mv-panel-hover)]'
                        }`}
                      >
                        {isSelected && <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-gold" />}
                        <img
                          src={avatarFor(other)}
                          className="h-12 w-12 shrink-0 rounded-2xl border border-[var(--mv-hairline)] object-cover"
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{other?.name}</span>
                            {lastMsg && <span className="mv-data shrink-0 text-[11px] text-[var(--text-tertiary)]">{formatTime(lastMsg.createdAt)}</span>}
                          </span>
                          {other?.profile?.headline && (
                            <span className="block truncate text-xs text-[var(--text-tertiary)]">{other.profile.headline}</span>
                          )}
                          <span className="mt-0.5 block truncate text-sm text-[var(--text-secondary)]">
                            {lastMsg?.senderId === currentUserId ? <span className="font-medium text-[var(--text-primary)]">Vos: </span> : null}
                            {lastMsg ? decryptMessage(lastMsg.content) : 'Empezá la conversación'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Thread */}
        <section
          aria-label={otherInThread ? `Conversación con ${otherInThread.name}` : 'Conversación'}
          className={`min-h-0 flex-1 flex-col md:flex ${!selectedConv ? 'hidden' : 'flex'}`}
        >
          {selectedConv ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-[var(--mv-hairline)] px-3 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedConv(null)}
                    aria-label="Volver a la lista"
                    className="mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <img
                    src={avatarFor(otherInThread)}
                    className="h-10 w-10 shrink-0 rounded-xl border border-[var(--mv-hairline)] object-cover"
                    alt=""
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-[var(--text-primary)]">{otherInThread?.name}</h2>
                    {otherInThread?.profile?.headline ? (
                      <p className="truncate text-xs text-[var(--text-secondary)]">{otherInThread.profile.headline}</p>
                    ) : otherInThread?.username ? (
                      <p className="mv-data truncate text-xs text-[var(--text-secondary)]">@{otherInThread.username}</p>
                    ) : null}
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Opciones de la conversación"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    className="mv-focus grid h-10 w-10 place-items-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                  >
                    <MoreVertical className="h-5 w-5" aria-hidden />
                  </button>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} aria-hidden />
                      <div role="menu" className="mv-pop mv-menu absolute right-0 top-full z-20 mt-2 w-52 origin-top-right rounded-2xl p-1.5">
                        <Link
                          role="menuitem"
                          href={`/perfil/${otherInThread?.username || otherInThread?.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="mv-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)]"
                        >
                          <User className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden /> Ver perfil
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </header>

              <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6" role="log" aria-label="Mensajes">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center" role="status">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden />
                    <span className="sr-only">Cargando mensajes</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="font-semibold text-[var(--text-primary)]">Sin mensajes todavía</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Escribí el primero para empezar la conversación.</p>
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {messages.map((m, i) => {
                      const isMine = m.senderId === currentUserId;
                      const prev = messages[i - 1];
                      const grouped = prev && prev.senderId === m.senderId;
                      return (
                        <li key={m.id} className={`mv-fade flex ${isMine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'pt-2'}`}>
                          <div className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-relaxed ${
                                isMine
                                  ? 'rounded-[1.25rem] rounded-br-md bg-gold text-[var(--mv-on-gold)]'
                                  : 'rounded-[1.25rem] rounded-bl-md border border-[var(--mv-hairline)] bg-[var(--mv-panel-hover)] text-[var(--text-primary)]'
                              }`}
                            >
                              {decryptMessage(m.content)}
                            </div>
                            <time dateTime={m.createdAt ? new Date(m.createdAt).toISOString() : undefined} className="mv-data mt-1 px-1 text-[11px] text-[var(--text-tertiary)]">
                              {m.createdAt ? formatTime(m.createdAt) : ''}
                            </time>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[var(--mv-hairline)] p-2.5 sm:p-3">
                <form onSubmit={handleSendMessage} className="mv-menu flex items-center gap-2 rounded-full p-1.5 pl-4">
                  <label htmlFor="composer" className="sr-only">Mensaje para {otherInThread?.name}</label>
                  <input
                    id="composer"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribí un mensaje"
                    autoComplete="off"
                    enterKeyHint="send"
                    className="h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    aria-label="Enviar mensaje"
                    className="mv-btn mv-btn-primary h-11 w-11 shrink-0 px-0"
                  >
                    <Send className="h-[18px] w-[18px]" aria-hidden />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                <MessageSquare className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mv-h3 mt-5">Elegí una conversación</h2>
              <p className="mv-body mt-2 max-w-sm">Seleccioná un chat de la lista o buscá a una persona o empresa para escribirle.</p>
              <button type="button" onClick={() => setIsSearchOpen(true)} className="mv-btn mv-btn-secondary mt-6">
                <UserPlus className="h-4 w-4" aria-hidden /> Nueva conversación
              </button>
            </div>
          )}
        </section>
      </div>

      {/* New conversation dialog */}
      <BodyPortal>
        <AnimatePresence>
          {isSearchOpen && (
            <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-start sm:p-4 sm:pt-[12vh]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsSearchOpen(false)}
                aria-hidden
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-chat-title"
                onKeyDown={(e) => e.key === 'Escape' && setIsSearchOpen(false)}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="mv-menu relative flex max-h-[min(36rem,calc(100dvh-1.5rem))] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem]"
              >
                <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
                  <h2 id="new-chat-title" className="mv-h3">Nueva conversación</h2>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    aria-label="Cerrar"
                    className="mv-focus grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="px-5 sm:px-6">
                  <label htmlFor="user-search" className="sr-only">Buscar por nombre o usuario</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                    <input
                      id="user-search"
                      type="search"
                      autoFocus
                      autoComplete="off"
                      placeholder="Nombre o @usuario"
                      className="mv-input pl-10"
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="scrollbar-hide mt-3 min-h-[10rem] flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4" aria-live="polite">
                  {isSearchingUsers ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-secondary)]" role="status">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden /> Buscando…
                    </div>
                  ) : userSearchResults.length > 0 ? (
                    <ul className="space-y-0.5 pb-2">
                      {userSearchResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => handleDirectContact(u.id)}
                            disabled={isContacting === u.id}
                            className="mv-focus flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-200 hover:bg-[var(--mv-panel-hover)]"
                          >
                            <img src={avatarFor(u)} className="h-11 w-11 shrink-0 rounded-xl border border-[var(--mv-hairline)] object-cover" alt="" loading="lazy" decoding="async" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-[var(--text-primary)]">{u.name}</span>
                              <span className="mv-data block truncate text-xs text-[var(--text-secondary)]">@{u.username || 'usuario'}</span>
                            </span>
                            <span className="mv-chip mv-chip-gold shrink-0">
                              {isContacting === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Abriendo" /> : 'Escribir'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : userSearchQuery ? (
                    <p className="py-12 text-center text-sm text-[var(--text-secondary)]">No encontramos a nadie con ese nombre.</p>
                  ) : (
                    <p className="py-12 text-center text-sm text-[var(--text-tertiary)]">Escribí para buscar personas y empresas.</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </BodyPortal>

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
      <div className="flex h-[100dvh] items-center justify-center bg-bg-primary" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
        <span className="sr-only">Cargando mensajes</span>
      </div>
    }>
      <MensajesUI />
    </Suspense>
  );
}
// creado por pato dev y askforvini
