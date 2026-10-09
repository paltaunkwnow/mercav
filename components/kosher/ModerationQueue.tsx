"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "@/components/icons";
import { toast } from "sonner";
import { kosherFetch } from "@/components/kosher/KosherViewer";
import { EmptyState, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { cn } from "@/lib/utils";

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
    return <EmptyState title="Todo al día">No hay nada pendiente de revisión.</EmptyState>;
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout={!reduce}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.2 } }}
            className="mv-panel p-5 md:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="mv-kicker !text-techelet">{KIND[item.kind].label}</p>
                <h2 className="mv-h3 mt-2">{item.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.meta}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--text-secondary)]">{item.detail}</p>
                {item.link ? (
                  <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="mv-focus mt-2 inline-flex min-h-10 items-center rounded text-sm font-semibold text-techelet underline underline-offset-4">
                    {item.link.label}
                  </a>
                ) : null}
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  {item.by} · {new Date(item.at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 md:flex">
                <button type="button" onClick={() => decide(item, "rejected")} className={cn(secondaryButton, "hover:!border-red-500/50 hover:text-red-500")}>
                  <X className="h-4 w-4" aria-hidden /> {KIND[item.kind].reject}
                </button>
                <button type="button" onClick={() => decide(item, "accepted")} className={primaryButton}>
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
