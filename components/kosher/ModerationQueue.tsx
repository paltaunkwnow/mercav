"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { kosherFetch } from "@/components/kosher/KosherViewer";

export type QueueItem = {
  kind: keyof typeof KIND;
  id: string;
  title: string;
  meta: string;
  detail: string;
  by: string;
  at: string;
  link?: { href: string; label: string };
};

const KIND = {
  place: { label: "Lugar nuevo", accept: "Publicar", reject: "Descartar" },
  edit: { label: "Corrección", accept: "Aplicar", reject: "Rechazar" },
  message: { label: "Mensaje reportado", accept: "Restaurar", reject: "Eliminar" },
  event: { label: "Evento de agenda", accept: "Publicar", reject: "Rechazar" },
  host: { label: "Mesa de Shabat", accept: "Aprobar anfitrión", reject: "Rechazar" },
  chesed: { label: "Tablón de jésed", accept: "Publicar", reject: "Rechazar" },
  ownership: { label: "Pedido de administración", accept: "Dar acceso", reject: "Rechazar" },
  certificate: { label: "Certificado de kashrut", accept: "Verificar", reject: "Rechazar" },
};

export function ModerationQueue({ items: initial }: { items: QueueItem[] }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState(initial);

  async function decide(item: QueueItem, decision: "accepted" | "rejected") {
    try {
      await kosherFetch("/api/kosher/moderation", { method: "POST", json: { kind: item.kind === "ownership" || item.kind === "certificate" ? "claim" : item.kind, id: item.id, decision } });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(decision === "accepted" ? KIND[item.kind].accept : KIND[item.kind].reject);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (items.length === 0) {
    return <p className="rounded-[2rem] border border-dashed border-border px-6 py-14 text-center text-[var(--text-secondary)]">No hay nada pendiente. Todo al día.</p>;
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout={!reduce}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.2 } }}
            className="rounded-[1.5rem] border border-border bg-bg-secondary p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-techelet">{KIND[item.kind].label}</p>
                <h2 className="mt-1 font-semibold text-[var(--text-primary)]">{item.title}</h2>
                <p className="text-xs text-[var(--text-tertiary)]">{item.meta}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--text-secondary)]">{item.detail}</p>
                {item.link ? (
                  <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-techelet underline-offset-4 hover:underline">
                    {item.link.label}
                  </a>
                ) : null}
                <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
                  {item.by} · {new Date(item.at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => decide(item, "rejected")} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-[var(--text-primary)] hover:border-red-500/50 hover:text-red-500">
                  <X className="h-4 w-4" aria-hidden /> {KIND[item.kind].reject}
                </button>
                <button type="button" onClick={() => decide(item, "accepted")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-semibold text-black">
                  <Check className="h-4 w-4" aria-hidden /> {KIND[item.kind].accept}
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
