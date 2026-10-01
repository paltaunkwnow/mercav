"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Hash, ShieldCheck } from "lucide-react";
import { ThreadView } from "@/components/kosher/ThreadView";
import { PageIntro } from "@/components/kosher/ui";
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
      <PageIntro eyebrow="Chat" title="Chat de la comunidad">
        <p>Una sala por ciudad, y una conversación en la ficha de cada lugar. No hay chat global: lo que se habla queda cerca de donde pasa.</p>
      </PageIntro>

      <div className="mv-panel grid h-[min(72dvh,760px)] min-h-[520px] overflow-hidden rounded-[2rem] md:grid-cols-[300px_1fr]">
        <nav aria-label="Salas" className={cn("min-h-0 flex-col border-[var(--mv-hairline)] md:flex md:border-r", mobileRoomOpen ? "hidden" : "flex")}>
          <h2 className="px-5 pb-2 pt-5 text-sm font-semibold text-[var(--text-primary)]">Salas por ciudad</h2>
          <ul className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1">
            {rooms.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => open(r.key)}
                  aria-current={r.key === active ? "true" : undefined}
                  className={cn(
                    "mv-focus relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-200",
                    r.key === active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)]",
                  )}
                >
                  {r.key === active && (
                    <motion.span layoutId="room-active" aria-hidden className="absolute inset-0 rounded-2xl bg-techelet-dim ring-1 ring-inset ring-techelet/30" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />
                  )}
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] text-techelet">
                    <Hash className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.title}</span>
                    <span className="block truncate text-xs text-[var(--text-secondary)]">{r.subtitle}</span>
                  </span>
                  {r.count > 0 && <span className="mv-data relative text-xs text-[var(--text-secondary)]" aria-label={`${r.count} mensajes`}>{r.count}</span>}
                </button>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 border-t border-[var(--mv-hairline)] px-5 py-3 text-xs leading-snug text-[var(--text-secondary)]">
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
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center gap-2 border-b border-[var(--mv-hairline)] px-3 py-3 md:px-6">
                  <button type="button" onClick={() => setMobileRoomOpen(false)} aria-label="Volver a las salas" className="mv-focus grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden">
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{room.title}</h2>
                    <p className="text-xs text-[var(--text-secondary)]">{room.subtitle}</p>
                  </div>
                </div>
                <ThreadView threadKey={room.key} className="min-h-0 flex-1 p-4 md:p-6" />
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="m-auto px-6 text-center text-sm text-[var(--text-secondary)]">Elegí una sala para leer la conversación.</p>
          )}
        </section>
      </div>
    </div>
  );
}
