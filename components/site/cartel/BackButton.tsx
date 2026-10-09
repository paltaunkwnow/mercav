"use client";

import { ArrowLeft } from "@/components/icons";
import { cn } from "@/lib/utils";

/** "Volver atrás" de las páginas de estado (sin historial, va al inicio). */
export function BackButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign("/"))}
      className={cn("c-btn c-btn-ghost", className)}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Volver atrás
    </button>
  );
}
// creado por pato dev y askforvini
