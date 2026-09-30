"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
  username: string;
  avatar: string | null;
  mine: boolean;
  flagged: boolean;
};

const POLL_MS = 4000;

function timeLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

export function ThreadView({
  threadKey,
  compact = false,
  className,
}: {
  threadKey: string;
  compact?: boolean;
  className?: string;
}) {
  const viewer = useKosherViewer();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const lastRef = useRef<string | null>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const load = useCallback(
    async (incremental: boolean) => {
      const after =
        incremental && lastRef.current
          ? `&after=${encodeURIComponent(lastRef.current)}`
          : "";
      const data = await kosherFetch<{ messages: Message[] }>(
        `/api/kosher/chat?thread=${encodeURIComponent(threadKey)}${after}`,
      );
      if (!incremental) {
        setMessages(data.messages);
      } else if (data.messages.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !ids.has(m.id))];
        });
      }
      const last = data.messages.at(-1);
      if (last) lastRef.current = last.createdAt;
      if (!incremental || data.messages.length) scrollToEnd();
    },
    [threadKey, scrollToEnd],
  );

  useEffect(() => {
    if (!viewer.signedIn) return;
    lastRef.current = null;
    setLoaded(false);
    load(false)
      .catch(() => setMessages([]))
      .finally(() => setLoaded(true));
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true).catch(() => {});
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [viewer.signedIn, load]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await kosherFetch("/api/kosher/chat", {
        method: "POST",
        json: { thread: threadKey, body: text },
      });
      setBody("");
      await load(true);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function flag(id: string) {
    try {
      await kosherFetch(`/api/kosher/chat/${id}`, { method: "POST" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, flagged: true } : m)),
      );
      toast.success("Gracias. Un moderador lo va a revisar.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await kosherFetch(`/api/kosher/chat/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (!viewer.signedIn) {
    return (
      <div className={cn("flex flex-col justify-center", className)}>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-bg-tertiary/60 p-5 text-sm">
          <p className="font-medium text-[var(--text-primary)]">
            La conversación es solo para miembros.
          </p>
          <p className="mt-1 text-[var(--text-secondary)]">
            Entrá con tu cuenta Mercav para leer y escribir. Así la comunidad
            sabe con quién habla.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/login?callbackUrl=/kosher/chat"
              className="inline-flex h-10 items-center rounded-full bg-gold px-4 text-sm font-semibold text-black"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-[var(--text-primary)]"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <ol
        ref={listRef}
        aria-live="polite"
        aria-label="Mensajes"
        className={cn(
          "scrollbar-hide min-h-0 flex-1 space-y-3 overflow-y-auto pr-1",
          compact ? "max-h-72" : "",
        )}
      >
        {!loaded && (
          <li className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-2xl bg-bg-tertiary"
                style={{ width: `${70 - i * 12}%` }}
              />
            ))}
          </li>
        )}
        {loaded && messages.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
            Todavía no hay mensajes. Contá qué encontraste, preguntá por
            horarios o avisá de una cena de Shabat.
          </li>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.li
              key={m.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={cn("group flex gap-2.5", m.mine && "flex-row-reverse")}
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-bg-tertiary text-xs font-semibold text-gold ring-1 ring-border">
                {m.avatar ? (
                  <img
                    src={m.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  m.author.slice(0, 1)
                )}
              </span>
              <div
                className={cn("min-w-0 max-w-[82%]", m.mine && "text-right")}
              >
                <div
                  className={cn(
                    "flex items-baseline gap-2 text-xs text-[var(--text-tertiary)]",
                    m.mine && "justify-end",
                  )}
                >
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {m.mine ? "Vos" : m.author}
                  </span>
                  <time dateTime={m.createdAt}>{timeLabel(m.createdAt)}</time>
                </div>
                <p
                  className={cn(
                    "mt-1 inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed",
                    m.mine
                      ? "rounded-tr-md bg-gold text-black"
                      : "rounded-tl-md border border-border bg-bg-secondary text-[var(--text-primary)]",
                  )}
                >
                  {m.body}
                </p>
                <div
                  className={cn(
                    "mt-1 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100",
                    m.mine && "justify-end",
                  )}
                >
                  {m.mine || viewer.isModerator ? (
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] text-[var(--text-tertiary)] hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden /> Borrar
                    </button>
                  ) : null}
                  {!m.mine && (
                    <button
                      type="button"
                      disabled={m.flagged}
                      onClick={() => flag(m.id)}
                      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] text-[var(--text-tertiary)] hover:text-red-500 disabled:opacity-60"
                    >
                      <Flag className="h-3 w-3" aria-hidden />{" "}
                      {m.flagged ? "Reportado" : "Reportar"}
                    </button>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {viewer.shabbatLocked ? (
        <p className="mt-3 rounded-2xl bg-techelet-dim px-4 py-3 text-sm text-[var(--text-secondary)]">
          Modo Shabat activo. Podés leer; escribir vuelve después de Havdalá.
        </p>
      ) : (
        <form
          onSubmit={send}
          className="mt-3 flex items-end gap-2 rounded-[1.4rem] border border-border bg-bg-secondary p-1.5 focus-within:border-gold/40"
        >
          <label htmlFor={`msg-${threadKey}`} className="sr-only">
            Escribí un mensaje
          </label>
          <textarea
            id={`msg-${threadKey}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="Escribí un mensaje breve…"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            aria-label="Enviar mensaje"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-black transition-transform active:scale-95 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
