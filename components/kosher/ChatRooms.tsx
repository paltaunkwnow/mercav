"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Hash, ShieldCheck } from "lucide-react";
import { ThreadView } from "@/components/kosher/ThreadView";
import { cn } from "@/lib/utils";

type Room = { key: string; title: string; subtitle: string; count: number; lastAt: string | null };

export function ChatRooms({ rooms, initialKey }: { rooms: Room[]; initialKey: string | null }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(initialKey);
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);
  const room = rooms.find((r) => r.key === active) ?? null;

  function open(key: string) {
    setActive(key);
    setMobileRoomOpen(true);
    router.replace(`/kosher/chat?sala=${encodeURIComponent(key)}`, { scroll: false });
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">Chat de la comunidad</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          Una sala por ciudad, y una conversación en la ficha de cada lugar. No hay chat global: lo que se habla queda cerca de donde pasa.
        </p>
      </header>

      <div className="grid h-[min(72dvh,760px)] min-h-[520px] overflow-hidden rounded-[2rem] border border-border bg-bg-secondary md:grid-cols-[300px_1fr]">
        <nav aria-label="Salas" className={cn("min-h-0 flex-col border-border md:flex md:border-r", mobileRoomOpen ? "hidden" : "flex")}>
          <p className="px-5 pb-2 pt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--text-tertiary)]">Salas por ciudad</p>
          <ul className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1">
            {rooms.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => open(r.key)}
                  aria-current={r.key === active ? "true" : undefined}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    r.key === active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-bg-tertiary/60",
                  )}
                >
                  {r.key === active && (
                    <motion.span layoutId="room-active" className="absolute inset-0 rounded-2xl bg-gold/10 ring-1 ring-inset ring-gold/25" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                  )}
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-tertiary text-techelet">
                    <Hash className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.title}</span>
                    <span className="block truncate text-xs text-[var(--text-tertiary)]">{r.subtitle}</span>
                  </span>
                  {r.count > 0 && <span className="relative font-mono text-[11px] text-[var(--text-tertiary)]">{r.count}</span>}
                </button>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 border-t border-border px-5 py-3 text-[11px] leading-snug text-[var(--text-tertiary)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-techelet" aria-hidden />
            Solo miembros con cuenta Mercav. Tres reportes ocultan un mensaje hasta que lo revise un moderador.
          </p>
        </nav>

        <section className={cn("min-h-0 flex-col md:flex", mobileRoomOpen ? "flex" : "hidden")} aria-label={room ? `Sala ${room.title}` : "Sala"}>
          {room ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={room.key}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:px-6">
                  <button type="button" onClick={() => setMobileRoomOpen(false)} aria-label="Volver a las salas" className="grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)] md:hidden">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{room.title}</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">{room.subtitle}</p>
                  </div>
                </div>
                <ThreadView threadKey={room.key} className="min-h-0 flex-1 p-4 md:p-6" />
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="m-auto text-sm text-[var(--text-secondary)]">Elegí una sala.</p>
          )}
        </section>
      </div>
    </div>
  );
}
