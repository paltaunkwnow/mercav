"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCircle2, XCircle, Info, Briefcase, Megaphone, Loader2, ShieldAlert, Users, ChevronRight } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { HostLink } from "@/components/layout/HostContext";
import { PWN_NOTIFICATIONS_UPDATED } from "@/components/pwn/events";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    const onPwn = () => {
      void fetchNotifications();
    };
    window.addEventListener(PWN_NOTIFICATIONS_UPDATED, onPwn);
    return () => {
      clearInterval(interval);
      window.removeEventListener(PWN_NOTIFICATIONS_UPDATED, onPwn);
    };
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true })
      });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "JOB_APPLICATION_STATUS": return <Briefcase size={16} className="text-blue-400" />;
      case "NEW_APPLICATION": return <Users size={16} className="text-gold" />;
      case "NEW_RESERVATION": return <Megaphone size={16} className="text-emerald-400" />;
      case "PWN_NEW_LEAKS": return <ShieldAlert size={16} className="text-gold" />;
      case "PWN_MONITOR_AUTH_REQUEST": return <ShieldAlert size={16} className="text-gold" />;
      case "PWN_MONITOR_AUTH_APPROVED": return <CheckCircle2 size={16} className="text-gold" />;
      case "PWN_MONITOR_AUTH_DENIED": return <XCircle size={16} className="text-red-300" />;
      default: return <Info size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
        aria-expanded={isOpen}
        className={`mv-focus relative h-9 w-9 rounded-full text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] transition-colors ${isOpen ? 'text-gold bg-gold/10' : ''}`}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unreadCount > 0 && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 border-2 border-[var(--color-bg-primary)] rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {mounted && createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[150] bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: "top right" }}
              role="dialog"
              aria-label="Notificaciones"
              className="mv-menu fixed right-3 top-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4.5rem)] w-[min(24rem,calc(100vw-1.5rem))] rounded-[1.5rem] z-[160] overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-bold text-white flex items-center gap-2">
                  Notificaciones
                  {unreadCount > 0 && <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-full text-[9px] font-black">{unreadCount} nuevas</span>}
                </h3>
                <button 
                  onClick={() => markAsRead()}
                  className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                  Marcar todo leido
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gold animate-spin mb-2" />
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Sincronizando...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-30">
                    <Bell size={40} className="mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-5 transition-colors hover:bg-white/[0.03] relative group ${!n.isRead ? 'bg-white/[0.02]' : ''}`}
                      >
                        {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />}
                        <div className="flex gap-4">
                          <div className="mt-1 flex-shrink-0">
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-xs font-bold transition-colors ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>{n.title}</p>
                              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{n.body}</p>
                            {n.link && (
                              <HostLink
                                href={n.link}
                                onClick={() => {
                                  markAsRead(n.id);
                                  setIsOpen(false);
                                }}
                                className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors"
                              >
                                Revisar <ChevronRight size={12} className="ml-1" />
                              </HostLink>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                 <HostLink href="/dashboard" onClick={() => setIsOpen(false)} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">
                    Ver todo en el Dashboard
                 </HostLink>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
// creado por pato dev y askforvini
