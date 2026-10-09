"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Foto de perfil del equipo. Si el archivo todavía no está en /public, muestra las iniciales en letra de cartel
 * en vez de una imagen rota.
 */
export function ProfilePhoto({ src, alt, initials, position = "center 25%", className }: { src: string; alt: string; initials: string; position?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div role="img" aria-label={alt} className={cn("c-band c-ink-green grid h-full w-full place-items-center", className)}>
        <span className="c-display text-[clamp(5rem,4rem+6vw,9rem)] leading-none">{initials}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} width={960} height={1280} decoding="async" onError={() => setFailed(true)} style={{ objectPosition: position }} className={cn("h-full w-full object-cover", className)} />;
}
// creado por pato dev y askforvini
