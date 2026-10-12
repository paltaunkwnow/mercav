"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, X } from "@/components/icons";

/**
 * "¿Estás en Montevideo? Ver la guía de Montevideo". La ciudad sale de la ubicación aproximada de la conexión (sin pedir
 * permiso). Cerrarla deja una cookie con esa ciudad para no volver a mostrarla; no se guarda nada en el servidor.
 */
export function LocationSuggestion({ slug, city, cookie }: { slug: string; city: string; cookie: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      document.cookie = `${cookie}=${encodeURIComponent(slug)}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax`;
    } catch {
      // Sin cookies se vuelve a sugerir en la próxima visita; nada más.
    }
  }

  return (
    <aside
      aria-label="Sugerencia de ciudad"
      className="mv-panel mb-6 flex items-center gap-3 py-2 pl-4 pr-2 shadow-[inset_0_0_0_1.5px_var(--k-accent)] sm:pl-5"
    >
      <MapPin className="h-5 w-5 shrink-0 text-[var(--k-accent)]" aria-hidden />
      <p className="min-w-0 flex-1 py-1.5 text-[0.95rem] leading-snug">
        <span className="font-semibold text-[var(--text-primary)]">¿Estás en {city}?</span>{" "}
        <Link href={`/kosher/ciudad/${slug}`} className="mv-focus rounded-md font-semibold text-[var(--k-accent)] underline-offset-4 hover:underline">
          Ver la guía de {city}
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={`Cerrar la sugerencia de ${city}`}
        className="mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </aside>
  );
}
// creado por pato dev y askforvini
